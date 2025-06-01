import Emergency from "../models/emergency.js";
import { getIO, getReceiverSocketId } from "../libs/socket.js";
import mongoose from "mongoose";
import { sendSocketEvent } from "../libs/socketEvent.js";
import ServiceDetail from "../models/serviceDetail.js";

export const createEmergency = async (
  sessionId,
  description,
  images,
  location,
  address
) => {
  try {
    // Validate required inputs
    if (!sessionId) {
      return {
        success: false,
        message: "Session ID is required",
      };
    }

    // Create a GeoJSON point for location if provided
    let locationData = undefined;
    if (location && location.latitude && location.longitude) {
      locationData = {
        type: "Point",
        coordinates: [location.longitude, location.latitude],
      };
    }

    const newEmergency = new Emergency({
      sessionId,
      description,
      images: images || [],
      location: locationData,
      address: address,
    });

    await newEmergency.save();

    await notifyAvailableGarages(newEmergency, "newEmergency");

    return {
      success: true,
      data: newEmergency,
      message: "Emergency created successfully",
    };
  } catch (error) {
    console.error("Error creating emergency:", error);
    return {
      success: false,
      message: "Failed to create emergency",
      error: error.message,
    };
  }
};

export const getEmergencies = async () => {
  try {
    return await Emergency.find({
      isAccepted: false,
    })
      .sort({ createdAt: -1 })
      .populate("garage");
  } catch (error) {
    console.error("Error getting emergencies:", error);
    throw error;
  }
};

export const getEmergencyById = async (emergencyId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      throw new Error("Invalid emergency ID format");
    }
    return await Emergency.findById(emergencyId).populate("garage");
  } catch (error) {
    console.error(`Error getting emergency with ID ${emergencyId}:`, error);
    throw error;
  }
};

export const updateEmergency = async (
  emergencyId,
  garage,
  isAccepted,
  description,
  images,
  location
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      throw new Error("Invalid emergency ID format");
    }

    // Create a GeoJSON point for location if provided
    let locationData = undefined;
    if (location && location.latitude && location.longitude) {
      locationData = {
        type: "Point",
        coordinates: [location.longitude, location.latitude],
      };
    }

    const updatedEmergency = await Emergency.findByIdAndUpdate(
      emergencyId,
      {
        $set: {
          garage: garage,
          isAccepted: isAccepted,
          description: description,
          images: images,
          location: locationData,
        },
      },
      { new: true }
    );

    return updatedEmergency;
  } catch (error) {
    console.error(`Error updating emergency with ID ${emergencyId}:`, error);
    throw error;
  }
};

export const deleteEmergency = async (emergencyId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      throw new Error("Invalid emergency ID format");
    }

    const emergency = await Emergency.findById(emergencyId);
    await notifyAvailableGarages(emergency, "cancelRescue");

    const result = await Emergency.findByIdAndDelete(emergencyId);
    return result;
  } catch (error) {
    console.error(`Error deleting emergency with ID ${emergencyId}:`, error);
    throw error;
  }
};

export const requestEmergencyToGarage = async (emergencyId) => {
  try {
    // Get the Socket.IO instance
    const io = getIO();

    // Get all active socket rooms
    const sockets = await io.fetchSockets();

    // Extract garage IDs with active connections
    const activeGarageIds = new Set();

    for (const socket of sockets) {
      // Check socket rooms for garage IDs
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        // Skip the default room (which is the socket.id)
        if (room !== socket.id) {
          activeGarageIds.add(room);
        }
      });
    }

    // If no active garage found
    if (activeGarageIds.size === 0) {
      return {
        success: false,
        message: "No active garage found to send emergency request",
      };
    }

    const activeGarageIdsArray = [...activeGarageIds];

    // Find garages that have emergency service (with "cứu hộ" in the name)
    const garagesWithEmergencyService = await ServiceDetail.find({
      garage: { $in: activeGarageIdsArray },
      name: { $regex: /cứu hộ/i }, // case-insensitive search for "cứu hộ"
      isDeleted: false,
    }).distinct("garage");

    // Filter activeGarageIds to only include those with emergency service
    const filteredGarageIds = garagesWithEmergencyService.map((id) =>
      id.toString()
    );

    console.log(filteredGarageIds);

    if (filteredGarageIds.length === 0) {
      return {
        success: false,
        message: "No active garage with emergency service available",
      };
    }

    // Get emergency details if it exists
    let emergency = await Emergency.findById(emergencyId);

    filteredGarageIds.forEach((garageId) => {
      sendSocketEvent("newEmergency", emergency, garageId);
    });

    return {
      success: true,
      emergencyId: emergency._id,
      activeGarageCount: activeGarageIds.size,
      message: `Emergency request sent to ${activeGarageIds.size} active garage`,
    };
  } catch (error) {
    console.error("Error requesting emergency to garage:", error);
    return {
      success: false,
      message: error.message,
      error,
    };
  }
};

export const acceptEmergency = async (emergencyId, garageId) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(emergencyId) ||
      !mongoose.Types.ObjectId.isValid(garageId)
    ) {
      throw new Error("Invalid ID format");
    }

    // Update emergency to set the accepting garage and mark as accepted
    const emergency = await Emergency.findByIdAndUpdate(
      emergencyId,
      {
        $set: {
          garage: garageId,
          isAccepted: true,
        },
      },
      { new: true }
    ).populate("garage");

    // Notify the user that their emergency has been accepted
    const io = getIO();

    const userSocketId = getReceiverSocketId(emergency.sessionId);
    io.to(userSocketId).emit("acceptedRescue", emergency);
    await notifyAvailableGarages(emergency, "acceptedRescue");

    return emergency;
  } catch (error) {
    console.error(`Error accepting emergency with ID ${emergencyId}:`, error);
    throw error;
  }
};

async function getGaragesWithEmergencyService(garageIds) {
  try {
    const validGarageIds = garageIds.filter(
      (id) => id && mongoose.Types.ObjectId.isValid(id)
    );

    const garagesWithEmergencyService = await ServiceDetail.find({
      garage: { $in: validGarageIds },
      name: { $regex: /cứu hộ/i },
      isDeleted: false,
    }).distinct("garage");

    return garagesWithEmergencyService.map((id) => id.toString());
  } catch (error) {
    console.error("Error finding garages with emergency service:", error);
    return [];
  }
}

async function getActiveGarageIds(io) {
  const sockets = await io.fetchSockets();

  const activeGarageIds = new Set();

  for (const socket of sockets) {
    const rooms = Array.from(socket.rooms);
    rooms.forEach((room) => {
      if (room !== socket.id) {
        activeGarageIds.add(room);
      }
    });
  }

  return activeGarageIds;
}

async function notifyAvailableGarages(emergency, type) {
  const io = getIO();
  const activeGarageIds = await getActiveGarageIds(io);

  if (activeGarageIds.size === 0) {
    return {
      success: false,
      message: "No active garage found to send emergency request",
    };
  }

  const filteredGarageIds = await getGaragesWithEmergencyService([
    ...activeGarageIds,
  ]);

  if (filteredGarageIds.length === 0) {
    return {
      success: false,
      message: "No active garage with emergency service available",
    };
  }

  filteredGarageIds.forEach((garageId) => {
    sendSocketEvent(type, emergency, garageId);
  });

  return {
    success: true,
    notifiedGarages: filteredGarageIds.length,
  };
}
