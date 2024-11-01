import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
   classId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassRoom', required: true },
   sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
   message: { type: String, required: true },
   timestamp: { type: Date, default: Date.now }
});

const MessageModel = mongoose.model('Message', MessageSchema);
export default MessageModel;
