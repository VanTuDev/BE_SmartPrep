import mongoose from 'mongoose';
import ClassRoomModel from '../model/ClassRoom.model.js';
import MessageModel from '../model/Messange.model.js';
import UserModel from '../model/User.model.js';
import fs from 'fs';
import XLSX from 'xlsx';
import jwt from "jsonwebtoken";


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

       // Find the classroom by ID
       const classroom = await ClassRoomModel.findById(classId);
       if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

       // Extract the instructor's ID
       const instructorId = classroom.instructor.toString();

       // Find the learners based on the provided emails or phone numbers
       const learnersToAdd = await UserModel.find({
           $or: [{ email: { $in: emails || [] } }, { phone: { $in: phones || [] } }]
       });

       // Extract the IDs of learners to add and filter out the instructor
       const learnersIdsToAdd = learnersToAdd
           .map(learner => learner._id.toString())
           .filter(learnerId => learnerId !== instructorId);

       // Filter out learners that are already part of the class
       const newLearnersIds = learnersIdsToAdd.filter(
           learnerId => !classroom.learners.includes(learnerId)
       );

       if (newLearnersIds.length === 0) {
           return res.status(400).json({ error: 'Bạn không thể thêm bản thân hoặc học sinh đã tham gia lớp!' });
       }

       // Add only the new learners to the class
       classroom.learners = [...classroom.learners, ...newLearnersIds];

       // Save the updated classroom
       await classroom.save();

       res.status(200).json({
           msg: 'Thêm học sinh thành công!',
           addedLearners: learnersToAdd.filter(learner =>
               newLearnersIds.includes(learner._id.toString())
           )
       });
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
export const kickLearner = async (req, res) => {
    try {
        const { classId, learnerId } = req.params;

        const classRoom = await ClassRoomModel.findById(classId);
        if (!classRoom) {
            return res.status(404).json({ message: 'Lớp học không tồn tại.' });
        }
        // Remove learner from learners array
        classRoom.learners = classRoom.learners.filter(
            id => id.toString() !== learnerId
        );
        await classRoom.save();
        res.status(200).json({ message: 'Học viên đã bị xóa khỏi lớp.' });
    } catch (error) {
        console.error('Lỗi khi xóa học viên:', error);
        res.status(500).json({ message: 'Không thể xóa học viên.' });
    }
};

// Lấy tất cả lớp của giáo viên
export async function getAllClasses(req, res) {
   try {
      const classes = await ClassRoomModel.find();
      res.status(200).json({ msg: "Lấy danh sách lớp thành công!", classes });
   } catch (error) {
      res.status(500).json({ error: "Lỗi khi lấy danh sách lớp!" });
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

// Hiển thị các lớp học sinh đã tham gia 
export const getAllClassesByLearner = async (req, res) => {
   try {
      const learnerId = req.user.userId;

      // Query only classes where the learner is in the `learners` array
      const classes = await ClassRoomModel.find({ learners: learnerId });

      res.status(200).json({ msg: 'Lấy danh sách lớp thành công!', classes });
  } catch (error) {
      console.error('Lỗi khi lấy danh sách lớp học của học viên:', error);
      res.status(500).json({ msg: 'Không thể lấy danh sách lớp học.' });
  }
};



// Lấy chi tiết lớp học
export async function getClassRoomDetails(req, res) {
   try {
      const { classId } = req.params;

      const classroom = await ClassRoomModel.findById(classId)
         .populate('learners', 'fullname email phone')
         .populate('instructor', 'fullname email phone')
         .populate('invited_learners', 'fullname email phone')
         .populate('pending_requests', 'fullname email image')
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

// Lấy tất cả chi tiết lớp học
export async function getAllClassRooms(req, res) {
   try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
         return res.status(401).json({ error: "Token không tồn tại!" });
      }
      
      // Decode the token to get the instructor ID
      const {userId} = jwt.verify(token, process.env.JWT_SECRET);
      const instructorId = userId

      // Find classrooms where the instructor matches the decoded instructor ID
      const classrooms = await ClassRoomModel.find({ instructor: instructorId })
         .populate('learners', 'fullname email phone')
         .populate('instructor', 'fullname email phone')
         .populate('invited_learners', 'fullname email phone')
         .populate('pending_requests', 'fullname email image')
         .populate('tests_id'); // Populate bài kiểm tra

      res.status(200).json({
         message: "Lấy danh sách các lớp học của giảng viên thành công!",
         classrooms,
      });
   } catch (error) {
      console.error("Lỗi khi lấy danh sách lớp học:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách lớp học!" });
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

export const approveJoinRequest = async (req, res) => {
   try {
       const { classId, learnerId } = req.params;

       const classRoom = await ClassRoomModel.findById(classId);
       if (!classRoom) {
           return res.status(404).json({ message: 'Lớp học không tồn tại.' });
       }

       // Check if learner exists in pending requests
       if (!classRoom.pending_requests.includes(learnerId)) {
           return res.status(400).json({ message: 'Yêu cầu không tồn tại.' });
       }

       // Move learner from pending_requests to learners
       classRoom.pending_requests = classRoom.pending_requests.filter(
           (id) => id.toString() !== learnerId
       );
       classRoom.learners.push(learnerId);
       await classRoom.save();

       res.status(200).json({ message: 'Yêu cầu đã được phê duyệt.' });
   } catch (error) {
       console.error('Lỗi khi phê duyệt yêu cầu:', error);
       res.status(500).json({ message: 'Không thể phê duyệt yêu cầu.' });
   }
};

// Reject learner join request
export const rejectJoinRequest = async (req, res) => {
   try {
       const { classId, learnerId } = req.params;

       const classRoom = await ClassRoomModel.findById(classId);
       if (!classRoom) {
           return res.status(404).json({ message: 'Lớp học không tồn tại.' });
       }

       classRoom.pending_requests = classRoom.pending_requests.filter(
           (id) => id.toString() !== learnerId
       );
       await classRoom.save();

       res.status(200).json({ message: 'Yêu cầu đã bị từ chối.' });
   } catch (error) {
       console.error('Lỗi khi từ chối yêu cầu:', error);
       res.status(500).json({ message: 'Không thể từ chối yêu cầu.' });
   }
};

// rời lớp
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

export const createMessage = async (req, res) => {
   const { classId } = req.params; // Lấy classId từ URL
   const { message } = req.body;
   const userId = req.user.userId; // Giả sử userId có trong token và middleware xác thực đã thêm vào req.user

   try {
       const newMessage = new MessageModel({
           classId,
           sender: userId,
           message,
       });

       await newMessage.save();
       res.status(201).json({
           message: 'Tin nhắn đã được lưu thành công!',
           data: newMessage,
       });
   } catch (error) {
       console.error('Lỗi khi lưu tin nhắn:', error); // In lỗi ra console
       res.status(500).json({ error: 'Không thể lưu tin nhắn!', details: error.message });
   }
};

export const ViewMessage = async (req, res) => {
   const { classId } = req.params;
   try {
       const messages = await MessageModel.find({ classId }).populate('sender', 'username');
       res.status(200).json(messages);
   } catch (error) {
       console.error('Lỗi khi lấy tin nhắn:', error);
       res.status(500).json({ error: 'Không thể lấy tin nhắn!' });
   }
};
