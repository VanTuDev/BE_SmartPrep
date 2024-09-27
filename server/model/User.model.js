import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please provide unique Username"],
        unique: [true, "Username already exists"]
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
    },
    email: {
        type: String,
        required: [true, "Please provide a unique email"],
        unique: true,
    },
    fullname: {
        type: String,
        required: [true, "Please provide your full name"]
    },
    phone: {
        type: String,  // Dùng String để lưu số điện thoại để tránh vấn đề với số 0 ở đầu
        required: [true, "Please provide a phone number"]
    },
    address: {
        type: String
    },
    profile: {
        type: String
    },
    is_locked: {
        type: Boolean,
        default: false
    },
    google_id: {
        type: String
    },
    role: {
        type: String,
        default: 'user'
    }
});

export default mongoose.model('User', UserSchema);
