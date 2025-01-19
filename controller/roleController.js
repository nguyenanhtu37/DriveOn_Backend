import Role from '../models/role.js';

export const addRole = async (req, res) => {
  const { roleName } = req.body;

  try {
    const newRole = new Role({ roleName });
    await newRole.save();
    res.status(201).json({ message: "Role added successfully", role: newRole });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};