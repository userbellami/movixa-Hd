const $ = (s) => document.querySelector(s);
const today = () => new Date().toISOString().slice(0, 10);
const F = { "vote_count.gte": 150, include_adult: "false", sort_by: "popularity.desc" };
const FT = { "vote_count.gte": 50, include_adult: "false", sort_by: "popularity.desc" };
const mv = (t, p, q, top) => ({ t, p, q, type: "movie", top });
const tv = (t, p, q, top) => ({ t, p, q, type: "tv", top });
const MG = (ids) => ids.map((g) => mv(MOVIE_GENRES[g] + " Movies", "/discover/movie", { ...F, with_genres: g }));
const TG = (ids) => ids.map((g) => tv(TV_GENRES[g] + " Shows", "/discover/tv", { ...FT, with_genres: g }));
const VIEWS = {
  home: [mv("Top 10 Movies Today", "/trending/movie/day", null, 1), tv("Top 10 Shows Today", "/trending/tv/day", null, 1), mv("Trending Movies", "/trending/movie/week"), tv("Trending TV Shows", "/trending/tv/week"), mv("Popular Movies", "/movie/popular"), tv("Popular TV Shows", "/tv/popular"), mv("Top Rated Movies", "/movie/top_rated"), tv("Top Rated TV Shows", "/tv/top_rated"), mv("Now Playing in Theaters", "/movie/now_playing"), tv("Airing Today", "/tv/airing_today"), mv("Coming Soon", "/movie/upcoming"), ...MG([28, 35, 27, 878, 10749, 16]), ...TG([10765, 18, 80])],
  movie: [mv("Trending This Week", "/trending/movie/week"), mv("Popular on MOVIXA", "/movie/popular"), mv("Top Rated", "/movie/top_rated"), mv("Now Playing in Theaters", "/movie/now_playing"), mv("Coming Soon", "/movie/upcoming"), ...MG(Object.keys(MOVIE_GENRES))],
  tv: [tv("Trending This Week", "/trending/tv/week"), tv("Popular Shows", "/tv/popular"), tv("Top Rated", "/tv/top_rated"), tv("Airing Today", "/tv/airing_today"), tv("On The Air", "/tv/on_the_air"), ...TG(Object.keys(TV_GENRES))]
};
const TABS = [["home", "🏠", "Home"], ["movie", "🎬", "Movies"], ["tv", "📺", "TV Shows"], ["list", "⭐", "My List"]];
let view = "home", gridState = null, heroList = [], heroIdx = 0, heroTimer = null;

/* ---------- storage helpers ---------- */
const slim = (n) => ({ id: n.id, type: n.type, title: n.title, poster_path: n.poster_path, vote_average: n.vote_average, date: n.date });
const inList = (t, id) => Store.get("list", []).some((x) => x.id === id && x.type === t);
function toggleList(n) {
  let l = Store.get("list", []);
  if (l.some((x) => x.id === n.id && x.type === n.type)) { l = l.filter((x) => !(x.id === n.id && x.type === n.type)); toast("Removed from My List"); }
  else { l.unshift(slim(n)); toast("Added to My List"); }
  Store.set("list", l);
}
function addRecent(n) {
  const r = Store.get("recent", []).filter((x) => !(x.id === n.id && x.type === n.type));
  r.unshift(slim(n)); Store.set("recent", r.slice(0, 24));
}

