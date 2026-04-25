import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { budgetSchema } from '../validations/budgetValidation.js';
import { create, list, remove, update } from '../controllers/budgetController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', list);
router.post('/', validate(budgetSchema), create);
router.put('/:id', validate(budgetSchema), update);
router.delete('/:id', remove);

export default router;
