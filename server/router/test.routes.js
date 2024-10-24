import { Router } from 'express';
import Auth from '../middleware/auth.js';
import { uploadExcel } from '../middleware/upload.js';
import * as testController from '../controllers/TestController.js';

const router = Router();

// Tạo bài kiểm tra với các câu hỏi đã chọn
router.post(
   '/create',
   Auth,
   testController.verifyInstructorRole,
   testController.createTest
);

// Upload câu hỏi từ Excel vào bài kiểm tra
router.post(
   '/:testId/upload-excel',
   Auth,
   testController.verifyInstructorRole,
   uploadExcel.single('file'),
   testController.uploadQuestionsExcel
);

// Lấy câu hỏi random dựa trên tiêu chí và thêm vào bài kiểm tra
router.post(
   '/:testId/random-questions',
   Auth,
   testController.verifyInstructorRole,
   testController.getRandomQuestions
);

// Thêm từng câu hỏi thủ công vào bài kiểm tra
router.post(
   '/:testId/add-single-question',
   Auth,
   testController.verifyInstructorRole,
   testController.addSingleQuestion
);

// Lấy bài kiểm tra theo ID
router.get('/:id', testController.getTestById);

// Cập nhật bài kiểm tra theo ID
router.put(
   '/:examId',
   Auth,
   testController.verifyInstructorRole,
   testController.updateTest
);

// Xóa bài kiểm tra theo ID
router.delete(
   '/:id',
   Auth,
   testController.verifyInstructorRole,
   testController.deleteTest
);

// Lấy tất cả các bài kiểm tra
router.get('/get_all', testController.getAllTests);

// Lấy tất cả bài làm cho một bài kiểm tra cụ thể
router.get('/submissions/:test_id', testController.getSubmissionsByTestId);

router.get('/:id', testController.updateTestStatus, testController.getTestById);

router.put(
   '/:testId/publish',
   Auth,
   testController.verifyInstructorRole,
   async (req, res) => {
      try {
         const { testId } = req.params;

         const test = await TestModel.findByIdAndUpdate(
            testId,
            { status: 'published' },
            { new: true }
         );

         if (!test) {
            return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra!' });
         }

         res.status(200).json({ msg: 'Bài kiểm tra đã được publish!', test });
      } catch (error) {
         console.error('Lỗi khi publish bài kiểm tra:', error);
         res.status(500).json({ error: 'Không thể publish bài kiểm tra!' });
      }
   }
);
export default router;
