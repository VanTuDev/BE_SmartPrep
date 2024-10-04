import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';  // Để xử lý __dirname
import cors from 'cors';

const app = express();

// Tạo __dirname trong ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());

app.post('/instructor/questions.json', (req, res) => {
    const questions = req.body;

    // Đường dẫn tới file questions.json
    const filePath = path.join(__dirname, 'instructor', 'questions.json');

    fs.writeFile(filePath, JSON.stringify(questions, null, 2), (err) => {
        if (err) {
            console.error('Lỗi khi ghi file: ', err);
            return res.status(500).send('Lưu câu hỏi thất bại.');
        }

        res.status(200).send('Lưu câu hỏi thành công!');
    });
});


// Đường dẫn mới để lấy câu hỏi
app.get('/instructor/questions.json', (req, res) => {
    const filePath = path.join(__dirname, 'instructor', 'questions.json');

    // Đọc file questions.json
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Lỗi khi đọc file: ', err);
            return res.status(500).send('Không thể đọc câu hỏi.');
        }

        try {
            const questions = JSON.parse(data);
            res.status(200).json(questions); // Gửi dữ liệu về client
        } catch (jsonError) {
            console.error('Lỗi khi phân tích JSON: ', jsonError);
            res.status(500).send('Lỗi khi phân tích dữ liệu.');
        }
    });
});

// Thêm endpoint cho việc xóa câu hỏi
app.delete('/instructor/questions.json', (req, res) => {
    const index = req.params.index;

    const filePath = path.join(__dirname, 'instructor', 'questions.json');

    // Đọc file questions.json
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Lỗi khi đọc file: ', err);
            return res.status(500).send('Không thể đọc câu hỏi.');
        }

        try {
            const questions = JSON.parse(data);
            questions.splice(index, 1); // Xóa câu hỏi theo index

            // Ghi lại file questions.json
            fs.writeFile(filePath, JSON.stringify(questions, null, 2), (err) => {
                if (err) {
                    console.error('Lỗi khi ghi file: ', err);
                    return res.status(500).send('Lưu câu hỏi thất bại.');
                }

                res.status(200).send('Xóa câu hỏi thành công!');
            });
        } catch (jsonError) {
            console.error('Lỗi khi phân tích JSON: ', jsonError);
            res.status(500).send('Lỗi khi phân tích dữ liệu.');
        }
    });
});

// Thêm endpoint cho việc cập nhật câu hỏi
app.put('/instructor/questions.json/:index', (req, res) => {
    const index = req.params.index;
    const updatedQuestion = req.body; // Câu hỏi mới

    const filePath = path.join(__dirname, 'instructor', 'questions.json');

    // Đọc file questions.json
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Lỗi khi đọc file: ', err);
            return res.status(500).send('Không thể đọc câu hỏi.');
        }

        try {
            const questions = JSON.parse(data);
            questions[index] = updatedQuestion; // Cập nhật câu hỏi tại index

            // Ghi lại file questions.json
            fs.writeFile(filePath, JSON.stringify(questions, null, 2), (err) => {
                if (err) {
                    console.error('Lỗi khi ghi file: ', err);
                    return res.status(500).send('Lưu câu hỏi thất bại.');
                }

                res.status(200).send('Cập nhật câu hỏi thành công!');
            });
        } catch (jsonError) {
            console.error('Lỗi khi phân tích JSON: ', jsonError);
            res.status(500).send('Lỗi khi phân tích dữ liệu.');
        }
    });
});


// Khởi động server
app.listen(5000, () => {
    console.log('Server đang chạy trên cổng 5000');
});
