import Garage from '../models/garage.js';

const viewGarageRegistrations = async (req, res) => {
  try {
    const garages = await Garage.find({ status: 'pending' }).populate('user', 'email name phone');
    res.status(200).json(garages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const approveGarageRegistration = async (req, res) => {
  try {
    const garageId = req.params.id;
    const garage = await Garage.findById(garageId);
    if (!garage) {
      return res.status(404).json({ message: "Garage not found" });
    }

    garage.status = 'approved';
    await garage.save();

    res.status(200).json({ message: "Garage registration approved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const rejectGarageRegistration = async (req, res) => {
  try {
    const garageId = req.params.id;
    const garage = await Garage.findById(garageId);
    if (!garage) {
      return res.status(404).json({ message: "Garage not found" });
    }

    garage.status = 'rejected';
    await garage.save();

    res.status(200).json({ message: "Garage registration rejected successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration };