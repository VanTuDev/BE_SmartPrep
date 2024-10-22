// model/GroupQuestion.model.js
import mongoose from 'mongoose';

const GroupQuestionSchema = new mongoose.Schema({
   name: { type: String, required: true },
   description: { type: String },
   category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
   instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const GroupModel = mongoose.model('GroupQuestion', GroupQuestionSchema);
export default GroupModel;
