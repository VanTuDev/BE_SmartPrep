import { Router } from 'express';
import multer from 'multer';
import InstructorApplication from '../model/InstructorApplication.model.js'
import UserModel from '../model/User.model.js';
import { uploadFiles } from '../middleware/uploadInstructor.js';
import Auth from '../middleware/auth.js';

import { sendEmailService } from '../services/EmailService.js';
const router = Router();
const upload = multer({ dest: 'uploads/' });

// Create Instructor application
router.post('/applications',Auth, uploadFiles.fields([
    { name: 'cv', maxCount: 1 }, // Single PDF file for CV
    { name: 'citizenIdPhotos', maxCount: 2 } // Array of 2 photos for citizen ID front and back
]), async (req, res) => {
    try {
        console.log('Received files:', req.files);

        if (req.files) {
            const totalSize = Object.values(req.files).reduce((acc, files) => {
                return acc + files.reduce((sum, file) => sum + file.size, 0);
            }, 0);

            console.log('Total request size:', totalSize);
            if (totalSize > 50 * 1024 * 1024) { // 50MB
                return res.status(400).send({ error: 'Total request size exceeds 50MB' });
            }
        }
        const userId = req.user ? req.user.userId : null;  // Check if req.user exists first
        console.log(req.user.userId);
        if (!userId) {
            return res.status(400).json({ message: 'User not authenticated' });
        }

        const { specialization, bio } = req.body;

        // Extract file paths from multer
        const cvFilePath = req.files.cv[0].path;
        const citizenIdPhotos = req.files.citizenIdPhotos.map(file => file.path);

        // Save new application in the database
        const newApplication = new InstructorApplication({
            teacher: userId, // Assuming the teacher is logged in and the ID is available in req.user
            specialization,
            cv: cvFilePath,
            citizenIdPhotos,
            bio
        });

        await newApplication.save();

        res.status(201).json({ message: 'Application submitted successfully!', application: newApplication });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while submitting the application.' });
    }
});

// Get all instructors application
router.get('/applications', Auth, async (req, res) => {
    try {
        // Retrieve all applications from the database
        const applications = await InstructorApplication.find().populate('teacher'); // Populating the teacher details

        // Check if applications are found
        if (!applications || applications.length === 0) {
            return res.status(404).json({ message: 'No applications found' });
        }

        // Return the applications
        res.status(200).json({ applications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while retrieving the applications.' });
    }
});

// Get application details by ID
router.get('/:id',Auth, async (req, res) => {
    try {
        const applicationId = req.params.id;
        const application = await InstructorApplication.findById(applicationId).populate('teacher'); // Assuming 'teacher' is a reference

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.status(200).json(application);
    } catch (error) {
        console.error("Error fetching application details:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route cho admin để approve/reject đơn ứng tuyển
router.put('/applications/:id/review', Auth, async (req, res) => {
    try {
        const applicationId = req.params.id;
        const { status } = req.body;

        // Kiểm tra trạng thái có hợp lệ không
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Tìm đơn ứng tuyển theo ID
        const application = await InstructorApplication.findById(applicationId).populate('teacher');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const userId = application.teacher._id;
        const userEmail = application.teacher.email;

        // Nếu là approved, cập nhật is_locked của user thành false
        if (status === 'approved') {
            await UserModel.findByIdAndUpdate(userId, { is_locked: false });
            application.applicationStatus = 'approved';

            await sendEmailService(userEmail, 'approved');
        }

        // Nếu là rejected, chỉ cập nhật applicationStatus
        if (status === 'rejected') {
            application.applicationStatus = 'rejected';

            await sendEmailService(userEmail, 'rejected');
        }

        // Cập nhật ngày duyệt đơn (reviewDate)
        application.reviewDate = Date.now();

        // Lưu thay đổi
        await application.save();

        res.status(200).json({ message: `Application ${status} successfully!`, application });
    } catch (error) {
        console.error("Error updating application status:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete application
router.delete('/applications/:id', Auth, async (req, res) => {
    try {
        const applicationId = req.params.id;

        // Tìm và xóa đơn ứng tuyển theo ID
        const deletedApplication = await InstructorApplication.findByIdAndDelete(applicationId);

        if (!deletedApplication) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.status(200).json({ message: 'Application deleted successfully!' });
    } catch (error) {
        console.error("Error deleting application:", error);
        res.status(500).json({ message: 'Server error' });
    }
});


export default router;