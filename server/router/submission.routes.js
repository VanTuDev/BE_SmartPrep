import { Router } from 'express';
import Auth from '../middleware/auth.js';
import * as submissionController from '../controllers/SumissionController.js';

const router = Router();

router.post('/start', Auth, submissionController.startTest);
router.put('/submit-answer', Auth, submissionController.submitAnswer);
router.put('/finish/:submissionId', Auth, submissionController.finishTest);
router.get('/:submissionId', Auth, submissionController.getSubmissionById);
router.get('/user/:userId', Auth, submissionController.getAllSubmissionsByUser);

export default router;
