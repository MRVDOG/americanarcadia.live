import { handleAuth, fetchStream } from "../../../../lib/twitch";

export async function GET({ params }: { params: { id: string } }) {
  const auth = await handleAuth();

  const {data: [stream]} = await fetchStream(auth, params.id)

  return new Response(
    JSON.stringify({
      viewer_count: stream?.viewer_count || 0,
      // dev mode
      still_playing: import.meta.env.DEV
        ? true
        : stream?.game_id === '1517558459' && stream?.type === 'live'
    }),
  )
}