import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllGroups, getGroupWithSatellites } from "../utils/http";
import { ChevronDown, ChevronRight, Satellite, Users } from "lucide-react";
import { useSatelliteData } from "../../context/SatelliteDataContext";

const Sidebar = () => {
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const { setSelectedSatellite, setSelectedGroup } = useSatelliteData();

  // Fetch all groups
  const {
    data: groupsData,
    isPending: groupsLoading,
    error: groupsError,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: getAllGroups,
    retry: 1,
    onError: (error) => {
      console.error("Failed to fetch groups:", error);
    },
    onSuccess: (data) => {
      console.log("Groups fetched successfully:", data);
    },
  });

  const groups = groupsData?.data?.data?.groups || [];

  console.log(
    "Sidebar render - Loading:",
    groupsLoading,
    "Error:",
    groupsError,
    "Groups:",
    groups
  );

  const toggleGroup = (groupName) => {
    const newExpanded = new Set(expandedGroups);
    const isExpanding = !expandedGroups.has(groupName);

    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
      setSelectedGroup(null);
    } else {
      newExpanded.add(groupName);
      setSelectedGroup(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const handleSatelliteClick = (satellite, groupName) => {
    setSelectedSatellite({ ...satellite, groupName });
  };

  if (groupsLoading) {
    return (
      <div className="w-80 bg-slate-900 border-r border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-6">
          <Satellite className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Satellite Groups</h2>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-slate-700 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groupsError) {
    console.error("Groups error:", groupsError);
    return (
      <div className="w-80 bg-slate-900 border-r border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-6">
          <Satellite className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-bold text-white">Satellite Groups</h2>
        </div>
        <div className="text-red-400 text-sm">
          <div>Failed to load groups. Please try again.</div>
          <div className="mt-2 text-xs">
            Error: {groupsError?.message || "Unknown error"}
          </div>
          <div className="mt-2 text-xs">
            Backend URL: {import.meta.env.VITE_BACKEND_URL || "Not set"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col h-screen z-10">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Satellite className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Satellite Groups</h2>
        </div>
        <p className="text-slate-400 text-sm">
          {groups.length} groups • Click to expand
        </p>
        <div className="text-xs text-slate-500 mt-1">
          Loading: {groupsLoading ? "Yes" : "No"} | Error:{" "}
          {groupsError ? "Yes" : "No"}
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {groups.length === 0 && !groupsLoading ? (
          <div className="text-slate-400 text-sm">No groups available</div>
        ) : (
          groups.map((group) => (
            <GroupItem
              key={group._id}
              group={group}
              isExpanded={expandedGroups.has(group.name)}
              onToggle={() => toggleGroup(group.name)}
              onSatelliteSelect={handleSatelliteClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Simplified Group Component - only one API call
const GroupItem = ({ group, isExpanded, onToggle, onSatelliteSelect }) => {
  // Single API call to get group with all satellite data
  const {
    data: groupData,
    isPending: isLoading,
    error,
  } = useQuery({
    queryKey: ["group-satellites", group.name],
    queryFn: () => getGroupWithSatellites(group.name),
    enabled: isExpanded, // Only fetch when expanded
  });

  // Extract satellites directly from the response
  const satellites = groupData?.data?.data?.satellites || [];

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <Users className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-white font-medium">{group.name}</div>
            <div className="text-slate-400 text-xs">
              {group.satelliteCount} satellites
            </div>
          </div>
        </div>
      </button>

      {/* Satellites List */}
      {isExpanded && (
        <div className="bg-slate-900 border-t border-slate-700">
          {isLoading ? (
            <div className="p-4">
              <div className="text-slate-400 text-sm mb-2">
                Loading satellites...
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-8 bg-slate-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-400 text-sm">
              Failed to load satellites: {error.message}
            </div>
          ) : satellites.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {satellites.map((satellite, index) => (
                <button
                  key={satellite._id || index}
                  onClick={() => onSatelliteSelect(satellite, group.name)}
                  className="w-full px-6 py-2 text-left hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-slate-700 last:border-b-0"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <div className="text-slate-200 text-sm font-medium">
                      {satellite.name || satellite.objectId}
                    </div>
                    <div className="text-slate-500 text-xs">
                      NORAD: {satellite.noradCatId} • {satellite.objectId}
                    </div>
                    {satellite.tle_line1 && (
                      <div className="text-slate-500 text-xs">
                        TLE Available
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-slate-400 text-sm">
              No satellites found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
