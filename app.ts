import express from "express";
import cors from "cors";
import { connectRedis, redisClient} from "./utils/redisClient";

import device_routes from "./routes/device";
import scan_routes from "./routes/scan";

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

//Middleware
app.use(express.json()); //Json parsing
app.use(logger); //Logger Middleware

console.log("App initialized");

//Add the routes
app.use("/api/device", device_routes);
app.use("/api/scan", scan_routes);


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
