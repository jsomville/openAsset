import express from "express";
import cors from "cors";
import compression from "compression";
import path from "path";
import zlib from "zlib";
import { connectRedis, redisClient} from "./utils/redisClient";

import device_routes from "./routes/device";
import scan_routes from "./routes/scan";
import package_routes from "./routes/package";

import logger from './middleware/logger';
import notFoundHandler from './middleware/notfound';

// Create Express object
const app = express();

//Use cors
const corsOptions = {
  origin: "*",
  methods: ["GET", "PUT", "POST", "DELETE"],
};
app.use(cors(corsOptions));

//Hardening
app.disable("x-powered-by");
app.set("trust proxy", true);

//Connect Redis
(async () => {
  await connectRedis();
})();

// Custom middleware to handle gzip-compressed request bodies BEFORE json parser
app.use((req, res, next) => {
  if (req.headers['content-encoding'] === 'gzip') {
    const gunzip = zlib.createGunzip();
    let data = Buffer.alloc(0);
    
    gunzip.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
    });
    
    gunzip.on('end', () => {
      try {
        (req as any).body = JSON.parse(data.toString('utf-8'));
        next();
      } catch (err) {
        console.error('JSON parse error:', err);
        res.status(400).json({ message: "Invalid JSON in decompressed body" });
      }
    });
    
    gunzip.on('error', (err) => {
      console.error('Gunzip error:', err);
      res.status(400).json({ message: "Failed to decompress request body" });
    });
    
    req.pipe(gunzip);
  } else {
    next();
  }
});

//Middleware
app.use(express.json({ limit: '50mb' })); //Json parsing with large payload support
app.use(compression()); //Gzip compression for responses
app.use(logger); //Logger Middleware

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

console.log("App initialized");

//Add the routes
app.use("/api/device", device_routes);
app.use("/api/scan", scan_routes);
app.use("/api/package", package_routes);

// Version endpoint
app.get("/api/version", (req, res) => {
  const packageJson = require("./package.json");
  res.json({ version: packageJson.version });
});


//Add after routes middleware
app.use(notFoundHandler);

//Shutdown gracefully
async function shutdown(arg: string) {
  //Close Redis
  if (redisClient.isOpen) {
    try {
      await redisClient.quit();
      console.log('✅ Redis disconnected');
    }
    catch (err) {
      console.error('❌ Error disconnecting Redis:', err);
    }
  }
  process.exit(0);
}

if (process.env.NODE_ENV !== "test") {
  process.on("SIGINT", () => shutdown("sigint"));
  process.on("SIGTERM", () => shutdown("sigterm"));
  process.on("exit", () => shutdown("exit"));
}

export { app, shutdown };
