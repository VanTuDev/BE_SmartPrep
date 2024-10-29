import mongoose from 'mongoose';
import GradeModel from '../model/Grade.model.js';

// Kiểm tra quyền của giáo viên (Instructor)
export function verifyInstructorRole(req, res, next) {
   if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ error: "Chỉ có giáo viên mới có quyền này!" });
   }
   next(); // Tiếp tục xử lý yêu cầu
}

// Tạo khối mới
export async function createGrade(req, res) {
   try {
      const { name, description } = req.body;

      const newGrade = new GradeModel({
         name,
         description,
         instructor: req.user.userId // Liên kết khối với giáo viên
      });

      await newGrade.save();
      res.status(201).json({ msg: "Khối học đã được tạo!", grade: newGrade });
   } catch (error) {
      console.error('Lỗi khi tạo khối học:', error);
      res.status(500).json({ error: "Lỗi khi tạo khối học!" });
   }
}

// Lấy tất cả các khối của giáo viên hiện tại
export async function getAllGrades(req, res) {
   try {
      const grades = await GradeModel.find({ instructor: req.user.userId })
         .populate('categories_id', 'name')
         .lean(); // Tối ưu hóa truy vấn

      res.status(200).json(grades);
   } catch (error) {
      console.error('Lỗi khi lấy danh sách khối:', error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách khối!" });
   }
}

// Lấy khối theo ID
export async function getGradeById(req, res) {
   try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({ error: "ID không hợp lệ!" });
      }

      const grade = await GradeModel.findOne({ _id: id, instructor: req.user.userId })
         .populate('categories_id', 'name description')
         .lean();

      if (!grade) {
         return res.status(404).json({ error: "Không tìm thấy khối!" });
      }

      res.status(200).json(grade);
   } catch (error) {
      console.error('Lỗi khi lấy khối:', error);
      res.status(500).json({ error: "Lỗi khi lấy khối!" });
   }
}

// Cập nhật khối học
export async function updateGrade(req, res) {
   try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({ error: "ID không hợp lệ!" });
      }

      const updatedGrade = await GradeModel.findOneAndUpdate(
         { _id: id, instructor: req.user.userId }, // Chỉ cho phép cập nhật khối của chính giáo viên
         { name, description },
         { new: true }
      );

      if (!updatedGrade) {
         return res.status(404).json({ error: "Không tìm thấy khối để cập nhật!" });
      }

      res.status(200).json({ msg: "Cập nhật khối thành công!", grade: updatedGrade });
   } catch (error) {
      console.error('Lỗi khi cập nhật khối:', error);
      res.status(500).json({ error: "Lỗi khi cập nhật khối!" });
   }
}

// Xóa khối học
export async function deleteGrade(req, res) {
   try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({ error: "ID không hợp lệ!" });
      }

      const deletedGrade = await GradeModel.findOneAndDelete({
         _id: id,
         instructor: req.user.userId, // Chỉ cho phép xóa khối của chính giáo viên
      });

      if (!deletedGrade) {
         return res.status(404).json({ error: "Không tìm thấy khối để xóa!" });
      }

      res.status(200).json({ msg: "Xóa khối thành công!" });
   } catch (error) {
      console.error('Lỗi khi xóa khối:', error);
      res.status(500).json({ error: "Lỗi khi xóa khối!" });
   }
}
