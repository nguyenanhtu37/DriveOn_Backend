import Garage from "../models/garage.js";

const registerGarage = async (req, res) => {
  const user = req.user;
  console.log("User information:", user);
  const { name, address, phone, description, workingHours, coinBalance } =
    req.body;
  try {
    // tao moi garage, default pending
    const newGarage = new Garage({
      name,
      address,
      phone,
      description,
      workingHours,
      coinBalance,
      user: [user.id],
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await newGarage.save();
    res.status(200).json({
      message: "Garage registration submitted successfully",
      garage: newGarage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { registerGarage };
