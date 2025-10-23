import { twoline2satrec, propagate, gstime, eciToGeodetic } from "satellite.js";
import * as Cesium from "cesium";

// Constants
const EARTH_RADIUS_KM = 6371;
const GRAVITATIONAL_PARAMETER = 3.986004418e14; // m³/s²

/**
 * Calculate orbital period in minutes from position and velocity
 */
export const calculateOrbitalPeriod = (position, velocity) => {
  const { x, y, z } = position;
  const { x: vx, y: vy, z: vz } = velocity;

  const positionMagnitude = Math.sqrt(x * x + y * y + z * z) * 1000; // Convert to meters
  const velocityMagnitude = Math.sqrt(vx * vx + vy * vy + vz * vz) * 1000; // Convert to m/s

  // Calculate semi-major axis using vis-viva equation
  const specificEnergy =
    (velocityMagnitude * velocityMagnitude) / 2 -
    GRAVITATIONAL_PARAMETER / positionMagnitude;
  const semiMajorAxis = -GRAVITATIONAL_PARAMETER / (2 * specificEnergy);

  // Calculate orbital period using Kepler's third law
  const period =
    2 * Math.PI * Math.sqrt(semiMajorAxis ** 3 / GRAVITATIONAL_PARAMETER);

  return period / 60; // Return in minutes
};

/**
 * Calculate optimal number of points for orbital path
 */
export const calculateOptimalPoints = (periodMinutes) => {
  const minPoints = 20;
  const maxPoints = 150;

  // More points for longer orbits, but with diminishing returns
  const basePoints = Math.min(
    maxPoints,
    Math.max(minPoints, Math.floor(periodMinutes / 5))
  );

  return basePoints;
};

/**
 * Propagate satellite position at given time
 */
export const propagateSatellite = (satrec, date) => {
  const gmst = gstime(date);

  const positionAndVelocity = propagate(satrec, date);

  if (positionAndVelocity.error) {
    return null;
  }

  const { position, velocity } = positionAndVelocity;

  // Check for valid data
  if (
    !position ||
    !velocity ||
    isNaN(position.x) ||
    isNaN(position.y) ||
    isNaN(position.z) ||
    isNaN(velocity.x) ||
    isNaN(velocity.y) ||
    isNaN(velocity.z)
  ) {
    return null;
  }

  return {
    position,
    velocity,
    gmst,
  };
};

/**
 * Convert ECI coordinates to Cesium Cartesian3 (in meters)
 */
export const eciToCesium = (eciPosition) => {
  return new Cesium.Cartesian3(
    eciPosition.x * 1000, // Convert km to meters
    eciPosition.y * 1000,
    eciPosition.z * 1000
  );
};

/**
 * Generate complete orbital path for a satellite
 */
