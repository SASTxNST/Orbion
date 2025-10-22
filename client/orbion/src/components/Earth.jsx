import React, { useRef, useEffect, useState } from "react";
import { Viewer, ImageryLayer } from "resium";
import * as Cesium from "cesium";
import { useSatelliteData } from "../../context/SatelliteDataContext";

export default function Earth() {
  const { selectedSatellite, selectedGroup } = useSatelliteData();
  const viewerRef = useRef();
  const [imageryProvider, setImageryProvider] = useState(null);

  // Initialize imagery provider for realistic Earth textures
  useEffect(() => {
    Cesium.IonImageryProvider.fromAssetId(3845).then((provider) => {
      setImageryProvider(provider);
    });
  }, []);

  // Handle selected satellite changes
  useEffect(() => {
    if (selectedSatellite && viewerRef.current?.cesiumElement) {
      console.log(`Selected satellite:`, selectedSatellite);
      console.log(`TLE Data:`, {
        line1: selectedSatellite.tle_line1,
        line2: selectedSatellite.tle_line2,
        noradId: selectedSatellite.noradCatId,
      });

      // Now you have full satellite data including:
      // - selectedSatellite.name
      // - selectedSatellite.objectId
      // - selectedSatellite.noradCatId
      // - selectedSatellite.tle_line1
      // - selectedSatellite.tle_line2
      // - All orbital parameters (inclination, eccentricity, etc.)
    }
  }, [selectedSatellite]);

  // Handle selected group changes
  useEffect(() => {
    if (selectedGroup) {
      console.log(`Group selected: ${selectedGroup}`);
      // Here you can add logic to:
      // 1. Show all satellites in the group
      // 2. Highlight the group's orbital paths
      // 3. Adjust camera to show all group satellites
    }
  }, [selectedGroup]);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Viewer
        ref={viewerRef}
        full
        sceneMode={3}
        baseLayerPicker={false}
        timeline={false}
        animation={false}
        navigationHelpButton={false}
        infoBox={false}
        selectionIndicator={false}
        onMount={(viewer) => {
          if (viewer && viewer.screenSpaceEventHandler) {
            viewer.screenSpaceEventHandler.removeInputAction(
              Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
            );
          }
        }}
      >
        {/* Use lower-lag imagery layer for Earth textures */}
        {imageryProvider && <ImageryLayer imageryProvider={imageryProvider} />}
      </Viewer>
    </div>
  );
}
