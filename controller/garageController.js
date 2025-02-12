import { z } from "zod";
import { garageRegisterSchemaValidation } from "../schemas/garageSchemaValidation.js";
import {
  registerGarage,
  getGarages,
  getGarageById,
  rejectGarageRegistration,
  approveGarageRegistration,
} from "../service/garageServices.js";

export const registerGarageController = async (req, res) => {
  try {
    // Validate request body
    const validatedData = garageRegisterSchemaValidation.parse(req.body);

    const newGarage = await registerGarage(validatedData, req.user.id);

    res.status(201).json({
      message: "Garage registration submitted successfully",
      garage: newGarage,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    res.status(500).json({ error: err.message });
  }
};

export const getGaragesController = async (req, res) => {
  try {
    const garages = await getGarages();
    res.status(200).json(garages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getGarageByIdController = async (req, res) => {
  const { id } = req.params;
  try {
    const garage = await getGarageById(id);
    res.status(200).json(garage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveGarageRegistrationController = async (req, res) => {
  const { id } = req.params;
  try {
    const garage = await approveGarageRegistration(id);
    res.status(200).json(garage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rejectGarageRegistrationController = async (req, res) => {
  const { id } = req.params;
  try {
    const garage = await rejectGarageRegistration(id);
    res.status(200).json(garage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
