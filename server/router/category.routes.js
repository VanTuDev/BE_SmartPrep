import { Router } from 'express';
import * as categoryController from '../controllers/CategoryController.js';
import Auth from '../middleware/auth.js';

const router = Router();

router.post('/create', Auth, categoryController.createCategory); // Đảm bảo đã sử dụng middleware Auth
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getQuestionsByCategoryId);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
