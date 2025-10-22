import React from "react";
import { Ion } from "cesium";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Tracker from "./pages/Tracker";

function App() {
  Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Tracker />,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
