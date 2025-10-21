import mongoose from "mongoose";

const satelliteSchema = new mongoose.Schema({
  name: { type: String, unique: true, index: true },
  objectId: String,
  epoch: String,
  meanMotion: Number,
  eccentricity: Number,
  inclination: Number,
  raOfAscNode: Number,
  argOfPericenter: Number,
  meanAnomaly: Number,
  ephemerisType: Number,
  classificationType: String,
  noradCatId: Number,
  elementSetNo: Number,
  revAtEpoch: Number,
  bstar: Number,
  meanMotionDot: Number,
  meanMotionDdot: Number,
  tle_line1: String,
  tle_line2: String,
  group: String,
  lastUpdated: Date,
});

export const Satellite = mongoose.model("Satellite", satelliteSchema);
