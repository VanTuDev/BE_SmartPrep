import { Router } from 'express';
import Auth from '../middleware/auth.js';
import { uploadExcel } from '../middleware/upload.js';
import * as testController from '../controllers/TestController.js';

const router = Router();

router.post(
   '/create',
   Auth,
   testController.verifyInstructorRole,
   uploadExcel.single('file'),
   testController.createTest
);

router.get('/:id', testController.getTestById);
router.put('/:examId', Auth, testController.verifyInstructorRole, testController.updateTest);
router.delete('/:id', Auth, testController.verifyInstructorRole, testController.deleteTest);
router.get('/get_all', testController.getAllTests);
router.get('/submissions/:test_id', testController.getSubmissionsByTestId);
export default router;
