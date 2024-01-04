import { defineMiddleware } from 'astro:middleware'
import clerkClient from '@clerk/clerk-sdk-node'

const publishableKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY
const secretKey = import.meta.env.CLERK_SECRET_KEY

const protectedApiUrls: string[] = ['/api/chat']

export const protectedApis = defineMiddleware(async ({ request, locals }, next) =>  {
  const url = new URL(request.url)
  if (!protectedApiUrls.some(path => url.pathname.startsWith(path))) {
    return next()
  }
  
  const { isSignedIn } = await clerkClient.authenticateRequest({ request, publishableKey, secretKey })
  if (!isSignedIn) {
    return new Response('<p>Bad Request</p>', { status: 401})
  }

  const sessions = await clerkClient.sessions.getSessionList();
  const session = sessions.find(sess => sess.status === 'active');
  const accessToken = (await clerkClient.users.getUserOauthAccessToken(session!.userId, 'oauth_twitch'))?.[0]

  // @ts-ignore
  locals.accessToken = {
    token: accessToken?.token,
    secret: accessToken?.tokenSecret!,
    scopes: accessToken?.scopes!
  };

  return next()
})