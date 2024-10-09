import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connect from './database/conn.js';


import questionRoutes from './router/question.routes.js';
import userRoutes from './router/user.routes.js';
import testRoutes from './router/test.routes.js';
import categoryRoutes from './router/Category.routes.js';
import groupRoutes from './router/group.routes.js';
import classRoomRoutes from './router/classRoom.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
connect();

app.use(cors());
app.use(express.json());


app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));


app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/test', testRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/classrooms', classRoomRoutes);


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
