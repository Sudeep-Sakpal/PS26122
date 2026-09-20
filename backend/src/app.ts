import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import { env, isProduction } from "./config/env";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.frontendOrigin,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  if (!isProduction) app.use(morgan("dev"));

  app.get("/", (_req, res) => {
    res.json({ name: "PS 26122 API", status: "running" });
  });

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
