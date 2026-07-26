import { createReadStream, watch } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { CONTENT_DIR, generateBrowserData, PUBLIC_DIR, ROOT_DIR } from "./lib/content.mjs";

const argumentsMap = new Map();
process.argv.slice(2).forEach((value, index, values) => {
  if (value.startsWith("--")) argumentsMap.set(value, values[index + 1]);
});

const requestedDirectory = argumentsMap.get("--dir") || ".";
const requestedPort = Number(argumentsMap.get("--port") || 4173);
const host = "127.0.0.1";
const servingSource = requestedDirectory === ".";
const root = path.resolve(ROOT_DIR, requestedDirectory);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".webp": "image/webp",
  ".woff2": "font/woff2"
};

if (servingSource) {
  await generateBrowserData();
  let regenerationTimer;
  watch(CONTENT_DIR, { persistent: false }, (event, fileName) => {
    if (!fileName?.endsWith(".json")) return;
    clearTimeout(regenerationTimer);
    regenerationTimer = setTimeout(async () => {
      try {
        await generateBrowserData();
        console.log(`Updated browser content after ${fileName} changed.`);
      } catch (error) {
        console.error(error.message);
      }
    }, 120);
  });
}

const resolveRequest = (pathname) => {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  if (servingSource && (requestedPath.startsWith("/uploads/") || requestedPath.startsWith("/assets/"))) {
    return path.resolve(PUBLIC_DIR, `.${requestedPath}`);
  }
  return path.resolve(root, `.${requestedPath}`);
};

const isSafePath = (filePath) => {
  const roots = servingSource ? [root, PUBLIC_DIR] : [root];
  return roots.some((allowedRoot) => filePath === allowedRoot || filePath.startsWith(`${allowedRoot}${path.sep}`));
};

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const filePath = resolveRequest(pathname);

  if (!isSafePath(filePath)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" }).end("Forbidden");
    return;
  }

  try {
    const file = await stat(filePath);
    if (!file.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

let port = requestedPort;
server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && port < requestedPort + 10) {
    port += 1;
    server.listen(port, host);
    return;
  }
  throw error;
});

server.listen(port, host, () => {
  console.log(`Local URL: http://${host}:${port}/`);
});
