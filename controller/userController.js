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

export { changePassword, viewPersonalProfile };