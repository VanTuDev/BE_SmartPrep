import mongoose from 'mongoose';
import ClassRoomModel from '../model/ClassRoom.model.js';
import UserModel from '../model/User.model.js';
import SubmissionModel from '../model/Submission.model.js';
import logger from '../utils/logger.js';

// Middleware kiểm tra quyền Admin
export function verifyAdminRole(req, res, next) {
    try {
       const { role } = req.user;
       logger.info(`Xác thực quyền Admin cho người dùng: ${role}`);
       if (role !== 'admin') {
          logger.warn(`Người dùng không có quyền Admin. Role: ${role}`);
          return res.status(403).json({ error: 'Chỉ có Admin mới có quyền này!' });
       }
       next();
    } catch (error) {
       logger.error('Lỗi khi xác thực quyền Admin:', error);
       res.status(500).json({ error: 'Lỗi khi xác thực quyền Admin!' });
    }
 }

export async function getSortedClasses(req, res) {
  try {
    const classes = await ClassRoomModel.find()
      .populate('instructor', 'fullname') // Populate only the instructor name
      .populate('learners')
      .populate('tests_id') // Populate tests_id references
      .lean();

    const classData = classes
      .map(classItem => ({
        className: classItem.name,
        teacher: classItem.instructor?.fullname || 'Unknown',
        learners: classItem.learners ? classItem.learners.length : 0,
        exams: classItem.tests_id ? classItem.tests_id.length : 0,
      }))
      .sort((a, b) => b.exams - a.exams);

    res.status(200).json(classData);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes', details: error.message });
  }
 } 
