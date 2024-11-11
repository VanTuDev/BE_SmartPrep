import UserModel from "../model/User.model.js";
import InstructorApplicationModel from "../model/InstructorApplication.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer"// Xác thực người dùng bằng email hoặc username
export async function verifyUser(req, res, next) {
  try {
    const { identifier } = req.method === "GET" ? req.query : req.body;
    console.log("Đang xác thực người dùng với identifier:", identifier);

    const user = await UserModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });
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
    const cv = req.file ? req.file.filename : null;

    console.log('Đăng ký người dùng mới:', req.body);

    // Check if username or email already exists
    const existUser = await UserModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existUser) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc Email đã tồn tại!' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with `is_locked: true` for instructors
    const newUser = new UserModel({
      username,
      fullname,
      email,
      phone,
      password: hashedPassword,
      role: role || 'learner',
      cv: role === 'instructor' ? cv : null, // Only store CV for instructors
      is_locked: role === 'instructor', // Lock instructor accounts
    });

    await newUser.save();

    res.status(201).json({ msg: 'Đăng ký thành công! Tài khoản của bạn đang chờ phê duyệt.' });
  } catch (error) {
    console.error('Lỗi khi đăng ký người dùng:', error);
    res.status(500).json({ error: 'Lỗi khi đăng ký người dùng!' });
  }
}

//Resend verification
export async function resendVerificationEmail(req, res) {
  const { identifier } = req.body; // Get identifier from request body

  try {
    // Find user by email or username
    const user = await UserModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại!' });
    }

    if (!user.is_locked) {
      return res.status(400).json({ error: 'Tài khoản đã được xác thực!' });
    }

    const token = generateVerifyToken(user._id); // Generate a verification token

    // Construct the verification link
    const verifyLink = `http://localhost:3000/verify?token=${token}`;
    const subject = 'Xác thực người dùng';

    const html = `
      <h3>Xin chào, ${user.fullname}!</h3>
      <p>Vui lòng nhấp vào liên kết bên dưới để xác thực tài khoản của bạn:</p>
      <a href="${verifyLink}" style="display: inline-block; margin: 10px 0; padding: 10px 20px; color: white; background-color: #4CAF50; text-decoration: none;">Xác thực tài khoản</a>
      <p>Nếu bạn không yêu cầu đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
      <p><strong>Chú ý:</strong> Liên kết này sẽ hết hạn sau 5 phút.</p>
    `;

    // Send the verification email
    await sendVerifyToken(user.email, subject, html);

    res.status(200).json({ msg: 'Email xác thực đã được gửi lại!' });
  } catch (error) {
    console.error('Lỗi khi gửi lại email:', error);
    res.status(500).json({ error: 'Không thể gửi lại email.' });
  }
}


//Verify user
export async function verifyNewUser(req, res) {
  const { token } = req.body; // Extract token from the request body

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET); // Verify token

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại!' });
    }

    if (!user.is_locked) {
      return res.status(400).json({ msg: 'Tài khoản của bạn đã được xác thực!' });
    }

    user.is_locked = false;
    await user.save();

    res.status(200).json({ msg: 'Tài khoản của bạn đã được xác thực và kích hoạt thành công!' });
  } catch (error) {
    console.error('Lỗi khi xác thực người dùng:', error);
    res.status(400).json({ error: 'Liên kết xác thực không hợp lệ hoặc đã hết hạn!' });
  }
}

