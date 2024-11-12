// routes/commentRoutes.js
import express from 'express';
import * as CommentController from '../controllers/CommentController.js';

const router = express.Router();

// Định nghĩa các route cho bình luận
router.post('/', CommentController.createComment); // Thêm bình luận
router.get('/', CommentController.getCommentsByTest); // Lấy danh sách bình luận cho một bài kiểm tra
router.put('/:id', CommentController.updateComment); // Sửa bình luận
router.delete('/:id', CommentController.deleteComment); // Xóa bình luận
router.post('/:id/reply', CommentController.replyToComment); // Trả lời bình luận

export default router;
