import Role from "../models/role.js";

const addRole = async (roleName) => {
  try {
    const newRole = new Role({ roleName });
    await newRole.save();
    return newRole;
  } catch (err) {
    throw new Error(err.message);
  }
};

export { addRole };
