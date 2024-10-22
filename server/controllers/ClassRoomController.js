import mongoose from 'mongoose';
import ClassRoomModel from '../model/ClassRoom.model.js';
import UserModel from '../model/User.model.js';
import fs from 'fs';
import XLSX from 'xlsx';

// Tạo lớp học
export async function createClassRoom(req, res) {
   try {
      const { name, description, grades_id } = req.body;
      const newClassRoom = new ClassRoomModel({
         name,
         description,
         instructor: req.user.userId,
         code: generateClassCode(),
         grades_id
      });
      await newClassRoom.save();
      res.status(201).json({ msg: "Lớp học đã được tạo!", classRoom: newClassRoom });
   } catch (error) {
      res.status(500).json({ error: "Lỗi khi tạo lớp học!" });
   }
}

// Hàm tạo mã code ngẫu nhiên cho lớp học
function generateClassCode() {
   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
   return Array.from({ length: 4 }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
   ).join('');
}

// Thêm học sinh bằng email hoặc số điện thoại
export async function addMultipleLearners(req, res) {
   try {
      const { classId } = req.params;
      const { emails, phones } = req.body;

      const classroom = await ClassRoomModel.findById(classId);
      if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

      const learnersToAdd = await UserModel.find({
         $or: [{ email: { $in: emails || [] } }, { phone: { $in: phones || [] } }]
      });

      const learnersIds = learnersToAdd.map(learner => learner._id.toString());
      classroom.learners = [...new Set([...classroom.learners, ...learnersIds])];

      await classroom.save();
      res.status(200).json({ msg: 'Thêm học sinh thành công!', addedLearners: learnersToAdd });
   } catch (error) {
      res.status(500).json({ error: 'Lỗi khi thêm học sinh vào lớp!' });
   }
}

// Xử lý file Excel và thêm học sinh vào lớp học
export async function addLearnersFromExcel(req, res) {
   try {
      const { classId } = req.params;
      const file = req.file;

      if (!file) return res.status(400).json({ error: "Không có file được tải lên!" });

      console.log('Tên tệp:', file.originalname);
      console.log('MIME type:', file.mimetype);

      // Đọc dữ liệu từ file Excel
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      console.log('Dữ liệu từ file Excel:', data);

      // Chuyển đổi classId thành ObjectId nếu hợp lệ
      if (!mongoose.Types.ObjectId.isValid(classId)) {
         throw new Error("ID lớp học không hợp lệ");
      }
      const objectId = new mongoose.Types.ObjectId(classId);

      // Tìm lớp học theo ID
      const classroom = await ClassRoomModel.findById(objectId);
      if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

      // Tìm học sinh trong cơ sở dữ liệu theo email
      const emails = data.map(row => row.email);
      const learnersToAdd = await UserModel.find({ email: { $in: emails } });

      const notFoundEmails = emails.filter(email =>
         !learnersToAdd.some(user => user.email === email)
      );

      const learnersIds = learnersToAdd.map(learner => learner._id.toString());
      classroom.learners = [...new Set([...classroom.learners, ...learnersIds])];

      await classroom.save();
      fs.unlinkSync(file.path);

      res.status(200).json({
         msg: "Thêm học sinh từ file Excel thành công!",
         notFoundEmails,
         addedLearners: learnersToAdd
      });
   } catch (error) {
      console.error('Lỗi khi thêm học sinh từ Excel:', error);
      res.status(500).json({ error: error.message });
   }
}

// Học sinh tham gia lớp qua mã code
export async function joinClassByCode(req, res) {
   try {
      const { code } = req.body;
      const userId = req.user.userId;

      const classroom = await ClassRoomModel.findOne({ code });
      if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

      if (classroom.learners.includes(userId)) {
         return res.status(400).json({ error: "Bạn đã là thành viên!" });
      }

      classroom.pending_requests.push(userId);
      await classroom.save();

      res.status(200).json({ msg: "Yêu cầu tham gia đã được gửi!", classroom });
   } catch (error) {
      res.status(500).json({ error: 'Lỗi khi tham gia lớp!' });
   }
}

