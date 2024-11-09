import mongoose from 'mongoose';
import TestModel from '../model/Test.model.js';
import QuestionModel from '../model/Question.model.js';
import SubmissionModel from '../model/Submission.model.js';
import ClassRoomModel from '../model/ClassRoom.model.js';
import logger from '../utils/logger.js';

// Middleware kiểm tra quyền Instructor
export function verifyInstructorRole(req, res, next) {
   try {
      const { role } = req.user;
      logger.info(`Xác thực quyền Instructor cho người dùng: ${role}`);
      if (role !== 'instructor') {
         logger.warn(`Người dùng không có quyền Instructor. Role: ${role}`);
         return res.status(403).json({ error: 'Chỉ có Instructor mới có quyền này!' });
      }
      next();
   } catch (error) {
      logger.error('Lỗi khi xác thực quyền Instructor:', error);
      res.status(500).json({ error: 'Lỗi khi xác thực quyền Instructor!' });
   }
}

export async function createTest(req, res) {
   try {
      console.log('Received Payload:', req.body); // Log payload for debugging

      const instructorId = req.user.userId || req.user._id;

      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
         return res.status(400).json({ error: 'Invalid instructor ID!' });
      }

      const {
         title,
         description,
         duration,
         start_date,
         end_date,
         questions,
         grade_id,
         category_id,
         group_id = null,
         classRoom_ids = []  // Đặt classRoom_ids là mảng
      } = req.body;

      // Validate required fields
      if (!title || !description || !duration || !start_date || !end_date || !questions || questions.length === 0) {
         return res.status(400).json({ error: 'Missing required fields!' });
      }

      // Kiểm tra các ID của lớp học
      const validatedClassRoomIds = classRoom_ids
         .filter(id => mongoose.Types.ObjectId.isValid(id))
         .map(id => mongoose.Types.ObjectId(id));

      // Process questions
      const questionIds = await processQuestions(questions, {
         grade_id,
         category_id,
         group_id,
         classRoom_ids: validatedClassRoomIds, // Đưa vào mảng ID lớp học
         instructorId
      });

      // Create a new Test instance
      const newTest = new TestModel({
         title,
         description,
         duration,
         start_date,
         end_date,
         questions_id: questionIds,
         grade_id: grade_id || null,
         category_id: category_id || null,
         group_id,
         classRoom_ids: validatedClassRoomIds, // Gán mảng các ID lớp học
         instructor: mongoose.Types.ObjectId(instructorId),
         status: 'published',
      });

      // Save to the database
      await newTest.save();
      res.status(201).json({ msg: 'Test created successfully!', test: newTest });
   } catch (error) {
      console.error('Error creating test:', error); // Log error for debugging
      res.status(500).json({ error: `Failed to create test: ${error.message}` });
   }
}



// Xử lý câu hỏi (kiểm tra ID hoặc tạo mới nếu cần)
async function processQuestions(questions, { grade_id, category_id, group_id, classRoom_id, instructorId }) {
   const questionIds = [];

   try {
      for (const question of questions) {
         let questionId;

         if (typeof question === 'string' && mongoose.Types.ObjectId.isValid(question)) {
            questionId = question;
         } else if (question.question_text && question.options) {
            const newQuestion = new QuestionModel({
               question_text: question.question_text,
               question_type: question.question_type,
               options: question.options,
               correct_answers: question.correct_answers,
               grade_id,
               category_id,
               group_id,
               classRoom_id,
               instructor: mongoose.Types.ObjectId(instructorId),
            });

            const savedQuestion = await newQuestion.save();
            console.log('Câu hỏi mới được thêm:', savedQuestion._id); // Log câu hỏi mới
            questionId = savedQuestion._id;
         } else {
            console.warn('Dữ liệu câu hỏi không hợp lệ:', question); // Log dữ liệu lỗi
            throw new Error('Câu hỏi không hợp lệ!');
         }

         questionIds.push(questionId);
      }
   } catch (error) {
      console.error('Lỗi trong quá trình xử lý câu hỏi:', error); // Log lỗi
      throw new Error('Không thể xử lý câu hỏi!');
   }

   return questionIds;
}