/* ---------- tabs / user ---------- */
function renderTabs() {
  $("#tabs").innerHTML = TABS.map((t) => '<button data-v="' + t[0] + '" class="' + (view === t[0] ? "on" : "") + '">' + t[2] + "</button>").join("");
  $("#tabbar").innerHTML = TABS.map((t) => '<button data-v="' + t[0] + '" class="' + (view === t[0] ? "on" : "") + '"><span>' + t[1] + "</span>" + t[2] + "</button>").join("");
}
function renderUser() {
  const u = Auth.current(), box = $("#user");
  if (!u) { box.innerHTML = '<a class="btn p sm" href="login.html">Sign In</a>'; return; }
  box.innerHTML = '<button class="avatar" id="avBtn" aria-label="Account menu">' + esc(u.name[0].toUpperCase()) + '</button><div class="menu" id="menu" hidden><div class="who"><b>' + esc(u.name) + "</b><small>" + esc(u.email) + '</small></div><button data-a="list">⭐ My List</button><button data-a="recent">🕘 Recently Viewed</button><button data-a="clear">🧹 Clear History</button><button data-a="out">↩ Sign Out</button></div>';
  $("#avBtn").onclick = () => { const m = $("#menu"); m.hidden = !m.hidden; };
  $("#menu").onclick = (e) => {
    const a = e.target.dataset.a; if (!a) return;
    $("#menu").hidden = true;
    if (a === "list") setView("list");
    else if (a === "recent") showRecent();
    else if (a === "clear") { Store.set("recent", []); toast("History cleared"); if (view === "home") setView("home"); }
    else if (a === "out") { Auth.logout(); renderUser(); setView("home"); toast("Signed out"); }
  };
}

/* ---------- views ---------- */
function setView(v) {
  view = v; $("#q").value = ""; renderTabs();
  if (v === "list") return showList();
  showHomeRows(); buildChips(); buildRows(); initHero();
}
function showHomeRows() {
  document.body.classList.remove("nohero");
  $("#hero").hidden = false; $("#home").hidden = false; $("#grid").hidden = true;
  window.scrollTo(0, 0);
}
function toGridView(title) {
  document.body.classList.add("nohero");
  $("#hero").hidden = true; $("#home").hidden = true; $("#grid").hidden = false;
  $("#gridTitle").textContent = title; $("#items").replaceChildren(); $("#more").hidden = true; $("#sortbar").hidden = true;
  window.scrollTo(0, 0);
}
async function showGrid(title, path, params, type, sortable) {
  gridState = { path, params: { ...(params || {}) }, page: 0, type: type || null, sortable: !!sortable };
  toGridView(title);
  if (sortable) { $("#sortbar").hidden = false; $("#sort").value = "pop"; }
  await loadMore();
}
async function loadMore() {
  const g = gridState; if (!g) return;
  g.page++;
  const btn = $("#more"); btn.disabled = true;
  try {
    const d = await api(g.path, { ...g.params, page: g.page });
    if (g !== gridState) return;
    const list = (d.results || []).filter((m) => m.poster_path && (!m.media_type || m.media_type === "movie" || m.media_type === "tv"));
    $("#items").append(...list.map((m) => card(m, g.type)));
    btn.hidden = g.page >= Math.min(d.total_pages || 1, 500);
    if (g.page === 1 && !list.length) $("#items").innerHTML = '<p class="empty">Nothing found. Try another search.</p>';
  } catch (e) { $("#items").insertAdjacentHTML("beforeend", '<p class="empty">Could not load titles. Please check your connection or API key.</p>'); }
  btn.disabled = false;
}
function showStored(title, key, emptyMsg) {
  gridState = null; toGridView(title);
  const l = Store.get(key, []);
  if (!l.length) $("#items").innerHTML = '<p class="empty">' + emptyMsg + "</p>";
  else $("#items").append(...l.map((m) => card(m)));
}
function showList() { renderTabs(); $("#chips").hidden = true; showStored("My List", "list", "Your list is empty. Open any title and tap “Add to My List”."); }
function showRecent() { view = "recent"; renderTabs(); $("#chips").hidden = true; showStored("Recently Viewed", "recent", "Nothing here yet. Titles you open will appear here."); }

/* ---------- chips ---------- */
function buildChips() {
  const box = $("#chips");
  if (view !== "movie" && view !== "tv") { box.hidden = true; return; }
  const G = view === "tv" ? TV_GENRES : MOVIE_GENRES;
  box.hidden = false;
  box.innerHTML = '<button class="chip on" data-k="all">All</button>' + Object.entries(G).map(([k, n]) => '<button class="chip" data-k="' + k + '">' + esc(n) + "</button>").join("");
}
function setChip(k) { document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.k === String(k))); }
function go(k) {
  setChip(k); $("#q").value = "";
  if (k === "all") return showHomeRows();
  const isTv = view === "tv", G = isTv ? TV_GENRES : MOVIE_GENRES;
  if (!G[k]) return;
  showGrid(G[k] + (isTv ? " Shows" : " Movies"), "/discover/" + view, { ...(isTv ? FT : F), with_genres: k }, view, true);
}
function openGenre(type, g) { setView(type); go(g); }

