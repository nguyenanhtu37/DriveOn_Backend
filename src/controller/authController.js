import * as authService from '../service/authService.js';

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const signup = async (req, res) => {
  try {
    const result = await authService.signup(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const result = await authService.verifyEmail(req.query.token);
    res.redirect(`${FRONTEND_URL}/login`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body.email, req.body.password, req.body.deviceToken);
    console.log("Response login: ", result);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const result = await authService.requestPasswordReset(req.body.email);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    console.log(req.body.password);
    console.log(req.body.token);
    const result = await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const result = await authService.logout(req.body.token);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    console.log(req.body);
    const result = await authService.googleLogin(req.body.token, req.body.deviceToken);
    console.log("Response login with Google: ", result);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { signup, verifyEmail, login, requestPasswordReset, resetPassword, logout, googleLogin };