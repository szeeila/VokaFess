const { Pool } = require('pg');
const fetch = require('node-fetch');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // GET semua pesan
  if (req.method === 'GET' && action === 'get_messages') {
    try {
      const result = await pool.query('SELECT * FROM messages ORDER BY sent_at DESC');
      const data = result.rows.map(r => ({
        id:      r.id,
        to:      r.recipient_name,
        song:    r.song_title,
        artist:  r.artist_name,
        msg:     r.message_text,
        type:    r.media_type,
        mediaId: r.media_id,
        from:    r.sender_name,
        sentAt:  r.sent_at
      }));
      return res.status(200).json({ status: 'success', data });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  // GET metadata lagu
  if (req.method === 'GET' && action === 'get_meta') {
    const { type, id } = req.query;

    if (type === 'yt' && id) {
      try {
        const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(id)}&format=json`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = await r.json();
        return res.status(200).json(data);
      } catch {
        return res.status(500).json({ title: 'Unknown', author_name: 'Unknown' });
      }
    }

    if (type === 'sp' && id) {
      try {
        const url = `https://open.spotify.com/oembed?url=spotify:track:${encodeURIComponent(id)}`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const oembed = await r.json();

        let rawTitle   = oembed.title || '';
        let trackTitle = rawTitle;
        let artistName = '';

        if (rawTitle.indexOf(' - song and lyrics by ') !== -1) {
          const p = rawTitle.split(' - song and lyrics by ');
          trackTitle = p[0].trim();
          artistName = p[1].trim();
        } else if (rawTitle.indexOf(' - ') !== -1) {
          const p = rawTitle.split(' - ');
          trackTitle = p[0].trim();
          artistName = p.slice(1).join(' - ').trim();
        }

        // Kalau artis masih kosong dan ada Spotify API credentials
        if (!artistName && process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
          const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(
                process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
              ).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
          });
          const tokenData = await tokenRes.json();
          if (tokenData.access_token) {
            const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${encodeURIComponent(id)}`, {
              headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
            });
            const track = await trackRes.json();
            trackTitle = track.name || trackTitle;
            artistName = (track.artists || []).map(a => a.name).join(', ');
          }
        }

        return res.status(200).json({
          title:       trackTitle,
          author_name: artistName || 'Unknown Artist'
        });
      } catch {
        return res.status(500).json({ title: 'Unknown', author_name: 'Unknown Artist' });
      }
    }

    return res.status(400).json({ status: 'error', message: 'Invalid parameters' });
  }

  // POST kirim pesan
  if (req.method === 'POST' && action === 'submit_fess') {
    const { to, msg, song, artist, type, mediaId, sender } = req.body;
    if (!to || !msg) {
      return res.status(400).json({ status: 'error', message: 'Data tidak lengkap' });
    }
    try {
      const result = await pool.query(
        'INSERT INTO messages (recipient_name, song_title, artist_name, message_text, media_type, media_id, sender_name) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [to, song || '—', artist || '', msg, type || 'manual', mediaId || null, sender || null]
      );
      return res.status(200).json({ status: 'success', id: result.rows[0].id });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  return res.status(404).json({ status: 'error', message: 'Not found' });
};
