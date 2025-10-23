import React, { useState, useEffect, useRef } from "react";
import {
  Entity,
  PolylineGraphics,
  PointGraphics,
  LabelGraphics,
  PathGraphics,
} from "resium";
import * as Cesium from "cesium";
import {
  generateOrbitPath,
  getCurrentPosition,
  updateSatellitePosition,
  generateGroundTrack,
} from "../utils/satellitePropagation";

export default function Satellite({
  satellite,
  color = Cesium.Color.CYAN,
  showOrbit = true,
  showGroundTrack = false,
  showLabel = true,
  isSelected = false,
}) {
  const [orbitData, setOrbitData] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [groundTrack, setGroundTrack] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const updateIntervalRef = useRef(null);

  // Generate orbit data when satellite changes
  useEffect(() => {
    if (!satellite) {
      setOrbitData(null);
      setCurrentPosition(null);
      return;
    }

    console.log(`Generating orbit for satellite: ${satellite.name}`);
    const orbit = generateOrbitPath(satellite);

    if (orbit) {
      setOrbitData(orbit);
      console.log(
        `Orbit generated for ${satellite.name}, period: ${orbit.period.toFixed(
          2
        )} minutes`
      );

      // Set initial position
      const initialPos = getCurrentPosition(orbit);
      setCurrentPosition(initialPos);
    } else {
      console.warn(`Failed to generate orbit for satellite: ${satellite.name}`);
      setOrbitData(null);
      setCurrentPosition(null);
    }
  }, [satellite]);

  // Generate ground track when requested
  useEffect(() => {
    if (satellite && showGroundTrack) {
      const track = generateGroundTrack(satellite);
      setGroundTrack(track);
    } else {
      setGroundTrack([]);
    }
  }, [satellite, showGroundTrack]);

  // Real-time position updates
  useEffect(() => {
    if (!orbitData) return;

    const updatePosition = () => {
      const currentTime = new Date();

      // Use the sampled position property for smooth interpolation
      const newPosition = updateSatellitePosition(orbitData, currentTime);

      if (newPosition) {
        setCurrentPosition(newPosition);
      }
    };

    // Update every 1 second for smooth movement
    updateIntervalRef.current = setInterval(updatePosition, 1000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [orbitData]);

  // Handle visibility
  useEffect(() => {
    setIsVisible(!!currentPosition);
  }, [currentPosition]);

  if (!satellite || !orbitData || !currentPosition || !isVisible) {
    return null;
  }

  // Enhanced colors for selected satellite
  const satelliteColor = isSelected ? Cesium.Color.YELLOW : color;
  const orbitColor = isSelected
    ? Cesium.Color.YELLOW.withAlpha(0.8)
    : color.withAlpha(0.6);

  // Create orbit path positions for rendering
  const orbitPositions = orbitData.positions || [];

  return (
    <>
      {/* Satellite Point with animated position */}
      <Entity
        position={orbitData.sampledPosition}
        name={satellite.name}
        description={`
          <p><strong>Satellite:</strong> ${satellite.name}</p>
          <p><strong>NORAD ID:</strong> ${satellite.noradCatId || "Unknown"}</p>
          <p><strong>Object ID:</strong> ${satellite.objectId || "Unknown"}</p>
          <p><strong>Orbital Period:</strong> ${orbitData.period.toFixed(
            2
          )} minutes</p>
        `}
      >
        <PointGraphics
          pixelSize={isSelected ? 12 : 8}
          color={satelliteColor}
          outlineColor={Cesium.Color.WHITE}
          outlineWidth={isSelected ? 3 : 2}
          heightReference={Cesium.HeightReference.NONE}
          scaleByDistance={new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5)}
        />

        {/* Satellite Label */}
        {showLabel && (
          <LabelGraphics
            text={satellite.name}
            font="12pt monospace"
            fillColor={satelliteColor}
            outlineColor={Cesium.Color.BLACK}
            outlineWidth={2}
            style={Cesium.LabelStyle.FILL_AND_OUTLINE}
            pixelOffset={new Cesium.Cartesian2(0, -40)}
            showBackground={true}
            backgroundColor={Cesium.Color.BLACK.withAlpha(0.7)}
            backgroundPadding={new Cesium.Cartesian2(8, 4)}
            scaleByDistance={new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5)}
          />
        )}

        {/* Orbital Path - using PathGraphics for smooth animation */}
        {showOrbit && (
          <PathGraphics
            show={true}
            leadTime={orbitData.period * 30} // Show half orbit ahead (in seconds)
            trailTime={orbitData.period * 30} // Show half orbit behind (in seconds)
            width={isSelected ? 3 : 2}
            material={orbitColor}
            resolution={60}
          />
        )}
      </Entity>

      {/* Complete Orbit Line (static reference) */}
      {showOrbit && orbitPositions.length > 1 && (
        <Entity>
          <PolylineGraphics
            positions={orbitPositions}
            width={isSelected ? 2 : 1}
            material={orbitColor.withAlpha(0.6)}
            clampToGround={false}
            followSurface={false}
            show={true}
          />
        </Entity>
      )}

      {/* Ground Track */}
      {showGroundTrack && groundTrack.length > 0 && (
        <Entity>
          <PolylineGraphics
            positions={groundTrack.map((point) =>
              Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, 0)
            )}
            width={2}
            material={Cesium.Color.ORANGE.withAlpha(0.7)}
            clampToGround={true}
          />
        </Entity>
      )}
    </>
  );
}
