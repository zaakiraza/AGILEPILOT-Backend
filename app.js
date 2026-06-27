import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routers from "./routes/Router.js";
import connection from "./utils/DB.js";
import errorHandler from "./middleware/errorHandler.js";
import { isMailConfigured } from "./utils/mailer.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: ["https://agilepilot-frontend.vercel.app", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

connection();

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "AgilePilot API is running",
    host: "local",
    mailConfigured: isMailConfigured(),
    devExposeOtp: process.env.DEV_EXPOSE_OTP === "true",
  });
});

app.use("/api", routers);

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;