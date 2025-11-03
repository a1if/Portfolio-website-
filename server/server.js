const http = require("http");
const path = require("path");
const fs = require("fs/promises");
const { randomUUID } = require("crypto");
const url = require("url");

const {
  ensureContactStore,
  appendContact,
  contactsFilePath,
} = require("./utils/contactStore");

const PORT = Number(process.env.PORT) || 5000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const MAX_PAYLOAD_SIZE = 1024 * 100; // 100 KB

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const publicDirectory = path.join(__dirname, "..");

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": MIME_TYPES[".json"],
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > MAX_PAYLOAD_SIZE) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      const contentType = req.headers["content-type"] || "";

      try {
        if (contentType.includes("application/json")) {
          resolve(JSON.parse(body));
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          const params = new url.URLSearchParams(body);
          const result = {};
          params.forEach((value, key) => {
            result[key] = value;
          });
          resolve(result);
        } else {
          resolve({ raw: body });
        }
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleContactSubmission(req, res) {
  try {
    const payload = await parseRequestBody(req);
    const name = (payload.name || "").trim();
    const email = (payload.email || "").trim().toLowerCase();
    const message = (payload.message || "").trim();

    if (!name || !email || !message) {
      sendJson(res, 400, {
        error: "Please provide a name, email address, and message.",
      });
      return;
    }

    if (!isValidEmail(email)) {
      sendJson(res, 400, {
        error: "Please enter a valid email address.",
      });
      return;
    }

    if (message.length > 2000) {
      sendJson(res, 400, {
        error: "Messages should be 2000 characters or fewer.",
      });
      return;
    }

    const contactRecord = {
      id: randomUUID(),
      name,
      email,
      message,
      submittedAt: new Date().toISOString(),
      clientIp: req.socket.remoteAddress,
      userAgent: req.headers["user-agent"] || "",
    };

    await appendContact(contactRecord);

    sendJson(res, 201, {
      success: true,
      message:
        "Thanks for reaching out! I\'ll respond within two business days.",
    });
  } catch (error) {
    if (error.message === "Payload too large") {
      sendJson(res, 413, { error: "Message is too large." });
      return;
    }

    console.error("Failed to handle contact submission:", error);
    sendJson(res, 500, {
      error:
        "Something went wrong while sending your message. Please try again later.",
    });
  }
}

async function serveStaticFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": data.length,
    });
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": MIME_TYPES[".json"] });
      res.end(JSON.stringify({ error: "Not found" }));
    } else {
      console.error("Failed to serve static file:", error);
      res.writeHead(500, { "Content-Type": MIME_TYPES[".json"] });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
}

async function routeRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname || "/";

  if (pathname.startsWith("/api/")) {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (pathname === "/api/health" && req.method === "GET") {
      sendJson(res, 200, {
        status: "ok",
        timestamp: new Date().toISOString(),
        storage: contactsFilePath,
      });
      return;
    }

    if (pathname === "/api/contact" && req.method === "POST") {
      await handleContactSubmission(req, res);
      return;
    }

    sendJson(res, 404, { error: "Endpoint not found" });
    return;
  }

  if (pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  let safePath = pathname;

  if (safePath === "/" || safePath === "") {
    safePath = "index.html";
  } else {
    safePath = safePath.replace(/^\/+/, "");
  }

  const normalizedPath = path.normalize(safePath);
  const requestedPath = path.resolve(publicDirectory, normalizedPath);

  if (!requestedPath.startsWith(publicDirectory)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  await serveStaticFile(res, requestedPath);
}

async function startServer() {
  await ensureContactStore();

  const server = http.createServer((req, res) => {
    routeRequest(req, res).catch((error) => {
      console.error("Unhandled server error:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": MIME_TYPES[".json"] });
      }
      res.end(JSON.stringify({ error: "Unexpected server error" }));
    });
  });

  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start server:", error);
  process.exitCode = 1;
});
