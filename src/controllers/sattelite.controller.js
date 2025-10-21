import { Satellite } from "../models/sattelite.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";

const getAllSatellites = async (req, res) => {
  try {
    const sats = await Satellite.find();
    res.status(200).json(
      new ApiResponse(200, "All satellites fetched successfully", {
        satellites: sats,
      })
    );
  } catch (err) {
    console.error("Error while fetching satellites");
    res.status(500).json(new ApiError(500, "Unable to fetchusatellites"));
  }
};

const getOneSatellite = async (req, res) => {
  try {
    const { name } = req.params.name;

    const sat = await Satellite.findOne({ name: name });
    if (!sat) {
      return res.status(404).json(new ApiError(404, "Satellite not found"));
    }
    return res.status(200).json(
      new ApiResponse(200, "Satellite fetched successfully", {
        satelitte: sat,
      })
    );
  } catch (err) {
    console.error("Error while fetching satellite");
    res.status(500).json(new ApiError(500, "Unable to fetch satellite"));
  }
};

export { getAllSatellites, getOneSatellite };
