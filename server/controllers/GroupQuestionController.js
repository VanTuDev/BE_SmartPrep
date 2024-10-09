import GroupModel from '../model/GroupQuestion.model.js'; // Nhập model cho nhóm câu hỏi
import QuestionModel from '../model/Question.model.js'; // Nhập model cho câu hỏi

// Tạo nhóm mới
export async function createGroup(req, res) {
   try {
      // Kiểm tra xem người dùng có phải là instructor không
      if (req.user.role !== 'instructor') {
         return res.status(403).json({ error: "Chỉ có giảng viên mới có thể tạo nhóm." });
      }

      const { name, description } = req.body; // Lấy tên và mô tả từ body

      // Kiểm tra các trường đầu vào
      if (!name || !description) {
         return res.status(400).json({ error: "Tên nhóm và mô tả không được để trống." });
      }

      console.log("Request Body:", req.body);
      const newGroup = new GroupModel({
         name,
         description,
         created_by: req.user.userId, // Lưu thông tin người tạo
      });

      await newGroup.save();
      res.status(201).json({ msg: "Nhóm đã được tạo thành công!", group: newGroup });
   } catch (error) {
      console.error("Lỗi khi tạo nhóm:", error);
      return res.status(500).json({ error: "Lỗi khi tạo nhóm: " + error.message }); // Ghi lại lỗi chi tiết
   }
}

// Lấy tất cả các nhóm
export async function getAllGroups(req, res) {
   try {
      // Lấy nhóm theo người tạo
      const groups = await GroupModel.find({ created_by: req.user.userId });
      console.log("Danh sách nhóm:", groups);
      res.status(200).json(groups);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách nhóm:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách nhóm!" });
   }
}

// Lấy danh sách câu hỏi theo nhóm
export async function getQuestionsByGroupId(req, res) {
   try {
      console.log("Request Group ID:", req.params.id);
      const questions = await QuestionModel.find({ group: req.params.id });
      if (!questions.length) {
         console.log("Không tìm thấy câu hỏi nào cho nhóm ID:", req.params.id);
         return res.status(404).json({ error: "Không tìm thấy câu hỏi nào cho nhóm này." });
      }
      console.log("Danh sách câu hỏi theo nhóm:", questions);
      res.status(200).json(questions);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách câu hỏi theo nhóm:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách câu hỏi theo nhóm!" });
   }
}

// Cập nhật nhóm
export async function updateGroup(req, res) {
   try {
      const groupId = req.params.id.trim(); // Loại bỏ khoảng trắng hoặc ký tự không cần thiết
      console.log("Request Group ID để cập nhật:", groupId);
      console.log("Request Body:", req.body);

      // Tìm và cập nhật nhóm
      const group = await GroupModel.findByIdAndUpdate(groupId, req.body, { new: true });

      // Kiểm tra xem nhóm có tồn tại không
      if (!group) {
         console.error("Không tìm thấy nhóm để cập nhật với ID:", groupId);
         return res.status(404).json({ error: "Không thể cập nhật nhóm! Nhóm không tồn tại." });
      }

      console.log("Nhóm đã được cập nhật:", group);
      res.status(200).json({ msg: "Cập nhật nhóm thành công!", group });
   } catch (error) {
      console.error("Lỗi khi cập nhật nhóm:", error.message);

      // Xử lý các lỗi khác nhau
      if (error.name === 'CastError') {
         return res.status(400).json({ error: "ID nhóm không hợp lệ." });
      }
      if (error.name === 'ValidationError') {
         return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Lỗi khi cập nhật nhóm!" });
   }
}



// Xóa nhóm
export async function deleteGroup(req, res) {
   try {
      console.log("Request Group ID để xóa:", req.params.id);
      const group = await GroupModel.findById(req.params.id);
      if (!group) {
         console.log("Không tìm thấy nhóm để xóa với ID:", req.params.id);
         return res.status(404).json({ error: "Không thể xóa nhóm!" });
      }

      // Xóa nhóm
      await group.remove();
      console.log("Nhóm đã được xóa thành công với ID:", req.params.id);
      res.status(200).json({ msg: "Xóa nhóm thành công!" });
   } catch (error) {
      console.error("Lỗi khi xóa nhóm:", error);
      res.status(500).json({ error: "Lỗi khi xóa nhóm!" });
   }
}
