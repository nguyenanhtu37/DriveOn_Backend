import * as appointmentService from "../service/appointmentService.js";

export const createAppointment = async (req, res) => {
  const userId = req.user.id;
  // Extract from URL
  const { garage, start, note, service, vehicle } = req.body;

  try {
    // Create appointment
    const appointment = await appointmentService.createAppointmentService({
      garage,
      userId,
      service,
      vehicle,
      start,
      tag: "Normal", // Default tag value
      note: note || "", // Default note value if not provided
    });

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAppointmentsByUser = async (req, res) => {
  const userId = req.user.id; // Get userId from token
  try {
    const appointments = await appointmentService.getAppointmentsByUserService(
      userId
    );
    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getAppointmentById = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const appointment = await appointmentService.getAppointmentByIdService(
      appointmentId
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getAppointmentsByGarage = async (req, res) => {
  const { garageId } = req.params;
  try {
    const appointments =
      await appointmentService.getAppointmentsByGarageService(garageId);
    res.status(200).json(appointments);
  } catch (err) {
    if (err.message === "Garage not found") {
      return res.status(404).json({ message: "Garage not found" });
    }
    res.status(500).json({ error: err.message });
  }
};
export const confirmAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id;
  try {
    const appointment = await appointmentService.confirmAppointmentService(
      appointmentId,
      userId
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res
      .status(200)
      .json({ message: "Appointment confirmed successfully", appointment });
  } catch (err) {
    if (err.message === "Unauthorized") {
      return res.status(403).json({
        message: "You are not authorized to confirm this appointment",
      });
    }
    res.status(500).json({ error: err.message });
  }
};
export const denyAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id;
  try {
    const appointment = await appointmentService.denyAppointmentService(
      appointmentId,
      userId
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res
      .status(200)
      .json({ message: "Appointment denied successfully", appointment });
  } catch (err) {
    if (err.message === "Unauthorized") {
      return res
        .status(403)
        .json({ message: "You are not authorized to deny this appointment" });
    }
    res.status(500).json({ error: err.message });
  }
};
export const completeAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id;
  const { updatedEndTime } = req.body;

  try {
    const appointment = await appointmentService.completeAppointmentService(
        appointmentId,
        userId,
        updatedEndTime
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json({
      message: "Appointment completed successfully",
      appointment
    });

  } catch (err) {
    if (err.message === "Unauthorized") {
      return res.status(403).json({
        message: "You are not authorized to complete this appointment",
      });
    }
    res.status(500).json({ error: err.message });
  }
};
export const getAcceptedAppointments = async (req, res) => {
  const userId = req.user.id;
  const { garageId } = req.params;

  try {
    const appointments =
      await appointmentService.getAcceptedAppointmentsService(userId, garageId);
    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id;
  try {
    const appointment = await appointmentService.cancelAppointmentService(
      appointmentId,
      userId
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res
      .status(200)
      .json({ message: "Appointment cancelled successfully", appointment });
  } catch (err) {
    if (err.message === "Unauthorized") {
      return res
        .status(403)
        .json({ message: "You are not authorized to cancel this appointment" });
    }
    res.status(500).json({ error: err.message });
  }
};

export const updateAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id;
  const { service, start, note } = req.body;

  try {
    const appointment = await appointmentService.updateAppointmentService(
      appointmentId,
      userId,
      { service, start, note }
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res
      .status(200)
      .json({ message: "Appointment updated successfully", appointment });
  } catch (err) {
    if (err.message === "Unauthorized") {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this appointment" });
    }
    res.status(500).json({ error: err.message });
  }
};
