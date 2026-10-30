const IMG = "https://image.tmdb.org/t/p/";
const MOVIE_GENRES = {28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",99:"Documentary",18:"Drama",10751:"Family",14:"Fantasy",27:"Horror",9648:"Mystery",10749:"Romance",878:"Sci-Fi",53:"Thriller",10752:"War",37:"Western"};
const TV_GENRES = {10759:"Action & Adventure",16:"Animation",35:"Comedy",80:"Crime",99:"Documentary",18:"Drama",10751:"Family",10762:"Kids",9648:"Mystery",10765:"Sci-Fi & Fantasy",10768:"War & Politics",37:"Western"};
const GENRES = { ...MOVIE_GENRES, ...TV_GENRES };
const NOPOSTER = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513"><rect width="100%" height="100%" fill="#1a1a26"/><text x="50%" y="50%" fill="#666" font-size="22" text-anchor="middle" font-family="sans-serif">No Poster</text></svg>');
const NOPERSON = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="185" height="185"><rect width="100%" height="100%" fill="#1a1a26"/><circle cx="92" cy="72" r="32" fill="#333"/><rect x="40" y="115" width="105" height="70" rx="40" fill="#333"/></svg>');
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const poster = (p, s = "w342") => (p ? IMG + s + p : NOPOSTER);

async function api(path, params = {}) {
  const q = new URLSearchParams({ path, language: "en-US", ...params });
  const r = await fetch("/api/tmdb?" + q.toString());
  if (!r.ok) throw new Error("API " + r.status);
  return r.json();
}

function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2400);
}

function norm(m, type) {
  return { id: m.id, type: m.type || m.media_type || type || "movie", title: m.title || m.name || "", poster_path: m.poster_path || null, backdrop_path: m.backdrop_path || null, vote_average: m.vote_average || 0, date: m.date || m.release_date || m.first_air_date || "", overview: m.overview || "", genre_ids: m.genre_ids || [] };
}

function card(m, type) {
  const n = norm(m, type);
  const a = document.createElement("article");
  a.className = "card"; a.tabIndex = 0;
  a.innerHTML = '<img loading="lazy" alt="' + esc(n.title) + '" src="' + poster(n.poster_path) + '"><span class="badge">★ ' + n.vote_average.toFixed(1) + "</span>" + (n.type === "tv" ? '<span class="kind">SERIES</span>' : "") + '<div class="cap"><b>' + esc(n.title) + "</b><small>" + esc(n.date.slice(0, 4)) + "</small></div>";
  const open = () => (typeof openTitle === "function" ? openTitle(n.type, n.id) : (location.href = "browse.html#" + n.type + "=" + n.id));
  a.onclick = open;
  a.onkeydown = (e) => { if (e.key === "Enter") open(); };
  return a;
}
