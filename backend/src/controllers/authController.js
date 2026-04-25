import { created, ok } from '../utils/response.js';
import { forgotPassword, loginUser, registerUser, resetPassword } from '../services/authService.js';

export async function register(req, res) {
  const result = await registerUser(req.validatedData);
  return created(res, result, 'Cadastro realizado com sucesso.');
}

export async function login(req, res) {
  const result = await loginUser(req.validatedData);
  return ok(res, result, 'Login realizado com sucesso.');
}

export async function logout(req, res) {
  return ok(res, null, 'Logout realizado com sucesso.');
}

export async function forgotPasswordController(req, res) {
  const result = await forgotPassword(req.validatedData.email);
  return ok(res, result, 'Solicitação de recuperação processada.');
}

export async function resetPasswordController(req, res) {
  const result = await resetPassword(req.validatedData.email, req.validatedData.newPassword);
  return ok(res, result, 'Senha redefinida com sucesso.');
}
