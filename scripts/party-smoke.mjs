/** Local Worker integration check. Run with the Worker on :1999. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHmac, randomUUID } from 'node:crypto'
import { WebSocket } from 'ws'
const secret = readFileSync(new URL('../party/.dev.vars', import.meta.url), 'utf8').match(
  /^PARTY_SECRET=(.+)$/m,
)?.[1]
if (!secret) throw new Error('Set PARTY_SECRET in party/.dev.vars')
const room = `smoke-${randomUUID()}`
function ticket(id, target = room) {
  const body = Buffer.from(
    JSON.stringify({ room: target, id, name: id, exp: Math.floor(Date.now() / 1000) + 300 }),
  ).toString('base64url')
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`
}
async function connect(id, token = ticket(id)) {
  const ws = new WebSocket(`ws://127.0.0.1:1999/parties/room/${room}?ticket=${token}`)
  let state
  const waiters = new Map()
  ws.on('message', (raw) => {
    const msg = JSON.parse(String(raw))
    if (msg.type === 'state') state = msg.state
    if (msg.ack && waiters.has(msg.ack)) {
      waiters.get(msg.ack)(msg.state)
      waiters.delete(msg.ack)
    }
  })
  await new Promise((resolve, reject) => {
    ws.once('open', resolve)
    ws.once('error', reject)
  })
  return {
    ws,
    get state() {
      return state
    },
    async send(action) {
      const id = randomUUID()
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Action timeout')), 5000)
        waiters.set(id, (state) => {
          clearTimeout(timer)
          resolve(state)
        })
        ws.send(JSON.stringify({ id, action }))
      })
    },
  }
}
const host = await connect('host'),
  phone = await connect('phone')
try {
  const config = {
    amountQuestions: 2,
    showQuestions: true,
    confidenceMode: false,
    hostAdFree: false,
    answerModes: {},
    selectedCategories: ['population'],
  }
  await host.send({ type: 'setup', config })
  await host.send({ type: 'join', player: { id: 'h', name: 'Host', localPlayer: true } })
  await phone.send({ type: 'join', player: { id: 'p', name: 'Phone' } })
  const duplicate = await host.send({
    type: 'join',
    player: { id: 'duplicate', name: 'Duplicate', localPlayer: true },
  })
  assert.equal(duplicate.players.length, 2, 'one player per device')
  const q = (id) => ({
    id,
    type: 'slider',
    category: 'population',
    question: 'How many?',
    answer: 10,
    lower_bound: 0,
    upper_bound: 20,
  })
  await host.send({
    type: 'start',
    config,
    questions: [
      q('q1'),
      {
        id: 'q2',
        type: 'map',
        category: 'locate',
        question: 'Find France',
        ccn3: '250',
        answer: { lat: 0, lng: 0 },
      },
    ],
  })
  const answer = (id, questionId) => ({
    type: 'answer',
    payload: { id, questionId, answer: questionId === 'q2' ? { lat: 48.8566, lng: 2.3522 } : 10 },
  })
  await Promise.all([host.send(answer('h', 'q1')), phone.send(answer('p', 'q1'))])
  const revealed = await host.send({ type: 'reveal', questionId: 'q1' })
  assert.deepEqual(
    revealed.players.map((p) => p.answers.length),
    [1, 1],
  )
  const denied = await phone.send({ type: 'end', questionId: 'q1' })
  assert.notEqual(denied.command, 'end', 'phone cannot end game')
  phone.ws.close()
  const resumed = await connect('phone')
  try {
    const next = await host.send({ type: 'next', questionId: 'q1' })
    assert.equal(next.currentQuestion.id, 'q2')
    await resumed.send(answer('p', 'q2'))
    await host.send(answer('h', 'q2'))
    const end = await host.send({ type: 'end', questionId: 'q2' })
    assert.deepEqual(
      end.players.map((p) => p.score),
      [2000, 2000],
    )
    const rematch = await host.send({ type: 'rematch', config, questions: [q('q3')] })
    assert.equal(rematch.endedAt, undefined)
    assert.ok(rematch.players.every((p) => !p.answers.length && !p.score))
  } finally {
    resumed.ws.close()
  }
  for (const token of ['forged.signature', ticket('forger', 'other-room')]) {
    await assert.rejects(connect('forger', token), /401/)
  }
  console.log(
    'Worker smoke passed: full game, concurrent answers, single seat, host guards, reconnect, rematch, forged/wrong-room tickets',
  )
} finally {
  host.ws.close()
  phone.ws.close()
}