export async function manageJoinRequest(req, res) {
   try {
      const { classId, learnerId } = req.params; // Lấy ID lớp và học sinh từ URL params
      const { status } = req.body; // Lấy trạng thái yêu cầu (approved hoặc rejected)

      // Kiểm tra lớp học
      const classroom = await ClassRoomModel.findById(classId);
      if (!classroom) {
         return res.status(404).json({ error: "Không tìm thấy lớp học!" });
      }

      // Kiểm tra nếu yêu cầu của học sinh có trong pending_requests
      if (!classroom.pending_requests.includes(learnerId)) {
         return res.status(400).json({ error: "Không tìm thấy yêu cầu tham gia!" });
      }

      if (status === 'approved') {
         // Thêm học sinh vào danh sách learners
         classroom.learners.push(learnerId);
      } else if (status !== 'rejected') {
         // Nếu status không phải approved hoặc rejected, trả về lỗi
         return res.status(400).json({ error: "Hành động không hợp lệ!" });
      }

      // Xóa học sinh khỏi danh sách pending_requests
      classroom.pending_requests = classroom.pending_requests.filter(
         (id) => id.toString() !== learnerId
      );

      // Lưu thay đổi vào cơ sở dữ liệu
      await classroom.save();

      res.status(200).json({ msg: "Yêu cầu đã được xử lý thành công!" });
   } catch (error) {
      console.error('Lỗi khi xử lý yêu cầu:', error);
      res.status(500).json({ error: "Lỗi khi xử lý yêu cầu!" });
   }
}

// Kick học sinh khỏi lớp
export async function kickLearner(req, res) {
   try {
      const { classId, learnerId } = req.params;

      const classroom = await ClassRoomModel.findById(classId);
      if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

      if (!classroom.learners.includes(learnerId)) {
         return res.status(400).json({ error: "Học sinh không có trong lớp!" });
      }

      classroom.learners = classroom.learners.filter(id => id.toString() !== learnerId);
      await classroom.save();

      res.status(200).json({ msg: "Đã kick học sinh khỏi lớp!", classroom });
   } catch (error) {
      res.status(500).json({ error: 'Lỗi khi kick học sinh!' });
   }
}

// Lấy tất cả lớp của giáo viên
export async function getAllClassesByInstructor(req, res) {
   try {
      const instructorId = req.user.userId;
      const classes = await ClassRoomModel.find({ instructor: instructorId });
      res.status(200).json({ msg: "Lấy danh sách lớp thành công!", classes });
   } catch (error) {
      res.status(500).json({ error: "Lỗi khi lấy danh sách lớp!" });
   }
}

// Lấy chi tiết lớp học
export async function getClassRoomDetails(req, res) {
   try {
      const { classId } = req.params;

      const classroom = await ClassRoomModel.findById(classId)
         .populate('learners', 'fullname email phone')
         .populate('instructor', 'fullname email phone')
         .populate('invited_learners', 'fullname email phone')
         .populate('tests_id'); // Populate bài kiểm tra

      if (!classroom) {
         return res.status(404).json({ error: "Không tìm thấy lớp học!" });
      }

      res.status(200).json({
         msg: "Lấy chi tiết lớp học thành công!",
         classroom
      });
   } catch (error) {
      console.error("Lỗi khi lấy chi tiết lớp học:", error);
      res.status(500).json({ error: "Lỗi khi lấy chi tiết lớp học!" });
   }
}


// Cập nhật thông tin lớp học
export async function updateClassRoom(req, res) {
   try {
      const { classId } = req.params;
      const { name, description } = req.body;

      const classroom = await ClassRoomModel.findById(classId);
      if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

      classroom.name = name || classroom.name;
      classroom.description = description || classroom.description;
      await classroom.save();

      res.status(200).json({ msg: "Cập nhật thành công!", classroom });
   } catch (error) {
      res.status(500).json({ error: "Lỗi khi cập nhật lớp!" });
   }
}

// Xóa lớp học
export async function deleteClassRoom(req, res) {
   try {
      const { classId } = req.params;
      const deletedClass = await ClassRoomModel.findByIdAndDelete(classId);
      if (!deletedClass) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

      res.status(200).json({ msg: "Xóa lớp thành công!", deletedClass });
   } catch (error) {
      res.status(500).json({ error: "Lỗi khi xóa lớp!" });
   }
}

export async function leaveClass(req, res) {
   try {
      const { classId } = req.params;
      const userId = req.user.userId;

      // Kiểm tra nếu classId có phải là ObjectId hợp lệ
      if (!mongoose.Types.ObjectId.isValid(classId)) {
         return res.status(400).json({ error: "ID lớp học không hợp lệ!" });
      }

      const classroom = await ClassRoomModel.findById(classId);
      if (!classroom) {
         return res.status(404).json({ error: "Không tìm thấy lớp học!" });
      }

      // Kiểm tra xem người dùng có phải thành viên của lớp không
      if (!classroom.learners.some(id => id.toString() === userId)) {
         return res.status(400).json({ error: "Bạn không phải là thành viên của lớp này!" });
      }

      // Xóa người dùng khỏi danh sách learners
      classroom.learners = classroom.learners.filter(id => id.toString() !== userId);

      await classroom.save(); // Lưu lại lớp học sau khi cập nhật

      res.status(200).json({ msg: "Rời khỏi lớp học thành công!", classroom });
   } catch (error) {
      console.error("Lỗi khi rời khỏi lớp học:", error); // In ra lỗi để dễ debug
      res.status(500).json({ error: "Lỗi khi rời khỏi lớp học!" });
   }
}