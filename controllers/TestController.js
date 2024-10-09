import TestModel from '../model/Test.model.js';
import QuestionModel from '../model/Question.model.js';
import CategoryModel from '../model/Category.model.js';
import UserModel from '../model/User.model.js';


// Middleware để kiểm tra quyền của Instructor
export function verifyInstructorRole(req, res, next) {
   const { role } = req.user;
   console.log("Xác thực quyền Instructor:", role); // Log quyền của người dùng hiện tại
   if (role !== 'instructor') {
      console.log("Người dùng không có quyền Instructor."); // Log khi không có quyền
      return res.status(403).json({ error: "Chỉ có Instructor mới có quyền này!" });
   }
   next();
}

// export async function createTest(req, res) {
//    try {
//       const newTest = new TestModel(req.body)
//       await newTest.save();
//       res.status(201).json(newTest);
//       // res.status(200).json({ msg: "tạo bài kiểm tra thành công!" });
//    } catch (error) {
//       console.error("Lỗi khi tạo bài kiểm tra:", error);
//       res.status(500).json({ error: "Lỗi khi tạo bài kiểm tra!" });
//    }
// }

export async function getAllTest(req, res) {
   try {
      // const tests = await TestModel.find({ instructor_id: req.user.userId });
      const tests = await TestModel.find();
      console.log("Danh sách bài thi:", tests);
      res.status(200).json(tests);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách bài kiểm tra:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách bài kiểm tra!" });
   }
}

// export async function getTestById(req, res) {
//    try {
//       console.log("Request ID:", req.params.id); // Log ID của câu hỏi được yêu cầu
//       const test = await TestModel.findById(req.params.id).populate('questions.question_id');

//       // // Kiểm tra quyền truy cập
//       // if (!question || question.created_by.toString() !== req.user.userId) {
//       //    console.log("Bạn không có quyền truy cập câu hỏi này hoặc câu hỏi không tồn tại."); // Log nếu không có quyền truy cập
//       //    return res.status(403).json({ error: "Bạn không có quyền truy cập câu hỏi này!" });
//       // }

//       console.log("Test tìm thấy:", test); // Log câu hỏi tìm được
//       res.status(200).json(test);
//    } catch (error) {
//       console.error("Lỗi khi lấy câu hỏi:", error); // Log lỗi khi lấy câu hỏi
//       res.status(500).json({ error: "Lỗi khi lấy câu hỏi!" });
//    }
// }
export async function getTestById(req, res) {
   try {
      console.log("Request ID:", req.params.id); // Log ID của câu hỏi được yêu cầu
      const test = await TestModel.findById(req.params.id).populate('questions.question_id').lean();

      if (!test) {
         return res.status(404).json({ error: "Test not found!" });
      }

      // Chuyển đổi định dạng câu hỏi
      test.questions = test.questions.map(q => ({
         id: q.question_id._id,
         question_text: q.question_id.question_text,
         question_type: q.question_id.question_type,
         options: q.question_id.options,
         correct_answers: q.question_id.correct_answers,
      }));

      console.log("Test tìm thấy:", test); // Log câu hỏi tìm được
      res.status(200).json(test);
   } catch (error) {
      console.error("Lỗi khi lấy câu hỏi:", error); // Log lỗi khi lấy câu hỏi
      res.status(500).json({ error: "Lỗi khi lấy câu hỏi!" });
   }
}

export async function updateTest(req, res) {
   try {
      console.log("Request ID để cập nhật:", req.params.id); // Log ID của câu hỏi cần cập nhật
      const test = await TestModel.findById(req.params.id);

      // // Kiểm tra quyền cập nhật
      // if (!test || test.created_by.toString() !== req.user.userId) {
      //    console.log("Bạn không có quyền cập nhật câu hỏi này hoặc câu hỏi không tồn tại."); // Log nếu không có quyền cập nhật
      //    return res.status(403).json({ error: "Bạn không có quyền cập nhật câu hỏi này!" });
      // }

      Object.assign(test, req.body);
      await test.save();
      console.log("Test đã được cập nhật:", test); // Log câu hỏi đã cập nhật thành công
      res.status(200).json({ msg: "cập nhật bài kiểm tra thành công!", test: test });
   } catch (error) {
      console.error("Lỗi khi cập nhật bài kiểm tra:", error);
      return res.status(500).json({ error: "Lỗi khi cập nhật bài kiểm tra" });
   }
}