// Hàm kiểm tra và thêm câu hỏi vào DB nếu chưa tồn tại
async function getExistingOrAddQuestions(questions, testData) {
   const questionIds = [];
   logger.info('Dữ liệu bài kiểm tra được truyền vào:', testData);

   try {
      for (const question of questions) {
         // Tìm kiếm câu hỏi đã tồn tại trong DB
         let existingQuestion = await QuestionModel.findOne({
            question_text: question.question_text,
            question_type: question.question_type
         });

         if (existingQuestion) {
            logger.info('Câu hỏi đã tồn tại:', { questionId: existingQuestion._id });
            questionIds.push(existingQuestion._id); // Thêm ID câu hỏi đã tồn tại
         } else {
            // Nếu câu hỏi chưa tồn tại, tạo mới và gán thông tin từ bài kiểm tra
            const newQuestion = new QuestionModel({
               question_text: question.question_text,
               question_type: question.question_type,
               options: question.options,
               correct_answers: question.correct_answers,
               grade_id: testData.grade_id || null, // Lấy từ testData
               category_id: testData.category_id || null, // Lấy từ testData
               group_id: testData.group_id || null, // Lấy từ testData
               classRoom_id: testData.classRoom_id || [], // Lấy từ testData hoặc khởi tạo mảng trống
               instructor: testData.instructor, // Lấy instructor từ testData
            });

            // Lưu vào DB và log lại nếu thành công
            const savedQuestion = await newQuestion.save();
            logger.info('Câu hỏi mới được thêm:', { questionId: savedQuestion._id });
            questionIds.push(savedQuestion._id); // Thêm ID của câu hỏi mới
         }
      }

      logger.info('Danh sách câu hỏi ID:', questionIds); // Log danh sách ID câu hỏi
      return questionIds;

   } catch (error) {
      // Log chi tiết lỗi
      logger.error('Lỗi trong quá trình thêm hoặc tìm kiếm câu hỏi:', {
         message: error.message,
         stack: error.stack
      });
      throw new Error('Lỗi trong quá trình xử lý câu hỏi.');
   }
}

// Lấy tất cả bài kiểm tra
export async function getAllTestsByAdmin(req, res) {
   try {
      const tests = await TestModel.find();
      res.status(200).json(tests);
   } catch (error) {
      res.status(500).json({ error: "Lỗi khi lấy danh sách bai kiem tra!" });
   }
}


// Lấy tất cả bài kiểm tra của Instructor hiện tại
export async function getAllTests(req, res) {
   try {
      const tests = await TestModel.find({ instructor: req.user.userId }).populate('questions_id');
      logger.info('Lấy danh sách bài kiểm tra.', { instructor: req.user.userId });

      res.status(200).json(tests);
   } catch (error) {
      logger.error('Lỗi khi lấy danh sách bài kiểm tra:', { error });
      res.status(500).json({ error: 'Lỗi khi lấy danh sách bài kiểm tra!' });
   }
}

// Lấy bài kiểm tra theo ID
export async function getTestById(req, res) {
   const { id } = req.params;

   try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
         logger.warn('ID không hợp lệ.', { id });
         return res.status(400).json({ error: 'ID không hợp lệ!' });
      }

      const test = await TestModel.findById(id).populate('questions_id').lean();

      if (!test) {
         logger.warn('Không tìm thấy bài kiểm tra.', { testId: id });
         return res.status(404).json({ error: 'Test not found!' });
      }

      logger.info('Bài kiểm tra tìm thấy.', { test });
      res.status(200).json(test);
   } catch (error) {
      logger.error('Lỗi khi lấy bài kiểm tra:', { error });
      res.status(500).json({ error: 'Lỗi khi lấy bài kiểm tra!' });
   }
}

// Xóa bài kiểm tra
export async function deleteTest(req, res) {
   const { id } = req.params;

   try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
         logger.warn('ID không hợp lệ.', { id });
         return res.status(400).json({ error: 'ID không hợp lệ!' });
      }

      const test = await TestModel.findById(id);

      if (!test) {
         logger.warn('Không tìm thấy bài kiểm tra để xóa.', { testId: id });
         return res.status(404).json({ error: 'Test not found!' });
      }

      await test.remove();
      logger.info('Xóa bài kiểm tra thành công.', { testId: id });

      res.status(200).json({ msg: 'Xóa bài kiểm tra thành công!' });
   } catch (error) {
      logger.error('Lỗi khi xóa bài kiểm tra:', { error });
      res.status(500).json({ error: 'Lỗi khi xóa bài kiểm tra!' });
   }
}

// Lấy bài làm của bài kiểm tra theo ID bài kiểm tra
export const getSubmissionById = async (req, res) => {
   const { submissionId } = req.params;

   try {
      const submission = await SubmissionModel.findById(submissionId)
         .populate('learner', 'name')
         .populate('test_id', 'title')
         .populate({
            path: 'questions.question_id',
            model: 'Question',
            select: 'question_text options',
         });

      if (!submission) {
         logger.warn(`Không tìm thấy submission với ID: ${submissionId}`);
         return res.status(404).json({ error: 'Submission not found!' });
      }

      res.status(200).json(submission);
   } catch (error) {
      logger.error('Lỗi khi lấy submission:', error);
      res.status(500).json({ error: 'Lỗi khi lấy submission!' });
   }
};

