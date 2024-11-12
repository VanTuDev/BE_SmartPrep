// controllers/CommentController.js
import Comment from '../model/Comment.model.js';

// Thêm bình luận mới
export const createComment = async (req, res) => {
   const { test_id, user_id, content } = req.body;
   try {
      const comment = new Comment({ test_id, user_id, content });
      await comment.save();
      res.status(201).json(comment);
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

// Lấy danh sách bình luận của một bài kiểm tra
export const getCommentsByTest = async (req, res) => {
   const { test_id } = req.query;
   try {
      const comments = await Comment.find({ test_id })
         .populate('user_id', 'username profile')
         .populate('replies.user_id', 'username profile');
      res.status(200).json(comments);
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

// Sửa bình luận
export const updateComment = async (req, res) => {
   const { id } = req.params;
   const { content, user_id } = req.body;

   try {
      const comment = await Comment.findOneAndUpdate(
         { _id: id, user_id },
         { content, updated_at: Date.now() },
         { new: true }
      );
      if (!comment) return res.status(404).json({ error: 'Không tìm thấy bình luận hoặc không có quyền sửa' });
      res.status(200).json(comment);
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

// Xóa bình luận
export const deleteComment = async (req, res) => {
   const { id } = req.params;
   const { user_id, role } = req.body;

   try {
      const comment = await Comment.findById(id);
      if (comment && (comment.user_id.toString() === user_id || role === 'instructor')) {
         await comment.remove();
         res.status(200).json({ message: 'Xóa bình luận thành công' });
      } else {
         res.status(403).json({ error: 'Không có quyền xóa bình luận này' });
      }
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

// Hàm xóa reply
export const deleteReply = async (req, res) => {
   const { id, replyId } = req.params;
   const { user_id, role } = req.body;

   try {
      const comment = await Comment.findById(id);

      if (!comment) {
         return res.status(404).json({ error: 'Không tìm thấy bình luận' });
      }

      // Tìm reply trong mảng replies bằng replyId
      const reply = comment.replies.id(replyId);

      if (!reply) {
         return res.status(404).json({ error: 'Không tìm thấy reply này' });
      }

      // Kiểm tra quyền: Chỉ người tạo reply hoặc instructor mới có thể xóa
      if (reply.user_id.toString() === user_id || role === 'instructor') {
         reply.remove(); // Xóa reply khỏi mảng replies
         await comment.save();
         return res.status(200).json({ message: 'Xóa reply thành công' });
      } else {
         return res.status(403).json({ error: 'Không có quyền xóa reply này' });
      }
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

// Trả lời bình luận
export const replyToComment = async (req, res) => {
   const { id } = req.params;
   const { user_id, content } = req.body;

   try {
      const comment = await Comment.findById(id);
      if (!comment) return res.status(404).json({ error: 'Không tìm thấy bình luận' });

      comment.replies.push({ user_id, content });
      await comment.save();
      res.status(201).json(comment);
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};
