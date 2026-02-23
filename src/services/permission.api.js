import { permissionsApi } from "./api"

export const getDayTypes = async () => {
  try {
    const response = await permissionsApi.get(`/`)
    return response.data
  } catch (error) {
    console.error('Error fetching calendar days:', error)
    throw error
  }
}
