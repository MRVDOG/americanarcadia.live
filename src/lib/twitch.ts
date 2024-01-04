type TwitchAuth = {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export const handleAuth = async (): Promise<TwitchAuth> => {
  const authRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${import.meta.env.TWITCH_CLIENT_ID}&client_secret=${import.meta.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
    method: 'POST'
  });
  const auth = await authRes.json();

  return auth;
}

export const fetchStreams = async (auth: TwitchAuth, game_id: number) => {
  const url = `https://api.twitch.tv/helix/streams?game_id=${game_id}&type=live`;
  const response = await fetch(url, {
    headers: {
      'Client-ID': `${import.meta.env.TWITCH_CLIENT_ID}`,
      'Authorization': `Bearer ${auth.access_token}`
    }
  });
  const data = await response.json();

  return data;
}
export const fetchStream = async (auth: TwitchAuth, id: string) => {
  const url = `https://api.twitch.tv/helix/streams?user_id=${id}`;
  const response = await fetch(url, {
    headers: {
      'Client-ID': `${import.meta.env.TWITCH_CLIENT_ID}`,
      'Authorization': `Bearer ${auth.access_token}`
    }
  });
  const data = await response.json();

  return data;
}
export const fetchStreamData = async (auth: TwitchAuth, id: string) => {
  const url = `https://api.twitch.tv/helix/streams?id=${id}`;
  const response = await fetch(url, {
    headers: {
      'Client-ID': `${import.meta.env.TWITCH_CLIENT_ID}`,
      'Authorization': `Bearer ${auth.access_token}`
    }
  });
  const data = await response.json();

  return data;
}

export const fetchVideos = async (auth: TwitchAuth, game_id: number) => {
  const url = `https://api.twitch.tv/helix/videos?game_id=${game_id}`;
  const response = await fetch(url, {
    headers: {
      'Client-ID': `${import.meta.env.TWITCH_CLIENT_ID}`,
      'Authorization': `Bearer ${auth.access_token}`
    }
  });
  const data = await response.json();

  // sort by viewer_count
  data.data.sort((a: any, b: any) => {
    return b.view_count - a.view_count;
  });

  return data;
}
export const fetchVideo = async (auth: TwitchAuth, id: string) => {
  const url = `https://api.twitch.tv/helix/videos?user_id=${id}`;
  const response = await fetch(url, {
    headers: {
      'Client-ID': `${import.meta.env.TWITCH_CLIENT_ID}`,
      'Authorization': `Bearer ${auth.access_token}`
    }
  });
  const data = await response.json();

  // sort by created_at
  data.data.sort((a: any, b: any) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  return data;
}

export const fetchClips = async (runtime: any) => {
  const cache = await runtime.env.DATABASE.prepare(
    /**
     * select * from clips, where created at > datetime('now', '-7 days')
     * filter out clips for the same streamer that are within 10 seconds of each other
     * order by created_at desc
     * limit 50
     */
    `
    SELECT *
      FROM clips
      WHERE (
        SELECT COUNT(*)
        FROM clips c2
        WHERE c2.id != clips.id
        AND json_extract(c2.data, "$.broadcaster_id") = json_extract(clips.data, "$.broadcaster_id")
        AND datetime(json_extract(c2.data, "$.created_at")) > datetime(json_extract(clips.data, "$.created_at"), '-10 seconds')
        AND datetime(json_extract(c2.data, "$.created_at")) < datetime(json_extract(clips.data, "$.created_at"), '+10 seconds')
      ) = 0
      AND json_extract(data, "$.created_at") > datetime('now', '-7 days')
    
      ORDER BY json_extract(data, "$.created_at") DESC
      LIMIT 50
    `
  ).run();

  return cache.results.map((result: any) => JSON.parse(result.data));
}
export const fetchClip = async (auth: TwitchAuth, id: string) => {
  const url = `https://api.twitch.tv/helix/clips?id=${id}`;
  const response = await fetch(url, {
    headers: {
      'Client-ID': `${import.meta.env.TWITCH_CLIENT_ID}`,
      'Authorization': `Bearer ${auth.access_token}`
    }
  });
  const data = await response.json();

  return data;
}