/* Device-local storage + accounts. Data never leaves the user's browser. */
const Store = {
  uid() { return localStorage.getItem("movixa_session") || "guest"; },
  key(n) { return "movixa_" + this.uid() + "_" + n; },
  get(n, d) { try { const v = JSON.parse(localStorage.getItem(this.key(n))); return v == null ? d : v; } catch (e) { return d; } },
  set(n, v) { try { localStorage.setItem(this.key(n), JSON.stringify(v)); } catch (e) {} }
};

const Auth = {
  users() { try { return JSON.parse(localStorage.getItem("movixa_users") || "[]"); } catch (e) { return []; } },
  save(u) { localStorage.setItem("movixa_users", JSON.stringify(u)); },
  current() { const id = localStorage.getItem("movixa_session"); return this.users().find((u) => u.id === id) || null; },
  async hash(pw, salt) {
    if (!window.crypto || !crypto.subtle) throw new Error("Secure connection (HTTPS) required.");
    const enc = new TextEncoder();
    const k = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, k, 256);
    return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  },
  async signup(name, email, pw) {
    name = name.trim(); email = email.trim().toLowerCase();
    if (name.length < 2) throw new Error("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    if (pw.length < 6) throw new Error("Password must be at least 6 characters.");
    const us = this.users();
    if (us.some((u) => u.email === email)) throw new Error("An account with this email already exists.");
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(12))).map((b) => b.toString(16).padStart(2, "0")).join("");
    const u = { id: "u" + Date.now().toString(36) + salt.slice(0, 4), name, email, salt, hash: await this.hash(pw, salt), created: Date.now() };
    const gl = Store.get("list", []), gr = Store.get("recent", []);
    us.push(u); this.save(us);
    localStorage.setItem("movixa_session", u.id);
    Store.set("list", gl); Store.set("recent", gr);
    return u;
  },
  async login(email, pw) {
    email = email.trim().toLowerCase();
    const u = this.users().find((x) => x.email === email);
    if (!u || (await this.hash(pw, u.salt)) !== u.hash) throw new Error("Incorrect email or password.");
    localStorage.setItem("movixa_session", u.id);
    return u;
  },
  logout() { localStorage.removeItem("movixa_session"); }
};
