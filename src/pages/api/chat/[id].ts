import { handleAuth, fetchStream } from "../../../lib/twitch";
import type { AAAccessToken } from '../../../env';

export async function POST({ params, locals, request }: { params: { id: string }, locals: { accessToken: AAAccessToken }, request: Request }) {
  const body = await request.json();

  const auth = await handleAuth();

  const {data: [stream]} = (await fetchStream(auth, params.id))

  const response = await new Promise(async (resolve, reject) => {
    if (stream.type === 'live') {
      const res = await fetch('https://id.twitch.tv/oauth2/validate', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth ${locals.accessToken.token}`,
        },
      }).then(res => res.json());

      if(!res.client_id) {
        reject(new Error('invalid token'));
      }

      await fetch('https://api.twitch.tv/helix/chat/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${locals.accessToken.token}`,
          'Client-Id': res.client_id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broadcaster_id: stream.user_id,
          sender_id: res.user_id,
          message: body.message,
        }),
      }).then(res => {
        if(res.status === 204) {
          resolve({ sent: true });
        } else {
          resolve({ sent: false });
        }
      });

    }
  });

  return new Response(
    JSON.stringify({
      response,
    }),
  )
}