// user.routes.js
import { Router } from 'express';
const router = Router();
import * as userController from '../controllers/UserController.js';
import * as testController from '../controllers/TestController.js';
import * as questionController from '../controllers/QuestionController.js';
import * as adminController from '../controllers/AdminController.js'
import Auth from '../middleware/auth.js';

// ADMIN ROUTER
// Get all exam
router.get('/get_all_exam_admin',Auth, testController.getAllTestsByAdmin);

// Get all class
router.get('/get_all_question_admin', Auth, questionController.getAllQuestionsByAdmin);

router.get('/get_sorted_classes', Auth, adminController.verifyAdminRole, adminController.getSortedClasses);

router.post('/add_admin_account', Auth, adminController.verifyAdminRole, adminController.addNewAdmin)

router.put('/deactive_account/:id', Auth, adminController.verifyAdminRole, adminController.deactivateInstructor)

export default router;