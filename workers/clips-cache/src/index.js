const json = (data, options) => new Response(JSON.stringify(data), options);

const game_id = 1517558459; // American Arcadia

const handleAuth = async (env) => {
  const authRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${env.TWITCH_CLIENT_ID}&client_secret=${env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
    method: 'POST'
  });
  const auth = await authRes.json();

  return auth;
}

const doTheThing = async (env) => {
  const DB = await env.DATABASE;
    
  let cursor = null;
  let err = null;
  let clips = [];
  let succeeded = 0;
  let failed = 0;
  let removed = 0;

  const auth = await handleAuth(env);

  const run = async () => {
    const url = `https://api.twitch.tv/helix/clips?game_id=${game_id}&first=100${ cursor ? `&after=${cursor}`: ''}`;
  
    const response = await fetch(url, {
      headers: {
        'Client-ID': `${env.TWITCH_CLIENT_ID}`,
        'Authorization': `Bearer ${auth.access_token}`
      }
    }).catch(e => {
      throw e;
    });
    const data = await response.json();
  
    return data;
  }

  try {
    while(cursor !== undefined) {
      const data = await run();
      cursor = data.pagination.cursor;
      clips = [...clips, ...data.data];
    }
    
    const ins_stmt = DB.prepare('INSERT INTO clips (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = ? WHERE id = ?');
    const ins_rows = await DB.batch([
      ...clips.map(clip => ins_stmt.bind(
        clip.id,
        JSON.stringify(clip),
        JSON.stringify(clip),
        clip.id
      ))
    ]);

    for(const row of ins_rows) {
      if(row.success) {
        // if updated_at is older than 7 days, remove it
        const clip = JSON.parse(row.data);
        const updated_at = new Date(clip.created_at).getTime();
        const now = new Date().getTime();
        const diff = now - updated_at;
        const days = diff / (1000 * 60 * 60 * 24);

        if(days > 7) {
          const del_stmt = DB.prepare('DELETE FROM clips WHERE id = ?');
          const del_row = await DB.run(del_stmt.bind(clip.id));
          removed++;
        } else {
          console.log('clip is not old enough to remove', clip.id, days);
          succeeded++;
        }

      } else {
        failed++;
      }
    }
  } catch (e) {
    err = e;
    console.error(e);
  }
  
  const error = err?.message ? { error: err } : {};

  return json({
    ...error,
    failed,
    succeeded,
    removed,
  });
}

export default {
  async fetch(_, env) {
    return await doTheThing(env);
  },
  async scheduled(env) {
    return await doTheThing(env);
  },
};