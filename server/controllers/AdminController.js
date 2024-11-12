import mongoose from 'mongoose';
import ClassRoomModel from '../model/ClassRoom.model.js';
import UserModel from '../model/User.model.js';
import bcrypt from "bcrypt";
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

 export async function addNewAdmin(req, res) {
  try {
    const { username, fullname, email, phone, password } = req.body;
    const cv = req.file ? req.file.filename : null;

    console.log('Đăng ký người dùng mới:', req.body);

    // Check if username or email already exists
    const existUser = await UserModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existUser) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc Email đã tồn tại!' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with `is_locked: true` for instructors
    const newUser = new UserModel({
      username,
      fullname,
      email,
      phone,
      password: hashedPassword,
      role: 'admin',
      cv: null, // Only store CV for instructors
      is_locked: false, // Lock instructor accounts
    });

    await newUser.save();

    res.status(201).json({ msg: 'Đăng ký thành công' });
  } catch (error) {
    console.error('Lỗi khi đăng ký người dùng:', error);
    res.status(500).json({ error: 'Lỗi khi đăng ký người dùng!' });
  }
}

export async function deactivateInstructor(req, res) {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      console.log("Người dùng không có quyền admin:", req.user);
      return res.status(403).json({ error: "Bạn không có quyền deactive người dùng!" });
    }

    const { id } = req.params;

    // Tìm người dùng theo ID và đảm bảo người đó là instructor
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại!" });
    }

    // if (user.role !== "instructor") {
    //   return res.status(400).json({ error: "Chỉ có thể deactive người dùng với role là instructor!" });
    // }

    // Cập nhật trạng thái is_active của người dùng thành false
    user.is_locked = true;
    await user.save();

    res.status(200).json({ msg: "Đã deactive người dùng thành công!" });
  } catch (error) {
    console.error("Lỗi khi deactive người dùng:", error);
    res.status(500).json({ error: "Lỗi khi deactive người dùng!" });
  }
}