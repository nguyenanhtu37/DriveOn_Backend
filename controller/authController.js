import * as authService from '../service/authService.js';

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
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
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
    const result = await authService.resetPassword(req.query.token, req.body.newPassword);
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

const changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    console.log(req.body);
    const result = await authService.googleLogin(req.body.token);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

 const viewPersonalProfile = async (req, res) => {
  try {
    console.log(req.user);
    const result = await authService.viewPersonalProfile(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  };
};

export { signup, verifyEmail, login, requestPasswordReset, resetPassword, logout, changePassword, googleLogin, viewPersonalProfile };