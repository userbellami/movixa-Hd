(function () {
  const I = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.5L3 21z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-.9.8c-1-.4-2-1.4-2.4-2.4l.8-.9-1-2L9 8.5z" fill="currentColor" stroke="none"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.3 1.7 3.9 4 4.1v3a7 7 0 0 1-4-1.3v6.4a5.7 5.7 0 1 1-5-5.7v3.1a2.7 2.7 0 1 0 2 2.6V3h3z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.7L5.3 22H2.2l7.7-8.8L1.5 2h6.7l4.7 6.1L18.9 2zm-1.2 18h1.8L7.4 3.9H5.5L17.7 20z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>',
    telegram: '<svg viewBox="0 0 24 24"><path d="M21 3L3 10.5l6 2.2L11 20l3-4 5 3.8L21 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
  };

  function waLink(text) {
    const w = SITE.whatsapp;
    if (!w || !w.number) return "";
    let n = String(w.number).replace(/\D/g, "");
    if (n.charAt(0) === "0") n = String(w.countryCode || "") + n.slice(1);
    return "https://wa.me/" + n + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  const hasEmail = () => !!(SITE.email && SITE.email.trim());
  window.MX = { waLink: waLink, hasEmail: hasEmail };

  function socialLinks() {
    const out = [];
    const wa = waLink("Hello MOVIXA STREAM, ");
    if (wa) out.push(["whatsapp", wa]);
    ["facebook", "youtube", "tiktok", "x", "instagram", "telegram"].forEach((k) => { if (SITE.social[k]) out.push([k, SITE.social[k]]); });
    return out;
  }

  let deferred = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferred = e;
    const b = document.getElementById("installBtn"); if (b) b.hidden = false;
  });
  document.addEventListener("click", (e) => {
    if (e.target.id === "installBtn" && deferred) { deferred.prompt(); deferred = null; e.target.hidden = true; }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const f = document.getElementById("siteFooter");
    if (f) {
      const soc = socialLinks().map(([k, v]) => '<a class="s-' + k + '" href="' + esc(v) + '" target="_blank" rel="noopener noreferrer" aria-label="' + k + '" title="' + k + '">' + I[k] + "</a>").join("");
      f.innerHTML =
        '<div class="fgrid"><div><a class="logo" href="/">MOVIXA<span> STREAM</span></a>' +
        '<p class="fdesc">Your premium destination to discover movies and TV shows, watch HD trailers and find where to stream them.</p>' +
        '<h4 style="margin-top:1rem">Follow &amp; chat with us</h4><div class="soc">' + soc + '</div><p style="margin-top:1rem"><button id="installBtn" class="btn s sm" hidden>⬇ Install App</button></p></div>' +
        '<div><h4>Explore</h4><ul><li><a href="browse.html">Home</a></li><li><a href="browse.html#view=movie">Movies</a></li><li><a href="browse.html#view=tv">TV Shows</a></li><li><a href="browse.html#view=list">My List</a></li></ul></div>' +
        '<div><h4>Company</h4><ul><li><a href="about.html">About Us</a></li><li><a href="contact.html">Contact</a></li><li><a href="login.html">Sign In</a></li></ul></div>' +
        '<div><h4>Legal</h4><ul><li><a href="terms.html">Terms of Service</a></li><li><a href="privacy.html">Privacy Policy</a></li><li><a href="terms.html#copyright">Copyright / DMCA</a></li></ul></div></div>' +
        '<div class="fbot"><span>© ' + new Date().getFullYear() + " " + esc(SITE.name) + ". All rights reserved.</span><span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span></div>";
      if (deferred) document.getElementById("installBtn").hidden = false;
    }

    document.querySelectorAll("[data-site-email]").forEach((a) => {
      if (hasEmail()) { a.textContent = SITE.email; a.href = "mailto:" + SITE.email; }
      else {
        const l = waLink("");
        a.textContent = l ? "WhatsApp (" + SITE.whatsapp.number + ")" : "our Contact page";
        a.href = l || "contact.html";
        if (l) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      }
    });

    const wa = waLink("Hello MOVIXA STREAM, ");
    if (wa) {
      const b = document.createElement("a");
      b.className = "wafab"; b.href = wa; b.target = "_blank"; b.rel = "noopener noreferrer";
      b.setAttribute("aria-label", "Chat on WhatsApp"); b.innerHTML = I.whatsapp + "<span>Chat with us</span>";
      document.body.appendChild(b);
    }

    const tt = document.createElement("button");
    tt.className = "totop"; tt.setAttribute("aria-label", "Back to top"); tt.textContent = "↑";
    tt.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.appendChild(tt);
    window.addEventListener("scroll", () => tt.classList.toggle("show", scrollY > 700), { passive: true });

    const nav = document.getElementById("nav");
    if (nav && !nav.classList.contains("solid")) window.addEventListener("scroll", () => nav.classList.toggle("solid", scrollY > 30), { passive: true });

    let consent = null; try { consent = localStorage.getItem("movixa_consent"); } catch (e) {}
    if (!consent) {
      const c = document.createElement("div");
      c.className = "cookie";
      c.innerHTML = '<p>🍪 We use your browser\'s local storage to save your list, history and preferences. <a href="privacy.html">Learn more</a></p><button class="btn p sm">Got it</button>';
      c.querySelector("button").onclick = () => { try { localStorage.setItem("movixa_consent", "1"); } catch (e) {} c.remove(); };
      document.body.appendChild(c);
    }
    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
})();
