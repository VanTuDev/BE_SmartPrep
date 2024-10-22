// KHỐI
import mongoose from 'mongoose';

const GradeSchema = new mongoose.Schema({
   name: { type: String, required: true, unique: true },
   description: { type: String, default: '' },
   instructor: { // Tham chiếu đến giáo viên tạo khối
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   categories_id: [{ // Tham chiếu đến các danh mục môn học
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
   }]
}, { timestamps: true });

const GradeModel = mongoose.models.Grade || mongoose.model('Grade', GradeSchema);
export default GradeModel;
