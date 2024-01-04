import { StaticAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';

import { handleAuth, fetchStream } from "../../../lib/twitch";
import type { AAAccessToken } from '../../../env';

export async function POST({ params, locals, request }: { params: { id: string }, locals: { accessToken: AAAccessToken }, request: Request }) {
  const body = await request.json();

  const auth = await handleAuth();

  const {data: [stream]} = await fetchStream(auth, params.id);

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

      const authProvider = new StaticAuthProvider(
        process.env.TWITCH_CLIENT_ID!,
        locals.accessToken.token,
        ['user:read:email', 'chat:edit', 'chat:read	'],
      );

      const chatClient = new ChatClient({ authProvider });

      chatClient.onConnect(async () => {
        await chatClient.say(stream.user_login, body.message)
          .catch(err => {
            reject(err);
          });

        chatClient.quit();

        resolve({ sent: true });
      });

      chatClient.connect();
    }
  });

  return new Response(
    JSON.stringify({
      response,
    }),
  )
}