/* ---------- rows ---------- */
const io = new IntersectionObserver((es) => es.forEach(async (e) => {
  if (!e.isIntersecting) return;
  io.unobserve(e.target);
  const s = e.target, def = s._def, track = s.querySelector(".track");
  try {
    const d = await api(def.p, def.q || {});
    let list = (d.results || []).filter((m) => m.poster_path);
    if (def.top) list = list.slice(0, 10);
    if (!list.length) return s.remove();
    const cards = list.map((m) => card(m, def.type));
    if (def.top) cards.forEach((c, i) => c.insertAdjacentHTML("beforeend", '<span class="num">' + (i + 1) + "</span>"));
    track.replaceChildren(...cards);
  } catch (err) { s.remove(); }
}), { rootMargin: "400px" });

function rowShell(title, onAll) {
  const s = document.createElement("section"); s.className = "row";
  s.innerHTML = "<h2>" + esc(title) + '<button type="button">See all ›</button></h2><div class="wrap"><button class="arr l" aria-label="Previous">‹</button><div class="track"><div class="sk"></div></div><button class="arr r" aria-label="Next">›</button></div>';
  const t = s.querySelector(".track");
  s.querySelector(".l").onclick = () => t.scrollBy({ left: -t.clientWidth * 0.85, behavior: "smooth" });
  s.querySelector(".r").onclick = () => t.scrollBy({ left: t.clientWidth * 0.85, behavior: "smooth" });
  const all = s.querySelector("h2 button");
  if (onAll) all.onclick = onAll; else all.remove();
  return s;
}
function buildRows() {
  const home = $("#home"); home.replaceChildren();
  if (view === "home") {
    const r = Store.get("recent", []);
    if (r.length) {
      const s = rowShell("Recently Viewed", showRecent);
      s.querySelector(".track").replaceChildren(...r.map((m) => card(m)));
      home.appendChild(s);
    }
  }
  VIEWS[view].forEach((def) => {
    const s = rowShell(def.t, def.top ? null : () => { setChip(""); showGrid(def.t, def.p, def.q || {}, def.type, false); });
    s._def = def; home.appendChild(s); io.observe(s);
  });
}

/* ---------- hero ---------- */
async function initHero() {
  clearInterval(heroTimer);
  const p = view === "movie" ? "/trending/movie/day" : view === "tv" ? "/trending/tv/day" : "/trending/all/day";
  try {
    const d = await api(p);
    heroList = (d.results || []).filter((m) => m.backdrop_path && (!m.media_type || m.media_type === "movie" || m.media_type === "tv")).slice(0, 7).map((m) => norm(m, view === "tv" ? "tv" : "movie"));
    if (!heroList.length) return;
    $("#dots").innerHTML = heroList.map((_, i) => '<button aria-label="Slide ' + (i + 1) + '"></button>').join("");
    $("#dots").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; setHero([...$("#dots").children].indexOf(b)); restartHero(); };
    setHero(0); restartHero();
  } catch (e) { $("#hTitle").textContent = "MOVIXA STREAM"; $("#hOv").textContent = "Could not reach the movie database. Make sure TMDB_API_KEY is configured."; }
}
function restartHero() { clearInterval(heroTimer); heroTimer = setInterval(() => setHero((heroIdx + 1) % heroList.length), 9000); }
function setHero(i) {
  heroIdx = i; const m = heroList[i];
  $("#hero").style.backgroundImage = "url(" + IMG + "w1280" + m.backdrop_path + ")";
  $("#hKind").textContent = m.type === "tv" ? "SERIES" : "MOVIE";
  $("#hTitle").textContent = m.title;
  $("#hMeta").innerHTML = '<span class="r">★ ' + m.vote_average.toFixed(1) + "</span><span>" + esc(m.date.slice(0, 4)) + "</span><span>" + esc(m.genre_ids.slice(0, 3).map((g) => GENRES[g]).filter(Boolean).join(" • ")) + "</span>";
  $("#hOv").textContent = m.overview;
  $("#hPlay").onclick = () => openTitle(m.type, m.id, true);
  $("#hInfo").onclick = () => openTitle(m.type, m.id);
  [...$("#dots").children].forEach((b, k) => b.classList.toggle("on", k === i));
}

