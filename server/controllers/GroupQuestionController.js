// controllers/GroupController.js
import GroupModel from '../model/GroupQuestion.model.js';
import mongoose from 'mongoose';
// Tạo chương học mới
export async function createGroup(req, res) {
   try {
      const { name, description, category_id } = req.body;

      if (!mongoose.Types.ObjectId.isValid(category_id)) {
         return res.status(400).json({ error: 'category_id không hợp lệ!' });
      }

      const newGroup = new GroupModel({
         name,
         description,
         category_id: new mongoose.Types.ObjectId(category_id),
         instructor: req.user.userId,
      });

      await newGroup.save();
      res.status(201).json({ msg: 'Chương học đã được tạo!', group: newGroup });
   } catch (error) {
      console.error('Lỗi khi tạo chương học:', error);
      res.status(500).json({ error: 'Lỗi khi tạo chương học!' });
   }
}

// Lấy tất cả các chương học của instructor
export async function getAllGroups(req, res) {
   try {
      const groups = await GroupModel.find({ instructor: req.user.userId });
      res.status(200).json(groups);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách chương:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách chương!" });
   }
}

// Cập nhật chương học
export async function updateGroup(req, res) {
   try {
      const groupId = req.params.id;
      const updatedGroup = await GroupModel.findByIdAndUpdate(
         groupId,
         req.body,
         { new: true }
      );

      if (!updatedGroup) {
         return res.status(404).json({ error: "Không tìm thấy chương học!" });
      }

      res.status(200).json({ msg: "Cập nhật chương học thành công!", group: updatedGroup });
   } catch (error) {
      console.error("Lỗi khi cập nhật chương học:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật chương học!" });
   }
}

// Xóa chương học
export async function deleteGroup(req, res) {
   try {
      const group = await GroupModel.findById(req.params.id);
      if (!group) {
         return res.status(404).json({ error: "Không tìm thấy chương học!" });
      }

      await group.remove();
      res.status(200).json({ msg: "Xóa chương học thành công!" });
   } catch (error) {
      console.error("Lỗi khi xóa chương học:", error);
      res.status(500).json({ error: "Lỗi khi xóa chương học!" });
   }
}

// Lấy thông tin của chương học theo ID
export async function getGroupById(req, res) {
   try {
      const groupId = req.params.id;
      console.log(`Đang lấy chương với ID: ${groupId}`);

      // Kiểm tra xem groupId có phải là ObjectId hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
         console.error(`groupId không hợp lệ: ${groupId}`);
         return res.status(400).json({ error: "ID của chương học không hợp lệ!" });
      }

      // Truy vấn chương học theo ID
      const group = await GroupModel.findById(groupId);
      console.log(`Kết quả truy vấn:`, group);

      if (!group) {
         console.warn(`Không tìm thấy chương học với ID: ${groupId}`);
         return res.status(404).json({ error: "Không tìm thấy chương học!" });
      }

      res.status(200).json(group);
   } catch (error) {
      console.error("Lỗi khi lấy chương học:", error);
      res.status(500).json({ error: "Lỗi khi lấy chương học!", details: error.message });
   }
}


export async function getGroupsByCategory(req, res) {
   try {
      const { category_id } = req.query;

      console.log(`Nhận được category_id: ${category_id}`);

      // Kiểm tra nếu category_id hợp lệ
      if (!mongoose.isValidObjectId(category_id)) {
         console.error(`category_id không hợp lệ: ${category_id}`);
         return res.status(400).json({ error: "ID của môn học không hợp lệ!" });
      }

      // Truy vấn tất cả các nhóm dựa trên category_id
      const groups = await GroupModel.find({ category_id: mongoose.Types.ObjectId(category_id) });

      console.log(`Số lượng nhóm tìm thấy: ${groups.length}`);
      if (groups.length === 0) {
         return res.status(404).json({ error: "Không có chương nào cho môn học này!" });
      }

      res.status(200).json(groups);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách chương:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách chương!", details: error.message });
   }
}