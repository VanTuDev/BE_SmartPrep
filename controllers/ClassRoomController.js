import ClassRoomModel from '../model/ClassRoom.model.js';
import UserModel from '../model/User.model.js';
import TestModel from '../model/Test.model.js';

// Hàm tạo mã code ngẫu nhiên gồm 4 ký tự
function generateClassCode() {
   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
   let code = '';
   for (let i = 0; i < 4; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
   }
   return code;
}
// Tạo lớp học mới
export async function createClassRoom(req, res) {
   try {
      console.log("Request Body:", req.body);
      const { name, description } = req.body;
      const userId = req.user.userId;

      if (req.user.role !== 'instructor') {
         return res.status(403).json({ error: "Chỉ có giảng viên mới có thể tạo lớp học." });
      }

      // Tạo mã code cho lớp học
      const code = generateClassCode();

      // Tạo lớp học mới với mã code
      const newClass = new ClassRoomModel({ name, description, instructor: userId, code });
      await newClass.save();

      console.log("Lớp học mới đã được tạo:", JSON.stringify(newClass, null, 2));
      res.status(201).json({ msg: "Tạo lớp học thành công!", classRoom: newClass });
   } catch (error) {
      console.error("Lỗi khi tạo lớp học:", JSON.stringify(error, null, 2));
      res.status(500).json({ error: "Lỗi khi tạo lớp học!" });
   }
}
// Thêm học sinh vào lớp bằng email
export async function addMultipleLearners(req, res) {
   try {
      const { classId } = req.params;
      const { emails } = req.body;

      const classroom = await ClassRoomModel.findById(classId);
      if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

      const learnersToAdd = await UserModel.find({ email: { $in: emails } });
      const notFoundEmails = emails.filter(email => !learnersToAdd.some(user => user.email === email));
      const learnersIds = learnersToAdd.map(learner => learner._id);

      classroom.learners.push(...learnersIds);
      await classroom.save();

      console.log("Lớp học sau khi thêm học sinh:", JSON.stringify(classroom, null, 2));
      res.status(200).json({ msg: 'Thêm học sinh thành công!', notFoundEmails, addedLearners: learnersToAdd });
   } catch (error) {
      console.error('Lỗi khi thêm học sinh vào lớp:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: 'Lỗi khi thêm học sinh vào lớp học!' });
   }
}
// Mời học sinh tham gia lớp học qua email
export async function inviteLearners(req, res) {
   try {
      const { classId } = req.params; // Lấy ID lớp học từ URL
      const { emails } = req.body;    // Lấy danh sách email từ body request

      // Kiểm tra dữ liệu đầu vào
      console.log("Class ID:", classId);
      console.log("Emails to invite:", emails);

      // Tìm lớp học theo ID
      const classroom = await ClassRoomModel.findById(classId);
      if (!classroom) {
         console.error("Không tìm thấy lớp học với ID:", classId);
         return res.status(404).json({ error: "Không tìm thấy lớp học!" });
      }

      // Log thông tin lớp học
      console.log("Classroom found:", classroom);

      // Tìm danh sách học sinh dựa trên email
      const learnersToAdd = await UserModel.find({ email: { $in: emails } });
      console.log("Learners found by email:", learnersToAdd);

      // Kiểm tra xem email nào không có trong hệ thống
      const notFoundEmails = emails.filter(email => !learnersToAdd.some(user => user.email === email));
      console.log("Emails not found:", notFoundEmails);

      const learnersIds = learnersToAdd.map(learner => learner._id);

      // Kiểm tra danh sách learners đã có hoặc đã được mời
      const existingLearners = classroom.learners.concat(classroom.invited_learners);
      const filteredIds = learnersIds.filter(learnerId => !existingLearners.includes(learnerId));

      // Thêm các học sinh mới vào `invited_learners`
      console.log("Filtered learners to invite:", filteredIds);
      classroom.invited_learners.push(...filteredIds);
      await classroom.save();

      console.log("Lời mời đã được gửi đến:", JSON.stringify(filteredIds, null, 2));
      res.status(200).json({
         msg: 'Mời học sinh tham gia lớp học thành công!',
         notFoundEmails,
         invitedLearners: learnersToAdd,
      });
   } catch (error) {
      console.error('Chi tiết lỗi khi mời học sinh vào lớp học:', error);
      res.status(500).json({ error: 'Lỗi khi mời học sinh vào lớp học!', details: error.message });
   }
}
// Học sinh tham gia lớp học bằng mã code và lưu vào pending_requests
export async function joinClassByCode(req, res) {
   try {
      const { code } = req.body;
      const userId = req.user.userId;

      // Tìm lớp học dựa trên mã code
      const classroom = await ClassRoomModel.findOne({ code });
      if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học với mã này!" });

      // Kiểm tra nếu học sinh đã là thành viên của lớp
      if (classroom.learners.includes(userId)) return res.status(400).json({ error: "Bạn đã là thành viên của lớp học này!" });

      // Kiểm tra nếu học sinh đã gửi yêu cầu trước đó
      if (classroom.pending_requests.includes(userId)) return res.status(400).json({ error: "Yêu cầu tham gia của bạn đang chờ được duyệt!" });

      // Thêm học sinh vào danh sách pending_requests
      classroom.pending_requests.push(userId);
      await classroom.save();

      console.log("Lớp học sau khi thêm yêu cầu tham gia:", JSON.stringify(classroom, null, 2));
      res.status(200).json({ msg: "Yêu cầu tham gia lớp học thành công! Vui lòng đợi giáo viên phê duyệt.", classroom });
   } catch (error) {
      console.error('Lỗi khi tham gia lớp học bằng mã code:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: 'Lỗi khi gửi yêu cầu tham gia lớp học!' });
   }
}
// Duyệt yêu cầu tham gia lớp học của học sinh từ pending_requests
export async function approveJoinRequest(req, res) {
   try {
      const { classId, email } = req.body;

      // Tìm lớp học dựa vào ID
      const classroom = await ClassRoomModel.findById(classId);
      if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

      // Tìm học sinh dựa vào email
      const learner = await UserModel.findOne({ email });
      if (!learner) return res.status(404).json({ error: "Không tìm thấy học sinh với email này!" });

      // Kiểm tra nếu học sinh đã là thành viên của lớp
      if (classroom.learners.includes(learner._id)) return res.status(400).json({ error: "Học sinh đã là thành viên của lớp học!" });

      // Kiểm tra nếu học sinh có trong danh sách yêu cầu tham gia lớp
      if (classroom.pending_requests.includes(learner._id)) {
         // Thêm học sinh vào danh sách learners
         classroom.learners.push(learner._id);

         // Xóa học sinh khỏi danh sách pending_requests
         classroom.pending_requests = classroom.pending_requests.filter(reqId => reqId.toString() !== learner._id.toString());

         // Lưu lại thông tin lớp học
         await classroom.save();
         console.log("Lớp học sau khi phê duyệt yêu cầu:", JSON.stringify(classroom, null, 2));
         return res.status(200).json({ msg: 'Yêu cầu tham gia lớp đã được chấp thuận!', classroom });
      } else {
         return res.status(400).json({ error: "Học sinh không có yêu cầu tham gia cần duyệt!" });
      }
   } catch (error) {
      console.error('Lỗi khi chấp thuận yêu cầu tham gia lớp:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: 'Lỗi khi chấp thuận yêu cầu!' });
   }
}
// Học sinh rời khỏi lớp học
export async function leaveClass(req, res) {
   try {
      console.log("Request Params:", req.params);
      const { classId } = req.params; // Nhận ID lớp học từ params
      const userId = req.user.userId; // Nhận ID người dùng từ token

      // Tìm lớp học dựa vào classId
      const classroom = await ClassRoomModel.findById(classId);
      if (!classroom) return res.status(404).json({ error: 'Không tìm thấy lớp học!' });

      // Kiểm tra nếu học sinh là thành viên của lớp học
      if (!classroom.learners.includes(userId)) {
         return res.status(400).json({ error: 'Bạn không phải là thành viên của lớp học này!' });
      }

      // Xóa học sinh ra khỏi danh sách learners
      classroom.learners = classroom.learners.filter(learner => learner.toString() !== userId);
      await classroom.save(); // Lưu lớp học sau khi cập nhật

      console.log("Lớp học sau khi học sinh rời khỏi:", JSON.stringify(classroom, null, 2));
      res.status(200).json({ msg: 'Rời khỏi lớp học thành công!', classroom });
   } catch (error) {
      console.error('Lỗi khi rời khỏi lớp học:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: 'Lỗi khi rời khỏi lớp học!' });
   }
}
export async function acceptClassInvitation(req, res) {
   try {
      const { classId } = req.params; // Lấy ID lớp học từ URL
      const userId = req.user.userId; // Lấy ID của người dùng từ token

      // Kiểm tra dữ liệu đầu vào
      console.log("Request Params:", req.params);
      console.log("User ID từ Token:", userId);

      // Tìm lớp học dựa vào ID
      const classroom = await ClassRoomModel.findById(classId);
      if (!classroom) {
         return res.status(404).json({ error: "Không tìm thấy lớp học!" });
      }

      // Kiểm tra nếu người dùng đã được mời tham gia lớp này hay chưa
      if (!classroom.invited_learners.includes(userId)) {
         return res.status(403).json({ error: "Bạn không có lời mời tham gia lớp học này!" });
      }

      // Thêm người dùng vào danh sách `learners` của lớp học
      classroom.learners.push(userId);

      // Xóa người dùng ra khỏi danh sách `invited_learners`
      classroom.invited_learners = classroom.invited_learners.filter(learnerId => learnerId.toString() !== userId);

      // Lưu lại thông tin lớp học sau khi cập nhật
      await classroom.save();

      console.log("Lớp học sau khi chấp nhận lời mời:", JSON.stringify(classroom, null, 2));
      res.status(200).json({ msg: "Chấp nhận lời mời tham gia lớp thành công!", classroom });
   } catch (error) {
      console.error("Lỗi khi chấp nhận lời mời tham gia lớp học:", JSON.stringify(error, null, 2));
      res.status(500).json({ error: "Lỗi khi chấp nhận lời mời tham gia lớp học!" });
   }
}
// Lấy tất cả lớp do instructor tạo
export async function getAllClassesByInstructor(req, res) {
   try {
      const instructorId = req.user.userId; // Lấy ID của giáo viên từ token
      console.log("Instructor ID từ Token:", instructorId);

      // Truy vấn để lấy tất cả các lớp mà giáo viên đã tạo
      const classes = await ClassRoomModel.find({ instructor: instructorId });

      console.log("Danh sách lớp học:", JSON.stringify(classes, null, 2)); // In ra console để kiểm tra
      res.status(200).json({ msg: "Lấy danh sách lớp thành công!", classes }); // Trả về danh sách lớp học
   } catch (error) {
      console.error("Lỗi khi lấy danh sách lớp học:", JSON.stringify(error, null, 2)); // In lỗi chi tiết
      res.status(500).json({ error: "Lỗi khi lấy danh sách lớp học!" }); // Trả về lỗi
   }
}
// Lấy chi tiết lớp học
export async function getClassRoomDetails(req, res) {
   try {
      console.log("Request Params:", req.params);
      const { classId } = req.params;

      const classroom = await ClassRoomModel.findById(classId)
         .populate('learners', 'fullname email')
         .populate('tests');

      if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

      console.log("Chi tiết lớp học:", JSON.stringify(classroom, null, 2));
      res.status(200).json({ msg: "Lấy thông tin lớp học thành công!", classroom });
   } catch (error) {
      console.error("Lỗi khi lấy thông tin lớp học:", JSON.stringify(error, null, 2));
      res.status(500).json({ error: "Lỗi khi lấy thông tin lớp học!" });
   }
}
// Chỉnh sửa thông tin lớp học
export async function updateClassRoom(req, res) {
   try {
      console.log("Request Params:", req.params); // In ra các tham số để kiểm tra
      console.log("Request Body:", req.body); // In ra request body để kiểm tra
      const { classId } = req.params;
      const { name, description } = req.body;

      // Tìm lớp học theo ID
      const classroom = await ClassRoomModel.findById(classId);
      if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

      // Cập nhật thông tin lớp học
      classroom.name = name || classroom.name;
      classroom.description = description || classroom.description;
      await classroom.save();

      console.log("Lớp học sau khi cập nhật:", JSON.stringify(classroom, null, 2)); // In thông tin lớp học ra console
      res.status(200).json({ msg: "Cập nhật thông tin lớp học thành công!", classroom }); // Trả về thông tin lớp học sau khi cập nhật
   } catch (error) {
      console.error("Lỗi khi cập nhật thông tin lớp học:", JSON.stringify(error, null, 2)); // In ra lỗi chi tiết nếu có
      res.status(500).json({ error: "Lỗi khi cập nhật thông tin lớp học!" }); // Trả về lỗi nếu xảy ra
   }
}






// // CHƯA LÀM ĐƯỢC !!!!!!!!!!!
// // Instructor upload tài liệu vào lớp học
// export async function uploadResource(req, res) {
//    try {
//       console.log("Request Params:", req.params); // In ra các tham số để kiểm tra
//       const { classId } = req.params; // Lấy ID của lớp học từ request params
//       const file = req.file; // Lấy tệp được tải lên từ request
//       console.log("File được tải lên:", file); // In ra thông tin của file để kiểm tra

//       if (!file) return res.status(400).json({ error: "Không có tệp nào được tải lên!" });

//       // Tìm lớp học theo ID
//       const classroom = await ClassRoomModel.findById(classId);
//       if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

//       // Thêm tài liệu vào lớp học
//       classroom.resources.push({
//          filename: file.filename,
//          path: file.path,
//          originalname: file.originalname,
//       });

//       await classroom.save();
//       console.log("Tài liệu đã được thêm vào lớp học:", JSON.stringify(classroom.resources, null, 2)); // In thông tin tài liệu đã được thêm
//       res.status(200).json({ msg: "Tải tài liệu lên lớp học thành công!", resources: classroom.resources }); // Trả về thông tin tài liệu đã thêm
//    } catch (error) {
//       console.error("Chi tiết lỗi:", error);
//       res.status(500).json({ error: { message: "Đã xảy ra lỗi không xác định!", detail: error.message } });
//    }
// }
// // Cập nhật thông tin tài liệu của lớp học
// export async function updateResource(req, res) {
//    try {
//       const { classId, resourceId } = req.params; // Lấy ID lớp học và ID tài liệu từ request params
//       const { filename } = req.body; // Lấy filename mới từ request body

//       // Tìm lớp học theo ID
//       const classroom = await ClassRoomModel.findById(classId);
//       if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

//       // Tìm tài liệu cần cập nhật trong lớp học
//       const resource = classroom.resources.id(resourceId);
//       if (!resource) return res.status(404).json({ error: "Không tìm thấy tài liệu!" });

//       // Cập nhật tên tài liệu
//       resource.filename = filename || resource.filename;
//       await classroom.save();

//       console.log("Tài liệu sau khi cập nhật:", JSON.stringify(resource, null, 2)); // In thông tin tài liệu sau khi cập nhật
//       res.status(200).json({ msg: "Cập nhật tài liệu thành công!", resource });
//    } catch (error) {
//       console.error("Chi tiết lỗi:", error);
//       res.status(500).json({ error: { message: "Đã xảy ra lỗi không xác định!", detail: error.message } });
//    }
// }
// // Xóa tài liệu khỏi lớp học
// export async function deleteResource(req, res) {
//    try {
//       const { classId, resourceId } = req.params; // Lấy ID lớp học và ID tài liệu từ request params

//       // Tìm lớp học theo ID
//       const classroom = await ClassRoomModel.findById(classId);
//       if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

//       // Tìm và xóa tài liệu
//       const resourceIndex = classroom.resources.findIndex(resource => resource._id.toString() === resourceId);
//       if (resourceIndex === -1) return res.status(404).json({ error: "Không tìm thấy tài liệu!" });

//       // Xóa tài liệu khỏi mảng `resources`
//       classroom.resources.splice(resourceIndex, 1);
//       await classroom.save();

//       console.log(`Đã xóa tài liệu với ID: ${resourceId} khỏi lớp học`); // In ra thông báo khi xóa thành công
//       res.status(200).json({ msg: "Xóa tài liệu thành công!" });
//    } catch (error) {
//       console.error("Lỗi khi xóa tài liệu:", JSON.stringify(error, null, 2)); // In lỗi ra console nếu có
//       res.status(500).json({ error: "Lỗi khi xóa tài liệu!" });
//    }
// }
// // Thêm bài kiểm tra vào lớp học
// export async function addTestToClass(req, res) {
//    try {
//       console.log("Request Params:", req.params);
//       console.log("Request Body:", req.body);
//       const { classId } = req.params;
//       const { testId } = req.body;

//       const classroom = await ClassRoomModel.findById(classId);
//       if (!classroom) return res.status(404).json({ error: "Không tìm thấy lớp học!" });

//       const test = await TestModel.findById(testId);
//       if (!test) return res.status(404).json({ error: "Không tìm thấy bài kiểm tra!" });

//       classroom.tests.push(testId);
//       await classroom.save();

//       console.log("Lớp học sau khi thêm bài kiểm tra:", JSON.stringify(classroom, null, 2));
//       res.status(200).json({ msg: "Thêm bài kiểm tra vào lớp học thành công!", classroom });
//    } catch (error) {
//       console.error("Lỗi khi thêm bài kiểm tra vào lớp học:", JSON.stringify(error, null, 2));
//       res.status(500).json({ error: "Lỗi khi thêm bài kiểm tra vào lớp học!" });
//    }
// }
