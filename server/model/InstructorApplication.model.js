import mongoose from 'mongoose';

// Định nghĩa schema cho đơn ứng tuyển giáo viên
const InstructorApplicationSchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Tham chiếu tới model User (giáo viên)
        required: true // Trường bắt buộc
    },
    applicationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'], // Trạng thái đơn
        default: 'pending'  // Trạng thái mặc định
    },
    applicationDate: {
        type: Date,
        default: Date.now // Ngày nộp đơn
    },
    reviewDate: {
        type: Date
    },
    specialization: {
        type: String,
        trim: true
    },
    cv: {
        type: String, // Đường dẫn tới CV (file PDF)
        trim: true
    },
    citizenIdPhoto: {
        type: String, // Đường dẫn tới ảnh căn cước công dân
        trim: true
    },
    bio: {
        type: String, // Mô tả ngắn về giáo viên
        trim: true
    }
}, {
    timestamps: true // Kích hoạt tự động tạo trường createdAt và updatedAt
});

// Xuất model
export default mongoose.model('InstructorApplication', InstructorApplicationSchema);
