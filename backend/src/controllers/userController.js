import { ok } from '../utils/response.js';
import { getMe, updateMe, deleteAccount } from '../services/userService.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/errors.js';

export async function me(req, res) {
  const result = await getMe(req.user.id);
  return ok(res, result);
}

export async function updateProfile(req, res) {
  const result = await updateMe(req.user.id, req.body);
  return ok(res, result, 'Perfil atualizado com sucesso.');
}

export async function deleteProfile(req, res) {
  try {
    const { currentPassword } = req.body || {};
    if (!currentPassword) {
      return res.status(400).json({ message: 'Senha atual é necessária para confirmar a exclusão.' });
    }

    await deleteAccount(req.user.id, currentPassword);

    // 204 No Content
    return res.status(204).send();
  } catch (err) {
    // Log detailed error server-side for debugging
    logger.error('Error deleting account', { message: err.message, stack: err.stack, userId: req.user?.id, path: req.path });

    // If it's an application-level error, forward its status/message
    if (err && err.isOperational && err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    // Generic 500 without leaking internals
    return res.status(500).json({ message: 'Erro interno ao excluir conta. Verifique os logs e entre em contato com o suporte.' });
  }
}
