import Garage from '../models/garage.js';

const viewGarageRegistrations = async (req, res) => {
  try {
    const garages = await Garage.find({ status: 'pending' }).populate('user', 'email name phone');
    res.status(200).json(garages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { viewGarageRegistrations };