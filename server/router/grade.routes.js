// router/grade.routes.js
import express from 'express';
import Auth from '../middleware/auth.js'; // Import middleware xác thực
import {
   createGrade,
   getAllGrades,
   getGradeById,
   updateGrade,
   deleteGrade,
   verifyInstructorRole
} from '../controllers/GradeController.js';

const router = express.Router();

// Các routes cho Instructor quản lý khối học
router.post('/create', Auth, verifyInstructorRole, createGrade); // Tạo khối mới
router.get('/getAll', Auth,  getAllGrades); // Lấy tất cả khối
router.get('/get/:id', Auth,  getGradeById); // Lấy khối theo ID
router.put('/update/:id', Auth, verifyInstructorRole, updateGrade); // Cập nhật khối
router.delete('/delete/:id', Auth, verifyInstructorRole, deleteGrade); // Xóa khối

export default router;
