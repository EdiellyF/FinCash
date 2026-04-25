import { ok } from '../utils/response.js';
import { getMe, updateMe } from '../services/userService.js';

export async function me(req, res) {
  const result = await getMe(req.user.id);
  return ok(res, result);
}

export async function updateProfile(req, res) {
  const result = await updateMe(req.user.id, req.body);
  return ok(res, result, 'Perfil atualizado com sucesso.');
}
