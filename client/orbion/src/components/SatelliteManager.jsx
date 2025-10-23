import React, { useState, useEffect, useRef, useCallback } from "react";
import Satellite from "./Satellite";
import {
  getSatelliteColor,
  createOptimizedSatelliteEntities,
  focusOnSatellites,
  filterSatellitesByGroup,
} from "../utils/satelliteVisualization";
import { generateOrbitPath } from "../utils/satellitePropagation";

/**
 * SatelliteManager - Handles multiple satellites with performance optimizations
 */
export default function SatelliteManager({
  satellites = [],
  selectedSatellite = null,
  selectedGroup = null,
  viewer = null,
  maxVisibleSatellites = 50,
  showOrbits = true,
  showLabels = true,
}) {
  const [renderedSatellites, setRenderedSatellites] = useState([]);
  const [orbitDataMap, setOrbitDataMap] = useState(new Map());
  const [loadingOrbits, setLoadingOrbits] = useState(false);
  const orbitGenerationQueue = useRef(new Set());
  const lastUpdateTime = useRef(Date.now());

  // Debounced orbit generation to prevent excessive calculations
  const generateOrbitsForSatellites = useCallback(
    async (satellitesToProcess) => {
      if (loadingOrbits) return;

      setLoadingOrbits(true);
      const newOrbitDataMap = new Map(orbitDataMap);

      // Process satellites in batches to prevent UI blocking
      const batchSize = 5;
      const batches = [];

      for (let i = 0; i < satellitesToProcess.length; i += batchSize) {
        batches.push(satellitesToProcess.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await new Promise((resolve) => {
          setTimeout(() => {
            batch.forEach((satellite) => {
              const key = satellite.objectId || satellite.noradCatId;

              if (
                !newOrbitDataMap.has(key) &&
                !orbitGenerationQueue.current.has(key)
              ) {
                orbitGenerationQueue.current.add(key);

                try {
                  const orbitData = generateOrbitPath(satellite);
                  if (orbitData) {
                    newOrbitDataMap.set(key, orbitData);
                    console.log(`Generated orbit for: ${satellite.name}`);
                  } else {
                    console.warn(
                      `Failed to generate orbit for: ${satellite.name}`
                    );
                  }
                } catch (error) {
                  console.error(
                    `Error generating orbit for ${satellite.name}:`,
                    error
                  );
                } finally {
                  orbitGenerationQueue.current.delete(key);
                }
              }
            });
            resolve();
          }, 50); // Small delay to prevent UI blocking
        });
      }

      setOrbitDataMap(newOrbitDataMap);
      setLoadingOrbits(false);
    },
    [orbitDataMap, loadingOrbits]
  );

  // Handle satellite selection and filtering
  useEffect(() => {
    let satellitesToRender = [];

    if (selectedSatellite) {
      // Single satellite mode
      satellitesToRender = [selectedSatellite];
    } else if (selectedGroup) {
      // Group mode
      satellitesToRender = filterSatellitesByGroup(
        satellites,
        selectedGroup
      ).slice(0, maxVisibleSatellites);
    } else {
      // All satellites mode (limited for performance)
      satellitesToRender = satellites.slice(
        0,
        Math.min(maxVisibleSatellites, 10)
      );
    }

    setRenderedSatellites(satellitesToRender);

    // Generate orbits for new satellites
    if (satellitesToRender.length > 0) {
      generateOrbitsForSatellites(satellitesToRender);
    }
  }, [
    satellites,
    selectedSatellite,
    selectedGroup,
    maxVisibleSatellites,
    generateOrbitsForSatellites,
  ]);

  // Auto-focus camera on selected satellites
  useEffect(() => {
    if (viewer && renderedSatellites.length > 0 && orbitDataMap.size > 0) {
      // Delay to allow orbits to be calculated
      const timer = setTimeout(() => {
        focusOnSatellites(renderedSatellites, viewer, orbitDataMap);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [viewer, renderedSatellites, orbitDataMap]);

  // Performance monitoring
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;

    if (timeSinceLastUpdate > 100) {
      // Log if updates are too frequent
      console.log(
        `SatelliteManager update: ${renderedSatellites.length} satellites, ${orbitDataMap.size} orbits calculated`
      );
    }

    lastUpdateTime.current = now;
  });

  // Cleanup orbit data for satellites no longer being rendered
  useEffect(() => {
    const currentKeys = new Set(
      renderedSatellites.map((s) => s.objectId || s.noradCatId)
    );
    const newOrbitDataMap = new Map();

    for (const [key, value] of orbitDataMap.entries()) {
      if (currentKeys.has(key)) {
        newOrbitDataMap.set(key, value);
      }
    }

    if (newOrbitDataMap.size !== orbitDataMap.size) {
      setOrbitDataMap(newOrbitDataMap);
    }
  }, [renderedSatellites, orbitDataMap]);

  return (
    <>
      {renderedSatellites.map((satellite, index) => {
        const key = satellite.objectId || satellite.noradCatId || index;
        const isSelected = satellite === selectedSatellite;
        const color = getSatelliteColor(satellite);

        // Performance optimizations based on satellite priority
        const showOrbit = showOrbits && (isSelected || index < 5);
        const showLabel = showLabels && (isSelected || index < 3);
        const showGroundTrack = isSelected;

        return (
          <Satellite
            key={key}
            satellite={satellite}
            color={color}
            showOrbit={showOrbit}
            showGroundTrack={showGroundTrack}
            showLabel={showLabel}
            isSelected={isSelected}
          />
        );
      })}

      {/* Loading indicator */}
      {loadingOrbits && renderedSatellites.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            zIndex: 1000,
          }}
        >
          Calculating orbits... ({orbitDataMap.size}/{renderedSatellites.length}
          )
        </div>
      )}
    </>
  );
}
