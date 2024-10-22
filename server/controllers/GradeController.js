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
         instructor: req.user.userId
      });

      await newGrade.save();
      res.status(201).json({ msg: "Khối học đã được tạo!", grade: newGrade });
   } catch (error) {
      console.error('Lỗi khi tạo khối học:', error);
      res.status(500).json({ error: "Lỗi khi tạo khối học!" });
   }
}

// Lấy tất cả các khối
export async function getAllGrades(req, res) {
   try {
      const grades = await GradeModel.find().populate('categories_id', 'name'); // Lấy thông tin danh mục
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
      const grade = await GradeModel.findById(id).populate('categories_id', 'name description');

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

      const updatedGrade = await GradeModel.findByIdAndUpdate(
         id,
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

      const deletedGrade = await GradeModel.findByIdAndDelete(id);
      if (!deletedGrade) {
         return res.status(404).json({ error: "Không tìm thấy khối để xóa!" });
      }

      res.status(200).json({ msg: "Xóa khối thành công!" });
   } catch (error) {
      console.error('Lỗi khi xóa khối:', error);
      res.status(500).json({ error: "Lỗi khi xóa khối!" });
   }
}