// User login
export async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    console.log("Đang đăng nhập với identifier:", identifier);

    // Find user by username or email
    const user = await UserModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    }).select("+password");

    if (!user) {
      return res.status(404).json({ error: "Tên đăng nhập hoặc Email không tồn tại!" });
    }

    // Check if the account is locked
    if (user.is_locked) {
      return res.status(403).json({ error: "Tài khoản của bạn chưa được xét duyệt, hãy kiểm tra hòm thư của bạn." });
    }

    // Verify password
    const passwordCheck = await bcrypt.compare(password, user.password);
    if (!passwordCheck) {
      return res.status(400).json({ error: "Mật khẩu không đúng!" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("Người dùng đã đăng nhập:", {
      _id: user._id,
      username: user.username,
      role: user.role,
    });

    return res.status(200).json({
      msg: "Đăng nhập thành công!",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        fullname: user.fullname,
        role: user.role,
        is_locked: user.is_locked,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    res.status(500).json({ error: "Lỗi khi đăng nhập!" });
  }
}

export async function ggLogin(req, res) {
  try {
    const { username, fullname, email, google_id, role, profile } = req.body;

    console.log("Đang đăng nhập với email:", email);

    // Tìm kiếm người dùng theo email (vì email là duy nhất)
    let user = await UserModel.findOne({ email });

    // Nếu không có, tạo người dùng mới
    if (!user) {
      user = new UserModel({
        username,
        fullname,
        email,
        role: role || 'learner',
        profile: profile,
        google_id, // Lưu Google ID để phân biệt
      });

      await user.save();
      console.log("Người dùng mới đã được tạo:", user);
    }

    // Kiểm tra nếu tài khoản bị khóa
    if (user.is_locked) {
      return res.status(403).json({
        error: "Tài khoản của bạn chưa được xét duyệt, hãy đợi trong giây lát.",
      });
    }

    // Tạo token JWT cho người dùng
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("Người dùng đã đăng nhập:", { _id: user._id, role: user.role });

    return res.status(200).json({
      msg: "Đăng nhập thành công!",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    res.status(500).json({ error: "Lỗi khi đăng nhập!" });
  }
}

// Forgot PW
export async function forgotPW(req, res) {
  try {
    const { identifier } = req.body; // Lấy identifier từ body
    console.log("Identifier nhận được:", identifier);

    // Tìm người dùng bằng username hoặc email
    const user = await UserModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) {
      console.log("Tên đăng nhập hoặc Email không tồn tại!");
      return res
        .status(404)
        .json({ error: "Tên đăng nhập hoặc Email không tồn tại!" });
    }

    // Ghi log thông tin người dùng
    console.log("Thông tin người dùng đã đăng nhập:", {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });

    const token = generateVerifyToken(user._id); // Tạo token
    const resetLink = `http://localhost:3000/reset-password?token=${token}`; // Link reset password

    const subject = 'Reset mật khẩu'

    const html = `
        <h3>Xin chào,</h3>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấp vào liên kết bên dưới để tiến hành đặt lại:</p>
        <a href="${resetLink}" style="display: inline-block; margin: 10px 0; padding: 10px 20px; color: white; background-color: #4CAF50; text-decoration: none;">Đặt lại mật khẩu</a>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <p><strong>Chú ý:</strong> Liên kết sẽ hết hạn sau 5 phút.</p>
      `

    await sendVerifyToken(user.email, subject, html); // Gửi email

    // Trả về status OK
    return res.status(200).json({ message: "Người dùng đã được tìm thấy!" });
  } catch (error) {
    console.error("Sai email, Tên đăng nhập hoặc không tồn tại!!", error);
    return res.status(500).json({ error: "Đã xảy ra lỗi máy chủ!" });
  }
}

// Reset PW
export async function resetPW(req, res) {
  const { token, newPassword } = req.body;

  try {
    const secretKey = process.env.JWT_SECRET; // Phải khớp với secret khi tạo token
    const decoded = jwt.verify(token, secretKey); // Giải mã token
    console.log(token, newPassword);

    const userId = decoded.userId;
    console.log(userId);

    // Cập nhật mật khẩu mới cho người dùng
    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }
    console.log(user);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword; // Nhớ hash mật khẩu mới trước khi lưu
    await user.save();

    res.status(200).json({ message: 'Mật khẩu đã được đặt lại thành công!' });
  } catch (error) {
    console.error('Lỗi khi xác thực token:', error);
    res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}



// Lấy tất cả người dùng (Chỉ dành cho Admin)
export async function getAllUsers(req, res) {
  try {
    console.log("User Role:", req.user.role); // Log để kiểm tra role trong console
    // Chỉ admin mới có quyền truy cập
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ error: "Bạn không có quyền truy cập danh sách người dùng!" });

    const users = await UserModel.find({}, "-password"); // Trả về tất cả người dùng, loại bỏ trường password
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
    const user = await UserModel.findById(id).select("-password");
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
    if (!username)
      return res.status(400).send({ error: "Tên đăng nhập không hợp lệ" });

    const user = await UserModel.findOne({ username }).select("-password");
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
// Cập nhật thông tin người dùng
// controllers/UserController.js
// Cập nhật thông tin người dùng và hỗ trợ cập nhật ảnh đại diện
export async function updateUser(req, res) {
  try {
    const { userId } = req.user; // Kiểm tra userId từ middleware Auth
    console.log("Đang cập nhật thông tin người dùng với ID:", userId);
    if (!userId)
      return res.status(401).send({ error: "Không tìm thấy người dùng!" });

    const body = req.body;
    console.log("Thông tin cập nhật nhận được:", body);

    // Kiểm tra xem có hình ảnh được tải lên hay không
    if (req.file) {
      body.profile = req.file.filename; // Gán tên tệp vào trường profile trong body
    }

    // Cập nhật thông tin người dùng
    const updatedUser = await UserModel.findByIdAndUpdate(userId, body, {
      new: true,
    });
    if (!updatedUser)
      return res
        .status(404)
        .send({ error: "Không thể cập nhật thông tin người dùng." });

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
    if (req.user.role !== "admin") {
      console.log("Người dùng không có quyền admin:", req.user);
      return res
        .status(403)
        .json({ error: "Bạn không có quyền xóa người dùng!" });
    }

    const { id } = req.params;

    await InstructorApplicationModel.deleteMany({ teacher: id });
    console.log("Đã xóa tất cả đơn ứng tuyển liên quan đến người dùng:", id);

    console.log("Đang xóa người dùng với ID:", id);
    await UserModel.findByIdAndDelete(id);
    res.status(200).json({ msg: "Xóa người dùng thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa người dùng:", error);
    res.status(500).json({ error: "Lỗi khi xóa người dùng!" });
  }
}

// UserController.js
// controllers/UserController.js

// Lấy thông tin hồ sơ người dùng
export async function getUserProfile(req, res) {
  try {
    const { userId } = req.user;
    console.log("Đang lấy thông tin người dùng với userId:", userId);

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy thông tin người dùng!" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin hồ sơ:", error);
    return res.status(500).json({ error: "Lỗi khi lấy thông tin hồ sơ!" });
  }
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "Wapvip0922@gmail.com", // Email của bạn
    pass: "edmj trvx chgd yvov", // Mật khẩu ứng dụng từ Gmail
  },
});

// Hàm tạo token JWT
const generateVerifyToken = (userId) => {
  const secretKey = process.env.JWT_SECRET; // Thay bằng secret của bạn
  const expiresIn = "5m"; // Token có hiệu lực trong 5 phút
  // Tạo token với payload là userId
  return jwt.sign({ userId }, secretKey, { expiresIn });
};

// Hàm gửi email xác thực
async function sendVerifyToken(userEmail, subject, html) {

  const mailOptions = {
    from: '"Nine Quiz" <your-email@gmail.com>', // Tên hiển thị và email gửi
    to: userEmail, // Email người nhận
    subject: subject,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions); // Gửi email
    console.log("Email xác thực đã được gửi thành công!");
  } catch (error) {
    console.error("Lỗi khi gửi email xác thực:", error);
    throw new Error("Không thể gửi email xác thực. Vui lòng thử lại.");
  }
}


// ADMIN CONTROLLER

// Get all leaner
export async function getUserByRole(req, res) {
  try {
    const role = req.params.role;
    // Chỉ admin mới có quyền truy cập
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Bạn không có quyền truy cập danh sách người dùng!" });

    const users = await UserModel.find({ role: role }, '-password'); // Trả về tất cả người dùng, loại bỏ trường password
    console.log("Tất cả người dùng:", users); // Log danh sách người dùng
    res.status(200).json(users);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error); // Log lỗi
    res.status(500).json({ error: "Lỗi khi lấy danh sách người dùng!" });
  }
}


// Unlock an instructor account (Admin only)
export async function unlockInstructor(req, res) {
  try {
    const { id } = req.params;

    // Only admins can unlock instructors
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này!' });
    }

    const user = await UserModel.findById(id);
    if (!user || user.role !== 'instructor') {
      return res.status(404).json({ error: 'Không tìm thấy người dùng hoặc người dùng không phải là instructor.' });
    }

    user.is_locked = false; // Unlock the account
    await user.save();

    res.status(200).json({ msg: 'Tài khoản đã được mở khóa thành công!' });
  } catch (error) {
    console.error('Lỗi khi mở khóa tài khoản:', error);
    res.status(500).json({ error: 'Lỗi khi mở khóa tài khoản!' });
  }
}

// Lấy toàn bộ người dùng là learner
export async function getAllLearner(req, res) {
  try {
      const learners = await UserModel.find({ role: 'learner' }, '-password');
      res.status(200).json(learners);
  } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng là learner:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách người dùng là learner!" });
  }
} 