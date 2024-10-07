import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connect from './database/conn.js';

// Import các router
import questionRoutes from './router/question.routes.js';
import userRoutes from './router/user.routes.js';
import categoryRoutes from './router/Category.routes.js';
import groupRoutes from './router/group.routes.js'; // Nhập router cho nhóm
// import testRoutes from './router/test.routes';

dotenv.config(); // Load các biến môi trường từ file .env

const app = express();
const PORT = process.env.PORT || 5000; // Lấy cổng từ biến môi trường hoặc mặc định là 5000
connect(); // Kết nối tới cơ sở dữ liệu

app.use(cors()); // Sử dụng cors để cho phép truy cập từ các nguồn khác nhau
app.use(express.json()); // Sử dụng middleware để parse JSON

// Định nghĩa các route cho API
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/groups', groupRoutes); // Thêm router cho nhóm
// app.use('/api/test', testRoutes); // Có thể thêm route cho bài kiểm tra nếu cần

// Lắng nghe trên cổng đã định
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
