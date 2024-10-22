
// LỚP HỌC
import mongoose from 'mongoose';

const ClassRoomSchema = new mongoose.Schema({
   name: { type: String, required: true },
   description: { type: String, required: true },
   code: { type: String, unique: true },
   instructor: { // Tham chiếu đến giáo viên phụ trách
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   grades_id: [{ // Tham chiếu đến khối học
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade'
   }],
   learners: [{ // Tham chiếu đến danh sách học sinh
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }],
   pending_requests: [{ // Tham chiếu đến các yêu cầu chờ duyệt
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }],
   invited_learners: [{ // Tham chiếu đến học sinh được mời
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }],
   tests_id: [{ // Tham chiếu đến các bài kiểm tra của lớp
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test'
   }]
}, { timestamps: true });

const ClassRoomModel = mongoose.models.ClassRoom || mongoose.model('ClassRoom', ClassRoomSchema);
export default ClassRoomModel;
