import InstructorApplicationModel from '../model/InstructorApplication.model.js';
import path from 'path';
import fs from 'fs';

// Hàm tạo đơn ứng tuyển mới
export const createInstructorApplication = async (req, res) => {
    const { teacher, specialization, cv, citizenIdPhotos, bio } = req.body;

    // Validate required fields
    if (!teacher || !specialization || !cv || !citizenIdPhotos.length || !bio) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin!' });
    }

    try {
        // Create a new instance of InstructorApplication
        const newApplication = new InstructorApplicationModel({
            teacher,
            specialization,
            cv,
            citizenIdPhotos,
            bio,
        });

        // Save the application to the database
        const savedApplication = await newApplication.save();

        // Respond with the saved application data
        return res.status(201).json({
            message: 'Đơn ứng tuyển đã được nộp thành công!',
            application: savedApplication,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Có lỗi xảy ra khi nộp hồ sơ!' });
    }
};