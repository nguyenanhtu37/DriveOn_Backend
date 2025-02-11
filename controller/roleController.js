import * as roleService from '../service/roleService.js';

export const addRole = async (req, res) => {
  const { roleName } = req.body;

  try {
    const newRole = await roleService.addRole(roleName);
    res.status(201).json({ message: "Role added successfully", role: newRole });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};