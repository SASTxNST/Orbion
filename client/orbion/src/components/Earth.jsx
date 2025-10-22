import React, { useRef, useEffect, useState } from "react";
import { Viewer, ImageryLayer } from "resium";
import * as Cesium from "cesium";

export default function Earth() {
  const viewerRef = useRef();
  const [imageryProvider, setImageryProvider] = useState(null);

  // Initialize imagery provider for realistic Earth textures
  useEffect(() => {
    Cesium.IonImageryProvider.fromAssetId(3845).then((provider) => {
      setImageryProvider(provider);
    });
  }, []);

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
