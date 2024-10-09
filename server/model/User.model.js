import mongoose from 'mongoose';

// Định nghĩa schema cho người dùng với các trường thời gian
const UserSchema = new mongoose.Schema({
    username: {
        type: String,           // Kiểu dữ liệu của trường
        required: true,        // Trường là bắt buộc
        unique: true,          // Tên người dùng phải là duy nhất
        trim: true             // Loại bỏ khoảng trắng ở đầu và cuối chuỗi
    },
    fullname: {
        type: String,           // Kiểu dữ liệu của trường
        required: true,        // Trường là bắt buộc
        trim: true             // Loại bỏ khoảng trắng ở đầu và cuối chuỗi
    },
    email: {
        type: String,           // Kiểu dữ liệu của trường
        required: true,        // Trường là bắt buộc
        unique: true,          // Email phải là duy nhất
        lowercase: true,       // Chuyển đổi email thành chữ thường
        trim: true             // Loại bỏ khoảng trắng ở đầu và cuối chuỗi
    },
    phone: {
        type: String,           // Kiểu dữ liệu của trường
        required: true,        // Trường là bắt buộc
        trim: true             // Loại bỏ khoảng trắng ở đầu và cuối chuỗi
    },
    password: {
        type: String,           // Kiểu dữ liệu của trường
        required: true,        // Trường là bắt buộc
        select: false           // Không bao gồm mật khẩu trong kết quả truy vấn mặc định
    },
    profile: {
        type: String,           // Kiểu dữ liệu của trường
        default: 'default-profile.jpg' // Đặt hình đại diện mặc định nếu không có
    },
    role: {
        type: String,           // Kiểu dữ liệu của trường
        enum: ['learner', 'instructor', 'admin'], // Định nghĩa các vai trò hợp lệ
        default: 'learner'        // Vai trò mặc định là 'learner'
    },

    is_locked: {
        type: Boolean,          // Kiểu dữ liệu của trường
        default: false          // Giá trị mặc định là false (người dùng không bị khóa)
    },
    google_id: {
        type: String,           // Kiểu dữ liệu của trường
        default: null           // Giá trị mặc định là null (không liên kết với tài khoản Google)
    }
}, {
    timestamps: true // Kích hoạt tự động tạo trường createdAt và updatedAt
});

// Xuất model
export default mongoose.model('User', UserSchema);
