// MÔN HỌC

import mongoose from 'mongoose';
const CategorySchema = new mongoose.Schema({
   name: { type: String, required: true, trim: true },
   description: { type: String, required: true, trim: true },
   grade_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      required: true
   },
   instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   }
}, { timestamps: true });

const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export default CategoryModel;
