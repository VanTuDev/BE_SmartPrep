import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connect from './database/conn.js';
import { Server } from 'socket.io';

import questionRoutes from './router/question.routes.js';
import userRoutes from './router/user.routes.js';
import testRoutes from './router/test.routes.js';
import categoryRoutes from './router/category.routes.js';
import groupRoutes from './router/group.routes.js';
import classRoomRoutes from './router/classRoom.routes.js';
import submissionRoutes from './router/submission.routes.js';
import gradeRoutes from './router/grade.routes.js';
import instructorApplicationRoutes from './router/instructorApplication.routes.js'
import morgan from 'morgan';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server);
connect();

app.use(cors());
app.use(express.json());

app.use(morgan('combined')); // Hoặc 'dev' cho log đơn giản hơn
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));
// Tăng giới hạn kích thước body (nếu cần cho JSON hoặc form)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.use('/api/instructor/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/instructor/category', categoryRoutes);
app.use('/api/instructor/test', testRoutes);
app.use('/api/instructor/groups', groupRoutes);
app.use('/api/classrooms', classRoomRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/instructor/grades', gradeRoutes);
app.use('/api/access_instructor', instructorApplicationRoutes);

app.get('/', (req, res) => {
    res.send('API Server is running...');
});


app.use((req, res, next) => {
    const error = new Error("Không tìm thấy route này!");
    error.status = 404;
    next(error);
});


app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        error: {
            message: error.message || 'Đã xảy ra lỗi không xác định!',
        },
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



// Lắng nghe kết nối WebSocket
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Khi người dùng bắt đầu bài kiểm tra
    socket.on('start_test', (data) => {
        const { userId, testId } = data;
        console.log(`User ${userId} started test ${testId}`);
        // Gửi phản hồi ngay lập tức cho client
        socket.emit('test_started', { message: 'Bắt đầu bài kiểm tra thành công!' });
    });

    // Khi người dùng gửi câu trả lời
    socket.on('submit_answer', (data) => {
        const { submissionId, question, answer } = data;
        console.log(`User submitted answer for submission ${submissionId}:`, question, answer);
        // Lưu câu trả lời vào cơ sở dữ liệu hoặc bộ nhớ cache
        socket.emit('answer_submitted', { message: 'Câu trả lời đã được lưu thành công!' });
    });

    // Khi người dùng muốn khôi phục bài thi (resume)
    socket.on('resume_test', (data) => {
        const { submissionId } = data;
        console.log(`User wants to resume test ${submissionId}`);
        // Trả lại dữ liệu bài làm cho client
        socket.emit('test_resumed', { message: 'Khôi phục bài thi thành công!', submissionId });
    });

    // Khi người dùng hoàn thành bài kiểm tra
    socket.on('finish_test', (data) => {
        const { submissionId } = data;
        console.log(`User finished test ${submissionId}`);
        // Xử lý hoàn tất bài kiểm tra
        socket.emit('test_finished', { message: 'Bài kiểm tra đã được hoàn thành!' });
    });

    // Khi người dùng ngắt kết nối
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});