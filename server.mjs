import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const preferredPort = Number(process.env.PORT || 4173);
const maxPortAttempts = process.env.PORT ? 1 : 20;
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(root, safePath);

    if (!filePath.startsWith(root) || !(await stat(filePath)).isFile()) {
      throw new Error("Not found");
    }

    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("404 Not Found");
  }
});

let port = preferredPort;
let portAttempts = 0;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && portAttempts < maxPortAttempts - 1) {
    const occupiedPort = port;
    port += 1;
    portAttempts += 1;
    console.warn(`連接埠 ${occupiedPort} 已被使用，改用 ${port}…`);
    server.listen(port, "127.0.0.1");
    return;
  }

  console.error(`伺服器啟動失敗：${error.message}`);
  process.exitCode = 1;
});

server.on("listening", () => {
  console.log(`浮生卷已啟動：http://127.0.0.1:${port}`);
});

server.listen(port, "127.0.0.1");
