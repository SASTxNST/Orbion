import express from "express";
import {
  getAllSatellites,
  getOneSatellite,
} from "../controllers/sattelite.controller.js";
const satteliteRouter = express.Router();

satteliteRouter.get("/", getAllSatellites);
satteliteRouter.get("/:objectId", getOneSatellite);

export default satteliteRouter;
