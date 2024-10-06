import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, "Please provide the category name"],
   },
   description: {
      type: String,
      required: [true, "Please provide a description for the category"],
   },
   created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Tham chiếu đến model User
      required: true,
   },
   created_at: {
      type: Date,
      default: Date.now,
   },
   updated_at: {
      type: Date,
      default: Date.now,
   },
});

// Middleware để cập nhật thời gian
CategorySchema.pre('save', function (next) {
   this.updated_at = Date.now();
   next();
});

CategorySchema.pre('findOneAndUpdate', function (next) {
   this._update.updated_at = Date.now();
   next();
});

// Kiểm tra model đã tồn tại hay chưa
const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);

export default CategoryModel;
