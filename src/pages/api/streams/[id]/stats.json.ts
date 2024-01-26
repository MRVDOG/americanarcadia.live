import { handleAuth, fetchStream } from "../../../../lib/twitch";

export async function GET({ params }: { params: { id: string } }) {
  const auth = await handleAuth();

  const {data} = await fetchStream(auth, params.id)

  return new Response(
    JSON.stringify({
      viewer_count: data?.[0]?.viewer_count || 0,
      // dev mode
      still_playing: import.meta.env.DEV
        ? true
        : data?.[0]?.game_id === '1517558459' && data?.[0]?.type === 'live'
    }),
  )
}