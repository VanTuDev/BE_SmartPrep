import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connect from './database/conn.js';

// Import các router
import questionRoutes from './router/question.routes.js';
import userRoutes from './router/user.routes.js';
import categoryRoutes from './router/Category.routes.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Kết nối với MongoDB
connect();

app.use(cors());
app.use(express.json());

// Sử dụng các router cho các module
app.use('/api/questions', questionRoutes); // Đường dẫn cho câu hỏi
app.use('/api/users', userRoutes);         // Đường dẫn cho người dùng
app.use('/api/category', categoryRoutes);  // Đường dẫn cho danh mục

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
