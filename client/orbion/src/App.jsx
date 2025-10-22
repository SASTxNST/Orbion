import React from "react";
import { Ion } from "cesium";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Tracker from "./pages/Tracker";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SatelliteDataProvider } from "../context/SatelliteDataContext";

function App() {
  const client = new QueryClient();
  Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Tracker />,
    },
  ]);

  return (
    <QueryClientProvider client={client}>
      <SatelliteDataProvider>
        <RouterProvider router={router} />
      </SatelliteDataProvider>
    </QueryClientProvider>
  );
}

export default App;
