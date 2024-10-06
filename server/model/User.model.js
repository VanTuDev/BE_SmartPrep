import mongoose from 'mongoose';

// Define schema for users with timestamps
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
        select: false // Không lấy mật khẩu theo mặc định khi truy vấn
    },
    profile: {
        type: String,
        default: 'default-profile.jpg' // Đặt mặc định nếu không có
    },
    role: {
        type: String,
        enum: ['user', 'instructor', 'admin'], // Xác định các vai trò hợp lệ
        default: 'user'
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
    timestamps: true // Kích hoạt tự động `createdAt` và `updatedAt`
});

// Export model
export default mongoose.model('User', UserSchema);
