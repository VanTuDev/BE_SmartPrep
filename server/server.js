import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connect from './database/conn.js';

// Import các router
import questionRoutes from './router/question.routes.js';
import userRoutes from './router/user.routes.js';
import categoryRoutes from './router/Category.routes.js'
import testRoutes from './router/test.routes.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
connect();

app.use(cors());
app.use(express.json());

app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/test', testRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
