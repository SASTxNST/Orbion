import * as Cesium from "cesium";

/**
 * Satellite visualization utilities for managing multiple satellites and groups
 */

// Predefined colors for different satellite groups/types
export const SATELLITE_COLORS = {
  STARLINK: Cesium.Color.CYAN,
  GPS: Cesium.Color.GREEN,
  COMMUNICATION: Cesium.Color.YELLOW,
  WEATHER: Cesium.Color.ORANGE,
  MILITARY: Cesium.Color.RED,
  SCIENTIFIC: Cesium.Color.PURPLE,
  DEFAULT: Cesium.Color.WHITE,
};

/**
 * Get color for satellite based on its type or group
 */
export const getSatelliteColor = (satellite) => {
  if (!satellite) return SATELLITE_COLORS.DEFAULT;

  const name = satellite.name?.toLowerCase() || "";

  if (name.includes("starlink")) return SATELLITE_COLORS.STARLINK;
  if (name.includes("gps") || name.includes("navstar"))
    return SATELLITE_COLORS.GPS;
  if (name.includes("goes") || name.includes("noaa"))
    return SATELLITE_COLORS.WEATHER;
  if (name.includes("intelsat") || name.includes("ses"))
    return SATELLITE_COLORS.COMMUNICATION;

  return SATELLITE_COLORS.DEFAULT;
};

/**
 * Calculate optimal camera position to view a satellite
 */
export const calculateCameraPosition = (satellitePosition, viewer) => {
  if (!satellitePosition || !viewer) return null;

  try {
    const cartographic = Cesium.Cartographic.fromCartesian(satellitePosition);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const altitude = cartographic.height;

    // Calculate appropriate viewing distance based on satellite altitude
    const viewingDistance = Math.max(altitude * 2, 1000000); // At least 1000km away

    return {
      destination: Cesium.Cartesian3.fromDegrees(
        longitude,
        latitude,
        viewingDistance
      ),
      orientation: {
        heading: 0.0,
        pitch: -Cesium.Math.PI_OVER_TWO * 0.3, // Look down at 30 degrees
        roll: 0.0,
      },
    };
  } catch (error) {
    console.error("Error calculating camera position:", error);
    return null;
  }
};

/**
 * Calculate bounding sphere for multiple satellites
 */
export const calculateSatellitesBounds = (satellites, orbitDataMap) => {
  const positions = [];

  satellites.forEach((satellite) => {
    const orbitData = orbitDataMap.get(
      satellite.objectId || satellite.noradCatId
    );
    if (orbitData && orbitData.positions) {
      positions.push(...orbitData.positions);
    }
  });

  if (positions.length === 0) return null;

  try {
    return Cesium.BoundingSphere.fromPoints(positions);
  } catch (error) {
    console.error("Error calculating satellites bounds:", error);
    return null;
  }
};

/**
 * Smooth camera transition to view satellites
 */
export const focusOnSatellites = (
  satellites,
  viewer,
  orbitDataMap,
  duration = 3.0
) => {
  if (!viewer || !satellites || satellites.length === 0) return;

  if (satellites.length === 1) {
    // Focus on single satellite
    const satellite = satellites[0];
    const orbitData = orbitDataMap.get(
      satellite.objectId || satellite.noradCatId
    );

    if (orbitData && orbitData.positions && orbitData.positions.length > 0) {
      const position = orbitData.positions[0]; // Use first position as reference
      const cameraPosition = calculateCameraPosition(position, viewer);

      if (cameraPosition) {
        viewer.camera.flyTo({
          ...cameraPosition,
          duration: duration,
        });
      }
    }
  } else {
    // Focus on multiple satellites
    const boundingSphere = calculateSatellitesBounds(satellites, orbitDataMap);

    if (boundingSphere) {
      viewer.camera.flyToBoundingSphere(boundingSphere, {
        duration: duration,
        offset: new Cesium.HeadingPitchRange(
          0,
          -Cesium.Math.PI_OVER_TWO * 0.3,
          0
        ),
      });
    }
  }
};

/**
 * Filter satellites by group or type
 */
export const filterSatellitesByGroup = (satellites, groupName) => {
  if (!satellites || !groupName) return [];

  return satellites.filter((satellite) => {
    const name = satellite.name?.toLowerCase() || "";
    const group = groupName.toLowerCase();

    switch (group) {
      case "starlink":
        return name.includes("starlink");
      case "gps":
        return name.includes("gps") || name.includes("navstar");
      case "weather":
        return (
          name.includes("goes") ||
          name.includes("noaa") ||
          name.includes("weather")
        );
      case "communication":
        return (
          name.includes("intelsat") ||
          name.includes("ses") ||
          name.includes("comm")
        );
      default:
        return satellite.group === groupName;
    }
  });
};

/**
 * Performance optimization: Limit visible satellites based on camera distance
 */
export const getVisibleSatellites = (
  satellites,
  cameraPosition,
  maxDistance = 50000000
) => {
  if (!satellites || !cameraPosition) return satellites;

  return satellites.filter((satellite) => {
    // This would need actual satellite positions to work properly
    // For now, return all satellites
    return true;
  });
};

/**
 * Create satellite entities with performance optimizations
 */
export const createOptimizedSatelliteEntities = (satellites, viewer) => {
  const entities = [];

  satellites.forEach((satellite, index) => {
    const color = getSatelliteColor(satellite);

    // Add performance-based LOD (Level of Detail)
    const entity = {
      satellite,
      color,
      showOrbit: index < 10, // Only show orbits for first 10 satellites
      showLabel: index < 5, // Only show labels for first 5 satellites
      priority: index, // Rendering priority
    };

    entities.push(entity);
  });

  return entities;
};

/**
 * Satellite selection and highlighting utilities
 */
export const highlightSatellite = (satellite, viewer) => {
  // Remove existing highlights
  viewer.selectedEntity = undefined;

  // Add highlight effect (this would be implemented based on your Entity structure)
  if (satellite) {
    console.log(`Highlighting satellite: ${satellite.name}`);
    // Implementation would depend on how entities are structured
  }
};

/**
 * Ground station visibility calculations
 */
export const calculateGroundStationVisibility = (
  satellite,
  groundStationLat,
  groundStationLon,
  minElevation = 10
) => {
  // This would implement satellite visibility calculations from ground stations
  // For now, return placeholder
  return {
    isVisible: false,
    elevation: 0,
    azimuth: 0,
    nextPass: null,
  };
};
