import mongoose from 'mongoose'; // Nhập thư viện Mongoose để tương tác với MongoDB

// Định nghĩa Schema cho câu hỏi
const QuestionSchema = new mongoose.Schema({
   category: {
      type: mongoose.Schema.Types.ObjectId, // Kiểu dữ liệu là ObjectId
      ref: 'Category', // Tham chiếu đến mô hình Category
      required: false, // không bắt buộc phải có !!!!
   },
   group: {
      type: String, // Kiểu dữ liệu là chuỗi
      default: 'null', // Giá trị mặc định là 'null'
      required: false, // không bắt buộc phải có !!!!
   },
   test_id: {
      type: mongoose.Schema.Types.ObjectId, // Kiểu dữ liệu là ObjectId
      ref: 'Test', // Tham chiếu đến mô hình Test
      required: false, // không bắt buộc phải có !!!!
   },
   question_text: {
      type: String, // Kiểu dữ liệu là chuỗi
      required: [true, "Please provide the question text"], // Bắt buộc phải có, thông báo nếu không có
   },
   question_type: {
      type: String, // Kiểu dữ liệu là chuỗi
      enum: ['essay', 'multiple-choice', 'choice'], // Giá trị phải nằm trong danh sách này
      required: [false, "Please specify the question type"], // không bắt buộc phải có !!!!
   },
   options: {
      type: [String], // Kiểu dữ liệu là mảng chuỗi
      required: [true, "Please provide the options for the question"], // Bắt buộc phải có, thông báo nếu không có
   },
   correct_answers: {
      type: [String], // Kiểu dữ liệu là mảng chuỗi
      required: [true, "Please specify the correct answers"], // Bắt buộc phải có, thông báo nếu không có
   },
   created_by: {
      type: mongoose.Schema.Types.ObjectId, // Kiểu dữ liệu là ObjectId
      ref: 'User', // Tham chiếu đến mô hình User
      required: true, // Bắt buộc phải có
   },
   created_at: {
      type: Date, // Kiểu dữ liệu là ngày
      default: Date.now, // Giá trị mặc định là thời gian hiện tại
   },
   updated_at: {
      type: Date, // Kiểu dữ liệu là ngày
      default: Date.now, // Giá trị mặc định là thời gian hiện tại
   },
});

// Middleware để cập nhật thời gian trước khi lưu tài liệu
QuestionSchema.pre('save', function (next) {
   this.updated_at = Date.now(); // Cập nhật trường updated_at với thời gian hiện tại
   next(); // Tiếp tục với quá trình lưu
});

// Middleware để cập nhật thời gian trước khi tìm và cập nhật tài liệu
QuestionSchema.pre('findOneAndUpdate', function (next) {
   this._update.updated_at = Date.now(); // Cập nhật trường updated_at với thời gian hiện tại
   next(); // Tiếp tục với quá trình cập nhật
});

// Kiểm tra model đã tồn tại hay chưa
const QuestionModel = mongoose.models.Question || mongoose.model('Question', QuestionSchema); // Nếu đã có thì sử dụng, nếu chưa thì tạo mới

export default QuestionModel; // Xuất mô hình QuestionModel để sử dụng ở nơi khác
