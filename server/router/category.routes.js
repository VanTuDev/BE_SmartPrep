import { Router } from 'express';
import * as categoryController from '../controllers/CategoryController.js';
import Auth from '../middleware/auth.js';

const router = Router();

router.post('/create', Auth, categoryController.createCategory);
router.get('/', Auth, categoryController.getAllCategories);
router.get('/:id', categoryController.getQuestionsByCategoryId);
router.put('/:id', Auth, categoryController.updateCategory);
router.delete('/:id', Auth, categoryController.deleteCategory);

export default router;
