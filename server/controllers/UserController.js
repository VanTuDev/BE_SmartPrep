import UserModel from '../model/User.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Xác thực người dùng bằng email hoặc username
export async function verifyUser(req, res, next) {
    try {
        const { identifier } = req.method === "GET" ? req.query : req.body;
        console.log("Đang xác thực người dùng với identifier:", identifier);

        const user = await UserModel.findOne({ $or: [{ username: identifier }, { email: identifier }] });
        if (!user) {
            console.log("Không tìm thấy người dùng với identifier:", identifier);
            return res.status(404).send({ error: "Không tìm thấy người dùng!" });
        }

        console.log("Người dùng đã được tìm thấy:", user);
        req.user = user;
        next();
    } catch (error) {
        console.error("Lỗi xác thực người dùng:", error);
        return res.status(500).send({ error: "Lỗi xác thực người dùng" });
    }
}

// Đăng ký người dùng mới
export async function register(req, res) {
    try {
        const { username, fullname, email, phone, password, role } = req.body;
        console.log("Đăng ký người dùng mới với thông tin:", req.body);

        // Kiểm tra username hoặc email đã tồn tại chưa
        const existUser = await UserModel.findOne({ $or: [{ username }, { email }] });
        if (existUser) {
            console.log("Tên đăng nhập hoặc Email đã tồn tại:", existUser);
            return res.status(400).json({ error: "Tên đăng nhập hoặc Email đã tồn tại!" });
        }

        // Mã hóa mật khẩu và tạo người dùng mới
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserModel({ username, fullname, email, phone, password: hashedPassword, role: role || 'user' });
        await newUser.save();

        console.log("Người dùng mới đã được tạo:", newUser);
        res.status(201).json({ msg: "Đăng ký thành công!" });
    } catch (error) {
        console.error("Lỗi khi đăng ký người dùng:", error);
        res.status(500).json({ error: "Lỗi khi đăng ký người dùng!" });
    }
}

// Đăng nhập người dùng

export async function login(req, res) {
    try {
        const { identifier, password } = req.body;
        // Bao gồm trường `password` trong truy vấn
        const user = await UserModel.findOne({ $or: [{ username: identifier }, { email: identifier }] }).select('+password');

        if (!user) return res.status(404).json({ error: "Tên đăng nhập hoặc Email không tồn tại!" });

        // Kiểm tra mật khẩu
        const passwordCheck = await bcrypt.compare(password, user.password);
        if (!passwordCheck) return res.status(400).json({ error: "Mật khẩu không đúng!" });

        // Tạo token JWT
        const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });
        res.status(200).json({ msg: "Đăng nhập thành công!", token });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({ error: "Lỗi đăng nhập!" });
    }
}
// Lấy tất cả người dùng (Chỉ dành cho Admin)
export async function getAllUsers(req, res) {
    try {
        console.log("User Role:", req.user.role); // Log để kiểm tra role trong console
        // Chỉ admin mới có quyền truy cập
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Bạn không có quyền truy cập danh sách người dùng!" });

        const users = await UserModel.find({}, '-password'); // Trả về tất cả người dùng, loại bỏ trường password
        console.log("Tất cả người dùng:", users); // Log danh sách người dùng
        res.status(200).json(users);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách người dùng:", error); // Log lỗi
        res.status(500).json({ error: "Lỗi khi lấy danh sách người dùng!" });
    }
}

// Lấy thông tin người dùng theo ID
export async function getUserById(req, res) {
    const { id } = req.params;
    console.log("Đang tìm người dùng theo ID:", id);
    try {
        const user = await UserModel.findById(id).select('-password');
        if (!user) {
            console.log("Không tìm thấy người dùng với ID:", id);
            return res.status(404).json({ error: "Không tìm thấy người dùng!" });
        }

        console.log("Thông tin người dùng tìm thấy:", user);
        res.status(200).json(user);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        res.status(500).json({ error: "Lỗi khi lấy thông tin người dùng!" });
    }
}

// Lấy thông tin người dùng theo username
export async function getUser(req, res) {
    const { username } = req.params;
    console.log("Request username:", username);
    try {
        if (!username) return res.status(400).send({ error: "Tên đăng nhập không hợp lệ" });

        const user = await UserModel.findOne({ username }).select('-password');
        if (!user) {
            console.log("Không tìm thấy người dùng với username:", username);
            return res.status(404).send({ error: "Không tìm thấy người dùng!" });
        }

        console.log("Thông tin người dùng đã tìm thấy:", user);
        return res.status(200).json(user);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        return res.status(500).send({ error: "Lỗi khi lấy thông tin người dùng!" });
    }
}

// Cập nhật thông tin người dùng
export async function updateUser(req, res) {
    try {
        const { userId } = req.user;
        console.log("Đang cập nhật thông tin người dùng với ID:", userId);
        if (!userId) return res.status(401).send({ error: "Không tìm thấy người dùng!" });

        const body = req.body;
        const updatedUser = await UserModel.findByIdAndUpdate(userId, body, { new: true });
        if (!updatedUser) return res.status(404).send({ error: "Không thể cập nhật thông tin người dùng." });

        console.log("Thông tin người dùng đã được cập nhật:", updatedUser);
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Lỗi khi cập nhật thông tin người dùng:", error);
        res.status(500).json({ error: "Lỗi khi cập nhật thông tin người dùng!" });
    }
}

// Xóa người dùng (Chỉ dành cho Admin)
export async function deleteUser(req, res) {
    try {
        if (req.user.role !== 'admin') {
            console.log("Người dùng không có quyền admin:", req.user);
            return res.status(403).json({ error: "Bạn không có quyền xóa người dùng!" });
        }

        const { id } = req.params;
        console.log("Đang xóa người dùng với ID:", id);
        await UserModel.findByIdAndDelete(id);
        res.status(200).json({ msg: "Xóa người dùng thành công!" });
    } catch (error) {
        console.error("Lỗi khi xóa người dùng:", error);
        res.status(500).json({ error: "Lỗi khi xóa người dùng!" });
    }
}
