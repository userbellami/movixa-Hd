export default async function handler(req, res) {
  const key = process.env.TMDB_API_KEY;
  if (!key) return res.status(500).json({ error: "TMDB_API_KEY is not set" });
  const { path = "", ...rest } = req.query || {};
  if (!/^\/(movie|tv|trending|discover|search|genre)\/[a-zA-Z0-9_\/]+$/.test(path)) {
    return res.status(400).json({ error: "Bad path" });
  }
  const url = new URL("https://api.themoviedb.org/3" + path);
  for (const [k, v] of Object.entries(rest)) url.searchParams.set(k, String(v));
  const headers = { accept: "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = "Bearer " + key;
  else url.searchParams.set("api_key", key);
  try {
    const r = await fetch(url, { headers });
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: "Upstream error" });
  }
}
