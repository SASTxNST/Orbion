import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import morgan from "morgan";
import satteliteRouter from "./src/routes/sattelite.route.js";
import groupRouter from "./src/routes/group.route.js";

dotenv.config();

connectDB();

const app = express();
app.use(express.json());

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ msg: "test route works!" });
});

app.use("/api/sat", satteliteRouter);
app.use("/api/grp", groupRouter);

export default app;