export const generateOrbitPath = (satellite) => {
  const { tle_line1, tle_line2 } = satellite;

  if (!tle_line1 || !tle_line2) {
    console.warn("Missing TLE data for satellite:", satellite.name);
    return null;
  }

  try {
    const satrec = twoline2satrec(tle_line1, tle_line2);
    const currentTime = new Date();

    // Get initial propagation to calculate period
    const initialProp = propagateSatellite(satrec, currentTime);
    if (!initialProp) {
      console.warn("Failed to propagate satellite:", satellite.name);
      return null;
    }

    const period = calculateOrbitalPeriod(
      initialProp.position,
      initialProp.velocity
    );

    // Ensure reasonable period bounds
    if (period < 10 || period > 10000 || isNaN(period)) {
      console.warn(
        `Invalid orbital period for ${satellite.name}: ${period} minutes`
      );
      return null;
    }

    const numPoints = calculateOptimalPoints(period);
    console.log(
      `Generating ${numPoints} points for ${
        satellite.name
      } (period: ${period.toFixed(2)} min)`
    );

    const positions = [];
    const times = [];

    // Generate points over one complete orbit
    const periodMs = period * 60 * 1000;
    const timeStep = periodMs / numPoints;

    let validPoints = 0;
    for (let i = 0; i < numPoints; i++) {
      const time = new Date(currentTime.getTime() + i * timeStep);
      const propagated = propagateSatellite(satrec, time);

      if (propagated) {
        const cesiumPos = eciToCesium(propagated.position);

        // Validate position is reasonable (not NaN and within expected bounds)
        if (
          cesiumPos &&
          !isNaN(cesiumPos.x) &&
          !isNaN(cesiumPos.y) &&
          !isNaN(cesiumPos.z) &&
          Math.abs(cesiumPos.x) < 1e8 &&
          Math.abs(cesiumPos.y) < 1e8 &&
          Math.abs(cesiumPos.z) < 1e8
        ) {
          positions.push(cesiumPos);
          times.push(Cesium.JulianDate.fromDate(time));
          validPoints++;
        }
      }
    }

    console.log(
      `Generated ${validPoints} valid points out of ${numPoints} for ${satellite.name}`
    );

    // Need at least a reasonable number of points for a valid orbit
    if (validPoints < 10) {
      console.warn(
        `Too few valid points (${validPoints}) for satellite: ${satellite.name}`
      );
      return null;
    }

    // Close the orbit by adding the first point at the end
    if (positions.length > 0) {
      positions.push(positions[0]);
      times.push(
        Cesium.JulianDate.fromDate(new Date(currentTime.getTime() + periodMs))
      );
    }

    // Create sampled position property for smooth interpolation
    const sampledPosition = new Cesium.SampledPositionProperty();
    sampledPosition.addSamples(times, positions);

    // Set interpolation options for smooth movement
    sampledPosition.setInterpolationOptions({
      interpolationDegree: 3, // Reduced for better performance
      interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
    });

    console.log(`Successfully created orbit data for ${satellite.name}`);

    return {
      satrec,
      period,
      positions,
      sampledPosition,
      epochTime: currentTime,
    };
  } catch (error) {
    console.error(
      "Error generating orbit path for satellite:",
      satellite.name,
      error
    );
    return null;
  }
};

/**
 * Get real-time position of satellite
 */
export const getCurrentPosition = (orbitData) => {
  if (!orbitData || !orbitData.satrec) {
    return null;
  }

  const currentTime = new Date();
  const propagated = propagateSatellite(orbitData.satrec, currentTime);

  if (!propagated) {
    return null;
  }

  return eciToCesium(propagated.position);
};

/**
 * Update satellite position using sampled position property
 */
export const updateSatellitePosition = (orbitData, currentTime) => {
  if (!orbitData || !orbitData.sampledPosition) {
    return null;
  }

  const julianTime = Cesium.JulianDate.fromDate(currentTime);
  return orbitData.sampledPosition.getValue(julianTime);
};

/**
 * Generate ground track coordinates for a satellite
 */
export const generateGroundTrack = (satellite, durationHours = 2) => {
  const { tle_line1, tle_line2 } = satellite;

  if (!tle_line1 || !tle_line2) {
    return [];
  }

  try {
    const satrec = twoline2satrec(tle_line1, tle_line2);
    const currentTime = new Date();
    const coordinates = [];

    // Generate points over specified duration
    const totalMinutes = durationHours * 60;
    const timeStep = 2; // 2 minutes between points
    const numPoints = Math.floor(totalMinutes / timeStep);

    for (let i = 0; i < numPoints; i++) {
      const time = new Date(currentTime.getTime() + i * timeStep * 60 * 1000);
      const propagated = propagateSatellite(satrec, time);

      if (propagated) {
        const gmst = gstime(time);
        const geodetic = eciToGeodetic(propagated.position, gmst);

        coordinates.push({
          longitude: Cesium.Math.toDegrees(geodetic.longitude),
          latitude: Cesium.Math.toDegrees(geodetic.latitude),
          altitude: geodetic.height * 1000, // Convert to meters
          time: time,
        });
      }
    }

    return coordinates;
  } catch (error) {
    console.error("Error generating ground track:", error);
    return [];
  }
};
