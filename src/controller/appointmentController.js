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
export const getAppointmentsByVehicle = async (req, res) => {
  const { vehicleId } = req.params;
  const userId = req.user.id; // Get userId from token

  try {
    const appointments =
      await appointmentService.getAppointmentsByVehicleService(
        vehicleId,
        userId
      );
    res.status(200).json(appointments);
  } catch (err) {
    if (err.message === "Vehicle not found") {
      return res.status(404).json({ message: "Vehicle not found" });
    }
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
  const { updatedEndTime, nextMaintenance } = req.body;

  try {
    const appointment = await appointmentService.completeAppointmentService(
      appointmentId,
      userId,
      updatedEndTime,
      nextMaintenance
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json({
      message: "Appointment completed successfully",
      appointment,
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

export const updateAppointmentByStaff = async (req, res) => {
  const { appointmentId } = req.params;
  const staffId = req.user.id;

  try {
    const updatedAppointment =
      await appointmentService.updateAppointmentByStaffService(
        appointmentId,
        staffId,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// export const getNextMaintenanceList = async (req, res) => {
//   const { garageId } = req.params;
//   const page = parseInt(req.query.page) || 1; // Mặc định là trang 1
//   const limit = parseInt(req.query.limit) || 10; // Mặc định là 10 phần tử mỗi trang

//   try {
//     const result = await appointmentService.getNextMaintenanceListService(
//       garageId,
//       page,
//       limit
//     );

//     res.status(200).json({
//       message: "Next maintenance list retrieved successfully",
//       ...result,
//     });
//   } catch (err) {
//     if (err.message === "This feature is only available for garages with the 'pro' tag") {
//       return res.status(403).json({ error: err.message });
//     }
//     res.status(500).json({ error: err.message });
//   }
// };

export const getNextMaintenanceList = async (req, res) => {
  const { garageId } = req.params;
  const page = parseInt(req.query.page) || 1; // Mặc định là trang 1
  const limit = parseInt(req.query.limit) || 100; // Mặc định là 100 phần tử mỗi trang
  const maxDaysLeft = req.query.maxDaysLeft
    ? parseInt(req.query.maxDaysLeft)
    : null; // Lọc theo daysLeft nếu có

  try {
    const result = await appointmentService.getNextMaintenanceListService(
      garageId,
      page,
      limit,
      maxDaysLeft
    );

    res.status(200).json({
      message: "Next maintenance list retrieved successfully",
      ...result,
    });
  } catch (err) {
    if (
      err.message ===
      "This feature is only available for garages with the 'pro' tag"
    ) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

export const createAppointmentByStaff = async (req, res) => {
  const { garage, service, vehicle, start, userId } = req.body;
  const staffId = req.user.id; // ID của staff hoặc manager thực hiện tạo lịch hẹn

  try {
    console.log("Creating appointment for car owner:", userId); // Log để kiểm tra
    const appointment =
      await appointmentService.createAppointmentByStaffService({
        garage,
        service,
        vehicle,
        start,
        userId,
        staffId,
      });

    res.status(201).json({
      message: "Appointment created successfully by staff",
      appointment,
    });
  } catch (err) {
    console.error("Error creating appointment:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const isCalledAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { isUserAgreed } = req.body;
  try {
    await appointmentService.isCalledAppointmentService(
      appointmentId,
      isUserAgreed
    );
    res
      .status(200)
      .json({ message: "Appointment status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAppointmentPercents = async (req, res) => {
  try {
    const appointmentPercents =
      await appointmentService.getAppointmentPercentsService();
    res.status(200).json(appointmentPercents);
  } catch (err) {
    console.error("Error in getAppointmentPercents:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const countPendingAppointmentsInHour = async (req, res) => {
  const { garageId } = req.params;
  const { date } = req.query; // ISO string or date string
  if (!date) {
    return res.status(400).json({ error: "Missing date query parameter" });
  }
  try {
    const count = await appointmentService.countPendingAppointmentsInHour(garageId, date);
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const setHourlyAppointmentLimit = async (req, res) => {
  const { garageId } = req.params;
  const userId = req.user.id;
  const { limit } = req.body;

  try {
    const garage = await appointmentService.setHourlyAppointmentLimitService(garageId, userId, limit);
    res.status(200).json({
      message: "Hourly appointment limit updated successfully",
      hourlyAppointmentLimit: garage.hourlyAppointmentLimit
    });
  } catch (err) {
    if (err.message.includes("Unauthorized")) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes("Invalid limit")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

export const getHourlyAppointmentLimit = async (req, res) => {
  const { garageId } = req.params;

  try {
    const result = await appointmentService.getHourlyAppointmentLimitService(garageId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
