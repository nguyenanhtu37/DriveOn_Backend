import mongoose from 'mongoose';
import Garage from '../models/garage.js';
import * as garageService from '../service/garageService.js';

const registerGarage = async (req, res) => {
  const user = req.user;
  try {
    const newGarage = await garageService.registerGarage(user, req.body);
    res.status(200).json({
      message: "Garage registration submitted successfully",
      garage: newGarage,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

const viewGarages = async (req, res) => {
  try {
    const garages = await garageService.viewGarages(req.user.id);
    res.status(200).json(garages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGarageById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid garage id format" });
  }
  try {
    const garage = await garageService.getGarageById(id);
    res.status(200).json(garage);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

const updateGarage = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedGarage = await garageService.updateGarage(req.user.id, id, req.body);
    res.status(200).json({ message: "Garage updated successfully", garage: updatedGarage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteGarage = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await garageService.deleteGarage(req.user.id, id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewGarageRegistrations = async (req, res) => {
  try {
    const garages = await garageService.viewGarageRegistrations();
    res.status(200).json(garages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGarageRegistrationById = async (req, res) => {
  const { id } = req.params;
  try {
    const garage = await garageService.getGarageRegistrationById(id);
    res.status(200).json(garage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const approveGarageRegistration = async (req, res) => {
  try {
    const garageId = req.params.id;
    const result = await garageService.approveGarageRegistration(garageId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const rejectGarageRegistration = async (req, res) => {
  try {
    const garageId = req.params.id;
    const result = await garageService.rejectGarageRegistration(garageId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addStaff = async (req, res) => {
  const { id } = req.params; // garage id
  try {
    const newStaff = await garageService.addStaff(req.user.id, id, req.body);
    res.status(201).json({
      message: "Staff added successfully",
      staff: newStaff,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewStaff = async (req, res) => {
  const { id } = req.params; // garage id
  try {
    const staffList = await garageService.viewStaff(req.user.id, id);
    res.status(200).json(staffList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const disableStaff = async (req, res) => {
  const { id } = req.params; // garage id
  const { staffId } = req.body;
  try {
    const updatedStaff = await garageService.disableStaff(req.user.id, id, staffId);
    res.status(200).json({
      message: "Staff disabled successfully",
      staff: updatedStaff,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const enableStaff = async (req, res) => {
  const { id } = req.params; // garage id
  const { staffId } = req.body;
  try {
    const updatedStaff = await garageService.enableStaff(req.user.id, id, staffId);
    res.status(200).json({
      message: "Staff enabled successfully",
      staff: updatedStaff,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStaffById = async (req, res) => {
  const { id, staffId } = req.params; // garage id and staff id
  try {
    const staff = await garageService.getStaffById(id, staffId);
    res.status(200).json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewGarageExisting = async (req, res) => {
  try {
    const garages = await garageService.viewGarageExisting();
    res.status(200).json(garages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// const enableGarage = async (req, res) => {
//   const { id } = req.params; // garage id
//   try {
//     const garage = await garageService.enableGarage(id);
//     res.status(200).json({
//       message: "Garage enabled successfully",
//       garage: garage,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
//
// const disableGarage = async (req, res) => {
//   const { id } = req.params; // garage id
//   try {
//     const garage = await garageService.disableGarage(id);
//     res.status(200).json({
//       message: "Garage disabled successfully",
//       garage: garage,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
const enableGarage = async (req, res) => {
  const { id } = req.params; // garage id
  try {
    const garage = await garageService.enableGarage(id);
    res.status(200).json({
      message: "Garage enabled successfully",
      garage: garage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const disableGarage = async (req, res) => {
  const { id } = req.params; // garage id
  try {
    const garage = await garageService.disableGarage(id);
    res.status(200).json({
      message: "Garage disabled successfully",
      garage: garage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const findGarages = async (req, res) => {
  let {address, openTime, closeTime, operating_days, rating, distance} = req.query;
  // console.log(req.query);

  try {
    const operatingDaysArray = operating_days ? operating_days.split(",") : [];
    // console.log("operatingDaysArray: ", operatingDaysArray);
    const garageList = await garageService.findGarages({address, openTime, closeTime, operatingDaysArray, rating, distance});
    res.status(200).json({
      message: "Success",
      garageList: garageList,
    });
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

// export const getCoordinates = async (req, res) => {
//   try {
//       const { address } = req.query;
//       if (!address) {
//           return res.status(400).json({ message: "Vui lòng nhập địa chỉ." });
//       }

//       const coordinates = await garageService.getCoordinatesFromAddress(address);
//       return res.status(200).json(coordinates);
//   } catch (error) {
//       return res.status(500).json({ message: error.message });
//   }
// };

// export const getGaragesWithinRadius = async (req, res) => {
//   try {
//       const { latitude, longitude, radius } = req.query;
//       if (!latitude || !longitude || !radius) {
//           return res.status(400).json({ message: "Thiếu thông tin tọa độ hoặc phạm vi tìm kiếm" });
//       }

//       // Lấy danh sách garage từ DB
//       const garages = await Garage.find();

//       // Lọc và sắp xếp garage
//       const sortedGarages = garageService.filterGaragesByDistance(parseFloat(latitude), parseFloat(longitude), garages, parseFloat(radius));

//       res.status(200).json(sortedGarages);
//   } catch (error) {
//       res.status(500).json({ message: error.message });
//   }
// };



export { registerGarage, viewGarages, updateGarage, deleteGarage, getGarageById, viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration, getGarageRegistrationById, addStaff, viewStaff, disableStaff, enableStaff, getStaffById, enableGarage, disableGarage, viewGarageExisting, findGarages };