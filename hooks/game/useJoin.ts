import { sample } from 'lodash'
import { colors } from '@/lib/utils'
import { icons } from '@/app/icons'
import { JoinPayload } from '@/app/types'
import { useMutation } from '@/liveblocks.config'

export const useJoin = () => {
  const addPlayer = useMutation(({ storage }, payload: JoinPayload) => {
    const game = storage.get('game')
    const existingPlayers = game.get('players') as any[]

    const newPlayer = {
      id: payload.id,
      name: payload.name,
      color: payload.color || sample(colors)?.id,
      icon: payload.icon || sample(icons.map((i) => i.name)),
      localPlayer: payload.localPlayer,
      answers: [],
      score: 0,
    }

    game.set('players', [...existingPlayers, newPlayer])
  }, [])

  const join = async (payload: JoinPayload) => {
    // useMutation appends the player against the latest Liveblocks storage state.
    addPlayer(payload)
  }

  return { join }
}
