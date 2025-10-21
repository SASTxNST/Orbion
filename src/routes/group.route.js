import express from "express";

import {
  getAllGroups,
  getSatellitesByGroupName,
} from "../controllers/group.controller.js";

const groupRouter = express.Router();

groupRouter.get("/", getAllGroups);
groupRouter.get("/:groupName", getSatellitesByGroupName);

export default groupRouter;
