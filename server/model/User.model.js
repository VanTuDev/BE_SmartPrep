import mongoose from 'mongoose';

// Định nghĩa schema cho người dùng với các trường
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false // Không bao gồm mật khẩu trong kết quả truy vấn mặc định
    },
    profile: {
        type: String,
        default: 'default-profile.jpg'
    },
    role: {
        type: String,
        enum: ['learner', 'instructor', 'admin'],
        default: 'learner'
    },
    cv: {
        type: String,
        default: null, // Giá trị mặc định là null nếu không phải instructor
    },
    is_locked: {
        type: Boolean,
        default: false
    },
    google_id: {
        type: String,
        default: null
    }
}, {
    timestamps: true // Kích hoạt tự động tạo trường createdAt và updatedAt
});

// Xuất model
export default mongoose.model('User', UserSchema);
