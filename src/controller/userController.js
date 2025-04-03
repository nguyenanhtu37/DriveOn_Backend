import * as userService from '../service/userService.js';

const changePassword = async (req, res) => {
    try {
        const result = await userService.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const viewPersonalProfile = async (req, res) => {
    try {
        console.log(req.user);
        const result = await userService.viewPersonalProfile(req.user.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    };
};

const updatePersonalProfile = async (req, res) => {
    try {
        const result = await userService.updatePersonalProfile(req.user.id, req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    };
};

// const viewUsersByRoles = async (req, res) => {
//     try {
//       const roles = req.query.roles ? req.query.roles.split(",") : []; // Lấy danh sách roles từ query
//       const result = await userService.getUsersByRoles(roles);
//       res.status(200).json(result);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   };

// const viewUsersByRoles = async (req, res) => {
//     try {
//       const roles = req.query.roles ? req.query.roles.split(",") : [];
//       console.log("Roles from query:", roles); // Log danh sách vai trò từ query
  
//       const result = await userService.getUsersByRoles(roles);
//       res.status(200).json(result);
//     } catch (err) {
//       console.error("Error in viewUsersByRoles:", err.message);
//       res.status(500).json({ error: err.message });
//     }
//   };

export { changePassword, viewPersonalProfile, updatePersonalProfile };