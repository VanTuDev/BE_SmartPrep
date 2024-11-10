import mongoose from 'mongoose';

// Room Schema
const RoomSchema = new mongoose.Schema({
  roomTitle: { type: String, required: true },
  author: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roomName: { type: String, required: true, unique: true }, 
  serverUrl: { type: String, required: true },
  participantToken: String,
  participantName: String,
  classId: {
    type: mongoose.Types.ObjectId,
    ref: 'ClassRoom',
    required: true,
  },
}, {
  timestamps: true,
});

const RoomModel = mongoose.models.Room || mongoose.model('Room', RoomSchema);

export default RoomModel;
