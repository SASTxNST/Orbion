import React from "react";
import Earth from "../components/Earth";
import Sidebar from "../components/Sidebar";

export default function Tracker() {
  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1">
        <Earth />
      </div>
    </div>
  );
}
