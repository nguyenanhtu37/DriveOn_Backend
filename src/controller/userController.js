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


const viewAllUsers = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; // Mặc định là trang 1
      const limit = parseInt(req.query.limit) || 10; // Mặc định là 10 tài khoản mỗi trang
  
      const result = await userService.getAllUsers(page, limit);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};

const viewUserDetails = async (req, res) => {
    try {
      const userId = req.params.id; // Lấy userId 
      const user = await userService.getUserById(userId);
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};

// const updateUserStatus = async (req, res) => {
//     try {
//       const userId = req.params.id; // Lấy userId 
//       const { status } = req.body; // Lấy status từ body request
  
//       const result = await userService.updateUserStatus(userId, status);
//       res.status(200).json(result);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   };

const enableUserAccount = async (req, res) => {
    try {
      const userId = req.params.id; 
      const result = await userService.enableUser(userId);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  const disableUserAccount = async (req, res) => {
    try {
      const userId = req.params.id;
      const result = await userService.disableUser(userId);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

export { changePassword, viewPersonalProfile, updatePersonalProfile, viewAllUsers, viewUserDetails, enableUserAccount, disableUserAccount };