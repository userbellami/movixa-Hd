import http from "http";
import fs from "fs";
import path from "path";
import handler from "./api/tmdb.js";
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json", ".txt": "text/plain" };
const root = process.cwd();
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (u.pathname === "/api/tmdb") {
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
    return handler({ query: Object.fromEntries(u.searchParams) }, res);
  }
  let p = u.pathname === "/" ? "/index.html" : u.pathname;
  if (!path.extname(p) && fs.existsSync(path.join(root, p + ".html"))) p += ".html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end(fs.readFileSync(path.join(root, "404.html"))); }
  res.setHeader("Content-Type", types[path.extname(f)] || "application/octet-stream");
  fs.createReadStream(f).pipe(res);
}).listen(3000, () => console.log("MOVIXA running on http://localhost:3000"));
