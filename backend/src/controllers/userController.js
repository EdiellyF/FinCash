import { ok } from '../utils/response.js';
import { getMe, updateMe, deleteAccount } from '../services/userService.js';

export async function me(req, res) {
  const result = await getMe(req.user.id);
  return ok(res, result);
}

export async function updateProfile(req, res) {
  const result = await updateMe(req.user.id, req.body);
  return ok(res, result, 'Perfil atualizado com sucesso.');
}

export async function deleteProfile(req, res) {
  const { currentPassword } = req.body || {};
  if (!currentPassword) {
    return res.status(400).json({ message: 'Senha atual é necessária para confirmar a exclusão.' });
  }

  await deleteAccount(req.user.id, currentPassword);

  // 204 No Content
  return res.status(204).send();
}
