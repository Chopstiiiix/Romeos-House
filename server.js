// Static file server for the Romeo's House site.
// Exists instead of `python3 -m http.server` / `pm2 serve` because neither
// answers HTTP Range requests, and Safari refuses to play a video without them.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8010;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mp4": "video/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

// "bytes=0-1023" | "bytes=500-" | "bytes=-500" -> {start, end} inclusive, or null.
// Returns "invalid" when the range names a region outside the file, so the
// caller can answer 416 rather than silently sending the whole body.
function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((header || "").trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let start, end;
  if (m[1] === "") {
    // suffix form: last N bytes
    const n = Number(m[2]);
    if (n === 0) return "invalid";
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start > end || start >= size) return "invalid";
  return { start, end };
}

function resolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const rel = decoded.endsWith("/") ? decoded + "index.html" : decoded;
  const full = path.join(ROOT, path.normalize(rel));
  // path.join collapses "..", so anything escaping ROOT is rejected here
  return full.startsWith(ROOT + path.sep) || full === ROOT ? full : null;
}

function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  const file = resolve(req.url);
  if (!file) return res.writeHead(403).end("Forbidden");

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return res.writeHead(404).end("Not found");

    const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
    const range = parseRange(req.headers.range, stat.size);

    if (range === "invalid") {
      return res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end();
    }

    const head = { "Content-Type": type, "Accept-Ranges": "bytes" };
    if (range) {
      res.writeHead(206, {
        ...head,
        "Content-Range": `bytes ${range.start}-${range.end}/${stat.size}`,
        "Content-Length": range.end - range.start + 1,
      });
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(file, { start: range.start, end: range.end }).pipe(res);
    } else {
      res.writeHead(200, { ...head, "Content-Length": stat.size });
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(file).pipe(res);
    }
  });
}

// Loopback only — the Cloudflare tunnel is the sole way in. cloudflared falls
// back to IPv4 when ::1 refuses, so binding 127.0.0.1 alone is enough; this
// matches how every containerised service on this host binds.
if (require.main === module) {
  http
    .createServer(handler)
    .listen(PORT, "127.0.0.1", () => console.log(`serving ${ROOT} on 127.0.0.1:${PORT}`));
}

module.exports = { parseRange, resolve };
