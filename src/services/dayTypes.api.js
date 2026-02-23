import { timeTrackApi } from "./api";

export const getDayTypes = async () => {
  try {
    const response = await timeTrackApi.get(`/daytypes`);
    return response.data;
  } catch (error) {
    console.error("Error fetching calendar days:", error);
    throw error;
  }
};
