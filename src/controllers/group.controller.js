import { Group } from "../models/Group.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";

const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find().select("name satellites");

    const result = groups.map((g) => ({
      name: g.name,
      satelliteCount: g.satellites.length,
    }));

    res
      .status(200)
      .json(
        new ApiResponse(200, "Groups fetched successfully", { groups: result })
      );
  } catch (err) {
    console.error("Failed to fetch groups");
    res.status(500).json(new ApiError(500, "Failed to fetch groups"));
  }
};

const getSatellitesByGroupName = async (req, res) => {
  try {
    const { groupName } = req.params;

    const group = await Group.findOne({ name: groupName }).populate(
      "satellites"
    );

    if (!group)
      return res.status(404).json(new ApiError(404, "Group not found"));

    const satellites = group.satellites.map((s) => ({
      name: s.name,
      tle: s.tle,
    }));

    res.status(200).json(
      new ApiResponse(200, "Fetched group successfully", {
        group: group.name,
        satellites,
      })
    );
  } catch (err) {
    console.error("Failed to fetch group");
    res.status(500).json(new ApiError(500, "Failed to fetch group"));
  }
};

export { getAllGroups, getSatellitesByGroupName };
