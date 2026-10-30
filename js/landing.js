document.addEventListener("DOMContentLoaded", async () => {
  const tiles = document.getElementById("tiles");
  tiles.innerHTML = '<a class="tile hot" href="browse.html#view=tv">📺 TV Shows</a>' + Object.entries(MOVIE_GENRES).map(([id, n]) => '<a class="tile" href="browse.html#genre=' + id + '">' + esc(n) + "</a>").join("");
  const fill = (el, list, type) => {
    el.replaceChildren(...list.slice(0, 10).map((m, i) => { const c = card(m, type); c.insertAdjacentHTML("beforeend", '<span class="num">' + (i + 1) + "</span>"); return c; }));
  };
  try {
    const [m, t] = await Promise.all([api("/trending/movie/week"), api("/trending/tv/week")]);
    const movies = (m.results || []).filter((x) => x.poster_path);
    const shows = (t.results || []).filter((x) => x.poster_path);
    document.getElementById("wall").innerHTML = movies.concat(shows).slice(0, 36).map((x) => '<img alt="" src="' + poster(x.poster_path) + '">').join("");
    fill(document.getElementById("top10"), movies, "movie");
    fill(document.getElementById("top10tv"), shows, "tv");
  } catch (e) {
    const msg = '<p class="empty">Trending titles will appear here once the API key is configured.</p>';
    document.getElementById("top10").innerHTML = msg; document.getElementById("top10tv").innerHTML = msg;
  }
});
