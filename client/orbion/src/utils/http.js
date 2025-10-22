import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const getAllGroups = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/grp`);
    return response;
  } catch (error) {
    console.error("Error fetching groups:", error);
    throw error;
  }
};

export const getGroupWithSatellites = async (groupName) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/grp/${groupName}`);
    return response;
  } catch (error) {
    console.error("Error fetching group satellites:", error);
    throw error;
  }
};
