import * as emergencyService from "../service/emergencyService.js";

export const createEmergency = async (req, res) => {
  const { sessionId, description, images, location, address } = req.body;
  try {
    const newEmergency = await emergencyService.createEmergency(
      sessionId,
      description,
      images,
      location,
      address
    );

    res.status(201).json({
      message: "Emergency created successfully",
      emergency: newEmergency,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEmergencies = async (req, res) => {
  try {
    const emergencyList = await emergencyService.getEmergencies();
    if (!emergencyList || emergencyList.length === 0) {
      return res.status(404).json({ message: "No emergencies found!" });
    }
    res.status(200).json({
      message: "Emergency list",
      data: emergencyList,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEmergencyById = async (req, res) => {
  const { emergencyId } = req.params;
  try {
    const emergency = await emergencyService.getEmergencyById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found!" });
    }
    res.status(200).json({
      message: "Emergency details",
      data: emergency,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEmergency = async (req, res) => {
  const { emergencyId } = req.params;
  const { garage, isAccepted, description, images, location } = req.body;
  try {
    const updatedEmergency = await emergencyService.updateEmergency(
      emergencyId,
      garage,
      isAccepted,
      description,
      images,
      location
    );

    if (!updatedEmergency) {
      return res.status(404).json({ message: "Emergency not found!" });
    }

    res.status(200).json({
      message: "Emergency updated successfully!",
      emergency: updatedEmergency,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteEmergency = async (req, res) => {
  const { emergencyId } = req.params;
  try {
    const result = await emergencyService.deleteEmergency(emergencyId);
    if (!result) {
      return res.status(404).json({ message: "Emergency not found!" });
    }
    res.status(200).json({ message: "Emergency deleted successfully!" });
  } catch (err) {
    res.status(500).json({
      message: "Delete emergency failed!",
      error: err.message,
    });
  }
};

export const requestEmergencyHelp = async (req, res) => {
  const { emergencyId } = req.body;
  try {
    const result = await emergencyService.requestEmergencyToGarage(emergencyId);
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (err) {
    res.status(500).json({
      message: "Emergency request failed!",
      error: err.message,
    });
  }
};

export const acceptEmergency = async (req, res) => {
  const { emergencyId, garageId } = req.body;
  try {
    const result = await emergencyService.acceptEmergency(
      emergencyId,
      garageId
    );
    if (!result) {
      return res.status(404).json({ message: "Emergency not found!" });
    }
    res.status(200).json({
      message: "Emergency accepted successfully!",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
