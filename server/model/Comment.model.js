import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ReplySchema = new Schema({
   user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
   content: { type: String, required: true },
   created_at: { type: Date, default: Date.now },
});

const CommentSchema = new Schema({
   test_id: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
   user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
   content: { type: String, required: true },
   created_at: { type: Date, default: Date.now },
   updated_at: { type: Date, default: Date.now },
   replies: [ReplySchema], // Mảng các phản hồi
});

export default mongoose.model('Comment', CommentSchema);
