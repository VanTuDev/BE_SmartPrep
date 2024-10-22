// classRoom.routes.js
import express from 'express';
import Auth from '../middleware/auth.js';
import { uploadExcel } from '../middleware/upload.js'; // Import đúng

import {
   createClassRoom,
   addMultipleLearners,
   addLearnersFromExcel,
   joinClassByCode,
   manageJoinRequest,
   kickLearner,
   getAllClassesByInstructor,
   getClassRoomDetails,
   updateClassRoom,
   deleteClassRoom,
   leaveClass
} from '../controllers/ClassRoomController.js';

const router = express.Router();

// ==================== Instructor Routes ==================== //

// Tạo lớp học mới (Instructor)
router.post('/instructor/create', Auth, createClassRoom);

// Thêm nhiều học sinh vào lớp qua email hoặc số điện thoại (Instructor)
router.post('/instructor/:classId/add-learners', Auth, addMultipleLearners);

// Thêm học sinh vào lớp từ file Excel (Instructor)
router.post(
   '/instructor/:classId/add-learners/excel',
   Auth,
   uploadExcel.single('file'), // Sử dụng middleware upload cho file Excel
   async (req, res) => {
      try {
         console.log('File nhận được:', req.file); // In thông tin file đã nhận
         console.log('Dữ liệu params:', req.params); // In thông tin params

         // Gọi hàm thêm học sinh từ Excel trong controller
         await addLearnersFromExcel(req, res);
      } catch (error) {
         console.error('Lỗi trong quá trình upload Excel:', error.message); // Log lỗi cụ thể
         res.status(500).json({ error: 'Lỗi khi thêm học sinh từ file Excel!', details: error.message });
      }
   }
);

// Duyệt hoặc từ chối yêu cầu tham gia lớp học (Instructor)
router.post('/instructor/:classId/manage-request/:learnerId', Auth, manageJoinRequest);

// Kick học sinh khỏi lớp học (Instructor)
router.delete('/instructor/:classId/kick/:learnerId', Auth, kickLearner);

// Lấy tất cả lớp học của giáo viên (Instructor)
router.get('/instructor/classes', Auth, getAllClassesByInstructor);

// Cập nhật thông tin lớp học (Instructor)
router.put('/instructor/update/:classId', Auth, updateClassRoom);

// Xóa lớp học (Instructor)
router.delete('/instructor/delete/:classId', Auth, deleteClassRoom);

// ==================== Learner (Student) Routes ==================== //

// Học sinh tham gia lớp học qua mã code
router.post('/learner/join', Auth, joinClassByCode);

// Học sinh rời khỏi lớp học
router.delete('/learner/:classId/leave', Auth, leaveClass);

// ==================== General Routes ==================== //

// Lấy chi tiết lớp học (Instructor và Learner đều có thể xem)
router.get('/details/:classId', Auth, getClassRoomDetails);

export default router;
