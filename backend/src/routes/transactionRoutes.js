import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { transactionSchema } from '../validations/transactionValidation.js';
import { create, list, remove, update } from '../controllers/transactionController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', list);
router.post('/', validate(transactionSchema), create);
router.put('/:id', validate(transactionSchema), update);
router.delete('/:id', remove);

export default router;
