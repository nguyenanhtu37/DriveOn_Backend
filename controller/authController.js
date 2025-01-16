const authService = require('../service/authService');

const registerUser = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);
        res.status(201).json({ message: 'User registered successfully. Please verify your email.', user });
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

module.exports = { registerUser, login, verifyEmail };