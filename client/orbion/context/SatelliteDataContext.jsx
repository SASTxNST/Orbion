import React, { createContext, useContext, useState } from "react";

const SatelliteDataContext = createContext();

export const SatelliteDataProvider = ({ children }) => {
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const value = {
    selectedSatellite,
    setSelectedSatellite,
    selectedGroup,
    setSelectedGroup,
  };

  return (
    <SatelliteDataContext.Provider value={value}>
      {children}
    </SatelliteDataContext.Provider>
  );
};

export const useSatelliteData = () => {
  const context = useContext(SatelliteDataContext);
  if (!context) {
    throw new Error(
      "useSatelliteData must be used within a SatelliteDataProvider"
    );
  }
  return context;
};

export default SatelliteDataContext;
