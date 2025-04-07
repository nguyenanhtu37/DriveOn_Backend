import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính Trái Đất (km)
  const toRad = (angle) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Khoảng cách (km)
};

// get coordinates theo distanmatrix.ai
export const getDrivingDistance = async (origin, destination) => {
  try {
    const apiKey = process.env.DISTANCEMATRIX_API_KEY;
    const url = `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    const response = await axios.get(url);

    if (response.data.status === "OK") {
      const distance = response.data.rows[0].elements[0].distance.value; // kcach tính theo met
      return distance / 1000; // convert sang km
    } else {
      console.error("Error from DistanceMatrix.ai:", response.data.error_message);
      return null;
    }
  } catch (error) {
    console.error("Error calling DistanceMatrix.ai API:", error.message);
    return null;
  }
};

export const getDistancesToGarages = async (userLocation, garageList) => {
  const distancePromises = garageList.map((garage) =>
    getDrivingDistance(userLocation, garage.address)
  );

  const distances = await Promise.all(distancePromises);

  // Ghép lại để biết garage nào cách bao xa
  return garageList.map((garage, idx) => ({
    ...garage,
    distance: distances[idx],
  }));
};

export const getCoordinates = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const response = await axios.get(url, { headers: { "User-Agent": "DriveOn-App" } });

    if (response.data.length === 0) return null;
    return { lat: parseFloat(response.data[0].lat), lon: parseFloat(response.data[0].lon) };
  } catch {
    console.error("Error getting coordinates:", error);
    return null;
  }
};