# Population realtime rooms

Population uses PartyServer on Cloudflare Workers with one hibernating SQLite Durable Object per room. The server validates actions, owns player seats, computes scores using the shared scoring functions and 50m atlas, persists every change and broadcasts the full room. Rooms expire after 24 hours without an accepted action.

## Local development

1. Install dependencies with `npm install`.
2. Generate a secret with `openssl rand -hex 32`. Set the same `PARTY_SECRET` in `.env.local` and `party/.dev.vars`. Both secret files are ignored by Git.
3. Set `NEXT_PUBLIC_PARTY_HOST=localhost:1999` in `.env.local`.
4. Run `npm run party:dev` and `npm run dev` in separate terminals.
5. Host on `http://localhost:3000` and join on `http://127.0.0.1:3000` for separate device identities. Play a complete game, reload both devices mid-round, and test reconnects.

Each connection fetches a fresh HMAC ticket from `/api/party-auth`. Signed-in users retain their Clerk identity; guests use a persistent device UUID. The server records who owns each player seat, with at most one player per device. Round controls carry the current question ID to make delayed retries harmless. Navigation waits for action acknowledgement. Answers and joins are optimistic; randomized question advances wait for the server.

The browser status banner reports connection loss and authorization errors. A disconnected phone retains its seat when it reconnects. Closing a tab does not remove its player.

## Validation

```sh
npm run test:run
npm run typecheck
npm run party:check
npm run build
npm run native:offline
node scripts/party-smoke.mjs  # with party:dev running
npx wrangler deploy --dry-run --config party/wrangler.jsonc --outdir /tmp/population-party-bundle
```

## Deployment

1. Deploy the Worker with `npm run party:deploy` on the intended Cloudflare account.
2. Run `npx wrangler secret put PARTY_SECRET --config party/wrangler.jsonc` and enter the same secret used by Next.js.
3. Set `PARTY_SECRET` and `NEXT_PUBLIC_PARTY_HOST=population-party.playam.workers.dev` in Vercel for the intended environment.
4. Create a preview deployment and play a full game on a real phone. Lock the screen for 30 seconds, switch apps, reload and confirm the same seat resumes.
5. Publish production after that device check passes. The web deployment switches multiplayer for the Capacitor shell too; a store resubmission is unnecessary.

Use the `partyserver` runtime and Wrangler CLI on your own Cloudflare account. Keep secrets out of committed launch configs. The production Worker and Vercel secret must match.
