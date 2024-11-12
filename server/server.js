import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connect from './database/conn.js';
import { Server } from 'socket.io';

import jwt from 'jsonwebtoken';

import questionRoutes from './router/question.routes.js';
import userRoutes from './router/user.routes.js';
import testRoutes from './router/test.routes.js';
import categoryRoutes from './router/category.routes.js';
import groupRoutes from './router/group.routes.js';
import classRoomRoutes from './router/classRoom.routes.js';
import submissionRoutes from './router/submission.routes.js';
import gradeRoutes from './router/grade.routes.js';
import commentRoutes from './router/comment.routes.js';
import aiRoutes from './router/aiService.routes.js'

import instructorApplicationRoutes from './router/instructorApplication.routes.js';
import messageRoutes from './router/message.routes.js';
import adminRoutes from './router/admin.routes.js'
import roomRoutes from './router/videoChat.routes.js'

import morgan from 'morgan';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server);

connect();

let socketsConected = new Set()

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
app.use('/api', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ai_generate', aiRoutes);

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


server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Xác thực người dùng từ token khi kết nối WebSocket
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Xác thực thất bại!'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Token không hợp lệ!'));
        }
        socket.user = decoded; // Lưu thông tin người dùng vào socket
        next();
    });
});

io.on('connection', onConnected)

function onConnected(socket) {
    console.log('Socket connected', socket.id)
    socketsConected.add(socket.id)
    io.emit('clients-total', socketsConected.size)
  
    socket.on('disconnect', () => {
      console.log('Socket disconnected', socket.id)
      socketsConected.delete(socket.id)
      io.emit('clients-total', socketsConected.size)
    })
  
    socket.on('message', (data) => {
      // console.log(data)
      socket.broadcast.emit('chat-message', data)
    })
  
    socket.on('feedback', (data) => {
      socket.broadcast.emit('feedback', data)
    })
  }
  

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

    socket.on('joinClass', async ({ classId }) => {
        socket.join(classId);
        console.log(`User ${socket.user.username} joined class ${classId}`);

        // Lấy tin nhắn cũ từ database và gửi lại cho client
        try {
            const messages = await MessageModel.find({ classId }).populate('sender', 'username');
            socket.emit('loadMessages', messages);
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
        }
    });

    socket.on('message', async ({ classId, message }) => {
        console.log(`Nhận tin nhắn: ${message} từ ${socket.user.username}`);

        // Lưu tin nhắn vào cơ sở dữ liệu
        const newMessage = new MessageModel({
            classId,
            sender: socket.user.userId,
            message,
            timestamp: new Date()
        });

        try {
            await newMessage.save();
            console.log('Tin nhắn đã lưu:', newMessage);

            // Phát tin nhắn cho tất cả thành viên trong lớp
            io.to(classId).emit('message', {
                sender: { username: socket.user.username },
                message: newMessage.message,
                timestamp: newMessage.timestamp
            });
        } catch (error) {
            console.error('Lỗi khi lưu tin nhắn:', error);
        }
    });
    
    // Khi người dùng ngắt kết nối
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});