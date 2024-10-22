import { Router } from 'express';
import {
   createCategory,
   getAllCategories,
   getQuestionsByCategoryId,
   updateCategory,
   deleteCategory,
   getCategoryById,
   getAllCategoriesByGrade
} from '../controllers/CategoryController.js';
import Auth from '../middleware/auth.js';
import verifyInstructor from '../middleware/instructorAuth.js';

const router = Router();

// Route mới để lấy danh mục theo khối
router.get('/getCategoryByGrade', Auth, verifyInstructor, getAllCategoriesByGrade);

router.post('/create', Auth, verifyInstructor, createCategory); // Tạo danh mục
router.get('/', Auth, verifyInstructor, getAllCategories); // Lấy tất cả danh mục

router.get('/:id/questions', Auth, getQuestionsByCategoryId); // Lấy câu hỏi theo danh mục
router.get('/:id', getCategoryById); // Lấy danh mục theo ID
router.put('/:id', Auth, verifyInstructor, updateCategory); // Cập nhật danh mục
router.delete('/:id', Auth, verifyInstructor, deleteCategory); // Xóa danh mục

export default router;
