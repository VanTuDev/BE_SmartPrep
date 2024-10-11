import mongoose from 'mongoose';

const ClassRoomSchema = new mongoose.Schema({
   name: { type: String, required: true },
   description: { type: String, required: true },
   code: { type: String, unique: true },
   instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
   learners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
   pending_requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
   invited_learners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
   resources: [
      {
         file_name: String,
         file_type: String,
         file_url: String,
         uploaded_at: { type: Date, default: Date.now },
         uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
   ],
   tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }]
}, { timestamps: true });

const ClassRoomModel = mongoose.model('ClassRoom', ClassRoomSchema);

export default ClassRoomModel;
