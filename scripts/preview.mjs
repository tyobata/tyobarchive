// Dependency-free preview server. Run: node scripts/preview.mjs
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
const host = "127.0.0.1";
const port = 4173;
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".avif": "image/avif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".webm": "video/webm", ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8"
};

function insideRoot(path) {
  const part = relative(root, path);
  return part !== ".." && !part.startsWith(`..${sep}`) && !isAbsolute(part);
}

function reply(response, code, text, head = false, headers = {}) {
  response.writeHead(code, { "Content-Type": "text/plain; charset=utf-8", ...headers });
  response.end(head ? undefined : text);
}

const server = createServer(async (request, response) => {
  const head = request.method === "HEAD";
  if (request.method !== "GET" && !head) {
    reply(response, 405, "Method not allowed", false, { Allow: "GET, HEAD" });
    return;
  }
  try {
    let pathname = decodeURIComponent(new URL(request.url, `http://${host}:${port}`).pathname);
    if (pathname.includes("\\") || pathname.includes("\0") || pathname.split("/").some(part => part.startsWith("."))) {
      reply(response, 403, "Forbidden", head);
      return;
    }
    if (pathname === "/tyobarchive") {
      response.writeHead(308, { Location: "/tyobarchive/" });
      response.end();
      return;
    }
    if (pathname.startsWith("/tyobarchive/")) pathname = pathname.slice("/tyobarchive".length);
    if (pathname.endsWith("/")) pathname += "index.html";
    const candidate = resolve(root, `.${pathname}`);
    if (!insideRoot(candidate)) {
      reply(response, 403, "Forbidden", head);
      return;
    }
    const path = await realpath(candidate);
    if (!insideRoot(path)) {
      reply(response, 403, "Forbidden", head);
      return;
    }
    const info = await stat(path);
    if (!info.isFile()) {
      reply(response, 404, "Not found", head);
      return;
    }
    const headers = {
      "Content-Type": types[extname(path).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache", "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff"
    };
    let start = 0;
    let end = info.size - 1;
    let code = 200;
    if (request.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (!match || (!match[1] && !match[2]) || info.size === 0) {
        reply(response, 416, "Invalid range", head, { "Content-Range": `bytes */${info.size}` });
        return;
      }
      if (!match[1]) {
        start = Math.max(0, info.size - Number(match[2]));
      } else {
        start = Number(match[1]);
        end = match[2] ? Math.min(Number(match[2]), end) : end;
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= info.size) {
        reply(response, 416, "Invalid range", head, { "Content-Range": `bytes */${info.size}` });
        return;
      }
      code = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
    }
    headers["Content-Length"] = info.size === 0 ? 0 : end - start + 1;
    response.writeHead(code, headers);
    if (head || info.size === 0) {
      response.end();
      return;
    }
    const stream = createReadStream(path, { start, end });
    stream.on("error", () => response.destroy());
    response.on("close", () => stream.destroy());
    stream.pipe(response);
  } catch (error) {
    if (response.headersSent) response.destroy();
    else reply(response, error instanceof URIError ? 400 : 404, error instanceof URIError ? "Invalid URL" : "Not found", head);
  }
});

server.on("error", error => {
  console.error(`Preview could not start: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.log(`Local: http://${host}:${port}/`);
  console.log(`GitHub Pages path preview: http://${host}:${port}/tyobarchive/`);
  console.log("Press Ctrl+C to stop.");
});
process.on("SIGINT", () => {
  server.close();
  server.closeAllConnections();
});
