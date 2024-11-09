import { Router } from 'express';
import multer from 'multer';


import * as applicationController from '../controllers/InstructorApplicationController.js';

import { uploadFiles } from '../middleware/uploadInstructor.js';
import Auth from '../middleware/auth.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Create Instructor application
router.post('/applications',Auth, uploadFiles.fields([
    { name: 'cv', maxCount: 1 }, // Single PDF file for CV
    { name: 'citizenIdPhotos', maxCount: 2 } // Array of 2 photos for citizen ID front and back
]),applicationController.createApplication );

// Get all instructors application
router.get('/applications', Auth, applicationController.verifyAdminRole, applicationController.getAllApplication);

// Get application details by ID
router.get('/:id',Auth, applicationController.verifyAdminRole, applicationController.getApplicationById);

// Route cho admin để approve/reject đơn ứng tuyển
router.put('/applications/:id/review', Auth, applicationController.verifyAdminRole, applicationController.approveApplication);

// Delete application
router.delete('/applications/:id', Auth, applicationController.verifyAdminRole, applicationController.deleteApplication);


export default router;