export async function deleteTest(req, res) {
   try {
      console.log("Request ID để xóa:", req.params.id); // Log ID của test cần xóa
      const test = await TestModel.findById(req.params.id);

      // // Kiểm tra quyền xóa
      // if (!test || test.created_by.toString() !== req.user.userId) {
      //    console.log("Bạn không có quyền xóa test này hoặc test không tồn tại."); // Log nếu không có quyền xóa
      //    return res.status(403).json({ error: "Bạn không có quyền xóa test này!" });
      // }

      await test.remove();
      console.log("Xóa test thành công với ID:", req.params.id); // Log khi xóa thành công
      res.status(200).json({ msg: "Xóa test thành công!" });
   } catch (error) {
      console.error("Lỗi khi xóa bài kiểm tra:", error);
      res.status(500).json({ error: "Lỗi khi xóa bài kiểm tra!" });
   }
}

export async function createExamWithQuestions(req, res) {
   try {
      const examData = req.body.exam;
      console.log(JSON.stringify(req.body, null, 2));
      const { questions, ...restExamData } = examData;

      // Tạo từng câu hỏi và lưu lại _id
      const questionIds = [];
      for (const questionData of questions) {
         const newQuestion = new QuestionModel({
            question_text: questionData.question_text,
            question_type: questionData.question_type,
            options: questionData.options,
            correct_answers: questionData.correct_answers,
            created_by: req.user.userId // Liên kết câu hỏi với người tạo
         });

         // Lưu câu hỏi vào DB và lấy _id
         const savedQuestion = await newQuestion.save();
         questionIds.push({ question_id: savedQuestion._id });
      }

      // Tạo bài kiểm tra với danh sách câu hỏi (questionIds)
      const newTest = new TestModel({
         ...restExamData, // Thông tin khác của bài kiểm tra
         questions: questionIds, // Gán _id của các câu hỏi vào mảng questions
         user_id: req.user.userId
      });
      
      await newTest.save();
      res.status(201).json(newTest);
   } catch (error) {
      console.error('Error creating exam with questions:', error);
      throw new Error('Unable to create exam with questions.');
   }
}

// Hàm để tạo bài kiểm tra với câu hỏi bốc ngẫu nhiên
export async function createTestWithRandomQuestions(req, res) {
   try {
      const { title, description, duration, access_type, start_date, end_date, time_do, invite_users, access_link } = req.body;

      // Kiểm tra các trường bắt buộc
      if (!title || !description || !duration || !start_date || !end_date || !time_do || !access_link) {
         return res.status(400).json({ error: "Vui lòng cung cấp đầy đủ thông tin!" });
      }

      // Bốc ngẫu nhiên câu hỏi từ thư viện câu hỏi
      const allQuestions = await QuestionModel.find({}); // Lấy tất cả câu hỏi
      const randomQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 5); // Lấy 5 câu hỏi ngẫu nhiên

      // Tạo bài kiểm tra mới
      const newTest = new TestModel({
         title,
         description,
         user_id: req.user.userId, // ID của instructor
         questions: randomQuestions.map(q => ({ question_id: q._id })), // Lưu ID của câu hỏi
         duration,
         access_type,
         start_date,
         end_date,
         time_do,
         invite_users,
         access_link,
         status: 'published' // Hoặc 'draft' tùy theo nhu cầu
      });

      await newTest.save(); // Lưu bài kiểm tra vào cơ sở dữ liệu
      res.status(201).json({ msg: "Bài kiểm tra đã được tạo thành công!", test: newTest });
   } catch (error) {
      console.error("Lỗi khi tạo bài kiểm tra:", error);
      res.status(500).json({ error: "Lỗi khi tạo bài kiểm tra!" });
   }
}