// question.routes.js

import { Router } from 'express';
import * as questionController from '../controllers/QuestionController.js';
import Auth from '../middleware/auth.js'; // Authentication middleware
import multer from 'multer';

// Configure multer to handle in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// Create multiple questions route
router.post(
   '/create/multiple',
   Auth,
   questionController.verifyInstructorRole,
   questionController.createMultipleQuestions
);

// Update a specific question by ID
router.put(
   '/:id',
   Auth,
   questionController.verifyInstructorRole,
   questionController.updateQuestion
);

// Delete a specific question by ID
router.delete(
   '/:id',
   Auth,
   questionController.verifyInstructorRole,
   questionController.deleteQuestion
);

// Upload questions from Excel
router.post(
   '/upload-excel',
   Auth,
   upload.single('file'),
   questionController.addQuestionsFromExcel
);

// Get all questions (with instructor permissions)
router.get(
   '/',
   Auth,
   questionController.getAllQuestions
);

// Get a specific question by ID
router.get(
   '/:id',
   Auth,
   questionController.getQuestionById
);

// Get questions by category (subject)
router.get(
   '/category/:categoryId',
   Auth,
   questionController.getQuestionsByCategory
);

// Get questions by grade (level)
router.get(
   '/grade/:gradeId',
   Auth,
   questionController.getQuestionsByGrade
);

// Get questions by group (chapter)
router.get(
   '/group/:groupId',
   Auth,
   questionController.getQuestionsByGroup
);

// Get questions by classroom
router.get(
   '/classroom/:classRoomId',
   Auth,
   questionController.getQuestionsByClassRoom
);

// Get questions by test ID
router.get(
   '/test/:testId',
   Auth,
   questionController.getQuestionsByTest
);

export default router;
