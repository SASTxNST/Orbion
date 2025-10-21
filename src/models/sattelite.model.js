import mongoose from "mongoose";

const SatelliteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  tle: {
    line1: { type: String, required: true },
    line2: { type: String, required: true },
  },
});

export const Satellite = mongoose.model("Satellite", SatelliteSchema);
