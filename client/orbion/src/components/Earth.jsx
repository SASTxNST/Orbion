import React, { useRef, useEffect, useState } from "react";
import { Viewer, Entity, ImageryLayer } from "resium";
import * as Cesium from "cesium";
import { useSatelliteData } from "../../context/SatelliteDataContext";
import Satellite from "./Satellite";

export default function Earth() {
  const { selectedSatellite, selectedGroup } = useSatelliteData();
  const viewerRef = useRef();
  const [imageryProvider, setImageryProvider] = useState(null);
  const [allSatellites, setAllSatellites] = useState([]);

  // Initialize imagery provider for realistic Earth textures
  useEffect(() => {
    Cesium.IonImageryProvider.fromAssetId(3845).then((provider) => {
      setImageryProvider(provider);
    });
  }, []);

  // Handle selected satellite changes
  useEffect(() => {
    if (selectedSatellite) {
      console.log(`Selected satellite:`, selectedSatellite);
      console.log(`TLE Data:`, {
        line1: selectedSatellite.tle_line1,
        line2: selectedSatellite.tle_line2,
        noradId: selectedSatellite.noradCatId,
      });

      // Add selected satellite to the collection if not already present
      setAllSatellites((prev) => {
        const exists = prev.some(
          (sat) =>
            (sat.objectId && sat.objectId === selectedSatellite.objectId) ||
            (sat.noradCatId && sat.noradCatId === selectedSatellite.noradCatId)
        );

        if (!exists) {
          return [...prev, selectedSatellite];
        }
        return prev;
      });
    }
  }, [selectedSatellite]);

  // Handle selected group changes
  useEffect(() => {
    if (selectedGroup) {
      console.log(`Group selected: ${selectedGroup}`);

      // Here you would typically fetch satellites for the selected group
      // For now, we'll use a placeholder implementation
      // In a real application, you would call your API to get group satellites

      // Example: fetchSatellitesForGroup(selectedGroup).then(setAllSatellites);

      // Clear individual satellite selection when group is selected
      if (selectedGroup !== selectedSatellite?.group) {
        // Keep current satellites for now, but you could clear them
        // setAllSatellites([]);
      }
    }
  }, [selectedGroup, selectedSatellite]);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Viewer
        ref={viewerRef}
        full
        sceneMode={3}
        baseLayerPicker={false}
        timeline={true}
        animation={true}
        navigationHelpButton={false}
        infoBox={true}
        selectionIndicator={true}
        shouldAnimate={true}
        onMount={(viewer) => {
          if (viewer && viewer.screenSpaceEventHandler) {
            viewer.screenSpaceEventHandler.removeInputAction(
              Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
            );

            // Enable depth testing for better 3D visualization
            viewer.scene.globe.depthTestAgainstTerrain = true;

            // Configure timeline for satellite tracking
            viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
            viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
            viewer.clock.multiplier = 1;
            viewer.clock.shouldAnimate = true;

            // Optimize performance settings
            viewer.scene.requestRenderMode = false; // Keep rendering for smooth satellite movement
            viewer.scene.maximumRenderTimeChange = Infinity;

            // Configure globe for better satellite visualization
            viewer.scene.globe.enableLighting = true;
            viewer.scene.globe.atmosphereShownFromSpace = true;
          }
        }}
      >
        {/* Use lower-lag imagery layer for Earth textures */}
        {imageryProvider && <ImageryLayer imageryProvider={imageryProvider} />}

        {/* Direct satellite rendering for debugging */}
        {selectedSatellite && (
          <Satellite
            satellite={selectedSatellite}
            color={Cesium.Color.CYAN}
            showOrbit={true}
            showGroundTrack={false}
            showLabel={true}
            isSelected={true}
          />
        )}
      </Viewer>
    </div>
  );
}
