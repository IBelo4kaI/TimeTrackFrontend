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

export const createDayType = async (data) => {
  try {
    const response = await timeTrackApi.post("/daytypes", data);
    return response.data;
  } catch (error) {
    console.error("Ошибка при создании типа дня:", error);
    throw error;
  }
};

export const updateDayType = async (id, data) => {
  try {
    const response = await timeTrackApi.put(`/daytypes/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Ошибка при обновлении типа дня:", error);
    throw error;
  }
};

export const deleteDayType = async (id) => {
  try {
    const response = await timeTrackApi.delete(`/daytypes/${id}`);
    return response.data;
  } catch (error) {
    console.error("Ошибка при удалении типа дня:", error);
    throw error;
  }
};