// Controller function to get submissions by test_id
export const getSubmissionsByTestId = async (req, res) => {
   const { test_id } = req.params;

   try {
      const submissions = await SubmissionModel.find({ test_id: mongoose.Types.ObjectId(test_id) })
         .populate({ path:'learner', select:'fullname email'})
         .populate({ path: 'class_id', select: 'name' })
         .populate('test_id', 'title');

      if (!submissions || submissions.length === 0) {
         return res.status(404).json({ error: 'Submission not found!' });
      }

      res.status(200).json(submissions);
   } catch (error) {
      logger.error('Error retrieving submissions:', error);
      res.status(500).json({ error: 'Failed to retrieve submissions.' });
   }
};

// Cập nhật bài kiểm tra theo ID
export async function updateTest(req, res) {
   const { id } = req.params;

   try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
         logger.warn('ID không hợp lệ.', { id });
         return res.status(400).json({ error: 'ID không hợp lệ!' });
      }

      const {
         title,
         description,
         duration,
         start_date,
         end_date,
         status,
         questions,
         grade_id,
         category_id,
         group_id,
         classRoom_ids = [] // Đặt classRoom_ids là mảng
      } = req.body;

      // Lấy bài kiểm tra hiện tại từ DB
      const existingTest = await TestModel.findById(id);
      if (!existingTest) {
         logger.warn('Không tìm thấy bài kiểm tra để cập nhật.', { id });
         return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra!' });
      }

      // Xử lý các câu hỏi nếu có
      let updatedQuestionIds = existingTest.questions_id;
      if (questions && questions.length > 0) {
         const testData = {
            grade_id: grade_id || existingTest.grade_id,
            category_id: category_id || existingTest.category_id,
            group_id: group_id || existingTest.group_id,
            classRoom_ids: classRoom_ids || existingTest.classRoom_ids, // Mảng ID lớp học
            instructor: existingTest.instructor,
         };

         const questionIds = await getExistingOrAddQuestions(questions, testData);
         updatedQuestionIds = [...new Set([...existingTest.questions_id, ...questionIds])];
      }

      // Kiểm tra các ID của lớp học
      const validatedClassRoomIds = classRoom_ids
         .filter(id => mongoose.Types.ObjectId.isValid(id))
         .map(id => mongoose.Types.ObjectId(id));

      // Cập nhật các trường của bài kiểm tra
      existingTest.title = title || existingTest.title;
      existingTest.description = description || existingTest.description;
      existingTest.duration = duration || existingTest.duration;
      existingTest.start_date = start_date || existingTest.start_date;
      existingTest.end_date = end_date || existingTest.end_date;
      existingTest.status = status || existingTest.status;
      existingTest.grade_id = grade_id || existingTest.grade_id;
      existingTest.category_id = category_id || existingTest.category_id;
      existingTest.group_id = group_id || existingTest.group_id;
      existingTest.classRoom_ids = validatedClassRoomIds;
      existingTest.questions_id = updatedQuestionIds;

      await existingTest.save();
      res.status(200).json({ msg: 'Cập nhật bài kiểm tra thành công!', test: existingTest });
   } catch (error) {
      res.status(500).json({ error: 'Lỗi khi cập nhật bài kiểm tra!' });
   }
}

export async function getTestsByClassroom(req, res) {
   const { userId } = req.user; // Get the learner’s user ID from the authenticated request

   try {
      // Fetch classrooms where the user is enrolled as a learner
      const classrooms = await ClassRoomModel.find({ learners: userId });
      const classroomIds = classrooms.map(classroom => classroom._id);

      // Fetch tests that either have a matching classRoom_id or no classRoom_id (public tests), and exclude drafts
      const tests = await TestModel.find({
         $and: [
            {
               $or: [
                  { classRoom_id: { $in: classroomIds } },
                  { classRoom_id: null }
               ]
            },
            { status: { $ne: 'draft' } } // Exclude tests with status 'draft'
         ]
      });

      logger.info('Tests retrieved successfully for learner.', { userId, testsCount: tests.length });
      res.status(200).json(tests);
   } catch (error) {
      logger.error('Error retrieving tests by classroom:', error);
      res.status(500).json({ error: 'Failed to retrieve tests' });
   }
}

// Lấy tất cả các bài kiểm tra có trong lớp học dựa trên classRoom_id
export async function getTestsByClassRoomId(req, res) {
   const { classRoomId } = req.params;
   try {
      const tests = await TestModel.find({ classRoom_ids: classRoomId })
         .populate('questions_id')
         .populate('classRoom_ids');
      if (tests.length === 0) {
         return res.status(404).json({ message: 'No tests found for this classroom' });
      }
      res.status(200).json(tests);
   } catch (error) {
      console.error('Error fetching tests for classroom:', error);
      res.status(500).json({ error: 'Failed to fetch tests for this classroom' });
   }
}
