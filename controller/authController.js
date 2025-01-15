const authService = require('../service/authService');

const registerCarOwner = async (req, res) => {
    try {
        const user = await authService.registerCarOwner(req.body);
        res.status(201).json({ message: 'Car Owner registered successfully. Please verify your email.', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const registerGarageOwner = async (req, res) => {
    try {
        const user = await authService.registerGarageOwner(req.body);
        res.status(201).json({ message: 'Garage Owner registered successfully. Please verify your email.', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const registerGarageStaff = async (req, res) => {
    try {
        const user = await authService.registerGarageStaff(req.body, req.user.id);
        res.status(201).json({ message: 'Garage Staff registered successfully', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login(email, password);
        res.status(200).json({ message: 'Login successful', user, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const user = await authService.verifyEmail(req.query.token);
        res.status(200).json({ message: 'Email verified successfully', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { registerCarOwner, registerGarageOwner, registerGarageStaff, login, verifyEmail };