/* ---------- modal ---------- */
async function openTitle(type, id, auto) {
  const md = $("#modal"), body = $("#mbody");
  md.hidden = false; document.body.classList.add("lock");
  body.innerHTML = '<div class="loading">Loading…</div>';
  history.replaceState(null, "", "#" + type + "=" + id);
  try {
    const d = await api("/" + type + "/" + id, { append_to_response: "videos,credits,similar,watch/providers" });
    const n = { ...norm(d, type), type };
    addRecent(n);
    const vids = ((d.videos && d.videos.results) || []).filter((v) => v.site === "YouTube");
    const tr = vids.find((v) => v.type === "Trailer") || vids.find((v) => v.type === "Teaser") || vids[0];
    const wp = (d["watch/providers"] && d["watch/providers"].results) || {};
    const reg = wp.US ? "US" : Object.keys(wp)[0];
    const w = reg ? wp[reg] : null;
    const provs = w ? [...(w.flatrate || []), ...(w.rent || []), ...(w.buy || [])].filter((p, i, a) => a.findIndex((x) => x.provider_id === p.provider_id) === i).slice(0, 8) : [];
    const crew = (d.credits && d.credits.crew) || [];
    const cast = ((d.credits && d.credits.cast) || []).slice(0, 12);
    const by = type === "tv" ? (d.created_by || []).map((c) => c.name).join(", ") : ((crew.find((c) => c.job === "Director") || {}).name || "");
    const sims = ((d.similar && d.similar.results) || []).filter((m) => m.poster_path).slice(0, 14);
    const bg = d.backdrop_path ? IMG + "w1280" + d.backdrop_path : poster(d.poster_path, "w500");
    const rt = type === "tv" ? (d.number_of_seasons ? d.number_of_seasons + " Season" + (d.number_of_seasons === 1 ? "" : "s") : "") : (d.runtime ? Math.floor(d.runtime / 60) + "h " + (d.runtime % 60) + "m" : "");
    const seasons = type === "tv" ? (d.seasons || []).filter((s) => s.season_number > 0) : [];
    body.innerHTML =
      '<div class="player" id="player" style="background-image:url(' + bg + ')">' + (tr ? '<button class="playbig" id="play" aria-label="Play trailer">▶</button>' : '<span class="notr">Trailer not available</span>') + "</div>" +
      '<div class="det"><h2>' + esc(n.title) + "</h2>" +
      '<div class="meta"><span class="r">★ ' + n.vote_average.toFixed(1) + "</span><span>" + esc(n.date.slice(0, 4)) + "</span><span>" + esc(rt) + '</span><span class="kindtag">' + (type === "tv" ? "SERIES" : "MOVIE") + "</span></div>" +
      '<div class="gen">' + (d.genres || []).map((g) => '<button data-g="' + g.id + '">' + esc(g.name) + "</button>").join("") + "</div>" +
      (d.tagline ? '<p class="tag">' + esc(d.tagline) + "</p>" : "") +
      "<p>" + esc(d.overview || "No overview available.") + "</p>" +
      (by ? '<p class="cast"><b>' + (type === "tv" ? "Created by" : "Director") + ":</b> " + esc(by) + "</p>" : "") +
      '<div class="acts"><button class="btn p" id="lst"></button><button class="btn s" id="shr">↗ Share</button></div>' +
      (seasons.length ? '<div><h3>Seasons</h3><div class="gen">' + seasons.map((s) => '<span class="ss">' + esc(s.name) + " · " + s.episode_count + " eps" + (s.air_date ? " · " + esc(s.air_date.slice(0, 4)) : "") + "</span>").join("") + "</div></div>" : "") +
      (cast.length ? '<div><h3>Top Cast</h3><div class="cast-row">' + cast.map((c) => '<div class="cp"><img loading="lazy" alt="" src="' + (c.profile_path ? IMG + "w185" + c.profile_path : NOPERSON) + '"><b>' + esc(c.name) + "</b><small>" + esc(c.character || "") + "</small></div>").join("") + "</div></div>" : "") +
      (provs.length ? "<div><h3>Where to watch (" + reg + ')</h3><a class="prov" target="_blank" rel="noopener" href="' + esc(w.link) + '">' + provs.map((p) => '<img loading="lazy" alt="' + esc(p.provider_name) + '" title="' + esc(p.provider_name) + '" src="' + IMG + "w92" + p.logo_path + '">').join("") + "</a></div>" : "") +
      (sims.length ? '<div class="sim"><h3>More like this</h3><div class="track" id="sim"></div></div>' : "") + "</div>";
    if (sims.length) $("#sim").append(...sims.map((m) => card(m, type)));
    const lst = $("#lst");
    const paint = () => { lst.textContent = inList(type, n.id) ? "✓ In My List" : "＋ Add to My List"; };
    paint(); lst.onclick = () => { toggleList(n); paint(); };
    $("#shr").onclick = () => {
      const url = location.origin + "/browse.html#" + type + "=" + n.id;
      if (navigator.share) navigator.share({ title: n.title + " – MOVIXA STREAM", url }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast("Link copied"));
    };
    body.querySelectorAll(".gen button").forEach((b) => (b.onclick = () => { closeModal(); openGenre(type, b.dataset.g); }));
    if (tr) {
      const play = () => { $("#player").innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(tr.key) + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>'; };
      $("#play").onclick = play;
      if (auto) play();
    }
  } catch (e) { body.innerHTML = '<div class="loading">Could not load this title.</div>'; }
}
function closeModal() {
  $("#modal").hidden = true; $("#mbody").innerHTML = "";
  document.body.classList.remove("lock");
  history.replaceState(null, "", location.pathname + location.search);
}

/* ---------- hash + init ---------- */
function handleHash() {
  const h = location.hash; let m;
  if ((m = h.match(/^#(movie|tv)=(\d+)/))) openTitle(m[1], m[2]);
  else if ((m = h.match(/^#genre=(\d+)/)) && MOVIE_GENRES[m[1]]) openGenre("movie", m[1]);
  else if ((m = h.match(/^#view=(home|movie|tv|list)/))) setView(m[1]);
}
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("hasbar");
  renderUser(); renderTabs();
  [$("#tabs"), $("#tabbar")].forEach((el) => (el.onclick = (e) => { const b = e.target.closest("button"); if (b) setView(b.dataset.v); }));
  $("#chips").onclick = (e) => { const b = e.target.closest(".chip"); if (b) go(b.dataset.k); };
  $("#more").onclick = loadMore;
  $("#close").onclick = closeModal;
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("click", (e) => { const m = $("#menu"); if (m && !e.target.closest(".usr")) m.hidden = true; });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#modal").hidden) closeModal();
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $("#q").focus(); }
  });
  $("#sort").onchange = (e) => {
    const g = gridState; if (!g || !g.sortable) return;
    const v = e.target.value, isTv = g.type === "tv", p = g.params;
    delete p["primary_release_date.lte"]; delete p["first_air_date.lte"];
    p["vote_count.gte"] = isTv ? 50 : 150;
    if (v === "pop") p.sort_by = "popularity.desc";
    else if (v === "top") { p.sort_by = "vote_average.desc"; p["vote_count.gte"] = isTv ? 150 : 400; }
    else { p.sort_by = isTv ? "first_air_date.desc" : "primary_release_date.desc"; p[isTv ? "first_air_date.lte" : "primary_release_date.lte"] = today(); }
    g.page = 0; $("#items").replaceChildren(); loadMore();
  };
  let t;
  $("#q").addEventListener("input", (e) => {
    clearTimeout(t); const v = e.target.value.trim();
    t = setTimeout(() => {
      if (v.length < 2) { if (!v) setView(view === "recent" ? "home" : view); return; }
      setChip("");
      showGrid("Results for “" + v + "”", "/search/multi", { query: v, include_adult: "false" }, null, false);
    }, 450);
  });
  if (!/^#(genre|view)=/.test(location.hash)) setView("home");
  handleHash();
  window.addEventListener("hashchange", handleHash);
});
