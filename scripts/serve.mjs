import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createServer } from "node:http";

const ROOT_DIR = resolve(new URL("..", import.meta.url).pathname);
const PORT = Number(process.env.PORT || process.argv[2] || 4173);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function safeResolve(urlPath) {
  const cleanPath = normalize(decodeURIComponent(urlPath.split("?")[0]));
  const relativePath = cleanPath.replace(/^\/+/, "");
  const filePath = resolve(join(ROOT_DIR, relativePath));

  if (!filePath.startsWith(ROOT_DIR)) {
    return null;
  }

  return filePath;
}

const server = createServer((req, res) => {
  if ((req.url || "/") === "/") {
    res.writeHead(302, { location: "/demo/" });
    res.end();
    return;
  }

  const filePath = safeResolve(req.url || "/");

  if (!filePath || !existsSync(filePath)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const stat = statSync(filePath);
  const finalPath = stat.isDirectory() ? join(filePath, "index.html") : filePath;

  if (!existsSync(finalPath)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const extension = extname(finalPath).toLowerCase();
  res.writeHead(200, {
    "content-type": MIME_TYPES[extension] || "application/octet-stream",
  });
  createReadStream(finalPath).pipe(res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Reflect Glass Button demo is running at http://127.0.0.1:${PORT}`);
});
