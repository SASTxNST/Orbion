import express from "express";
import {
  getAllSatellites,
  getOneSatellite,
} from "../controllers/sattelite.controller";
const satteliteRouter = express.Router();

satteliteRouter.get("/", getAllSatellites);
satteliteRouter.get("/:name", getOneSatellite);

export default satteliteRouter;
