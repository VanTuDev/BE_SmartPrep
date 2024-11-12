import { Router } from 'express';
const router = Router();
import * as aiController from '../services/ChatCompletion.js';

router.post('/ask_question', aiController.askQuestion);

export default router;