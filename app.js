import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routers from "./routes/Router.js";
import connection from "./utils/DB.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
connection();

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "AgilePilot API is running" });
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