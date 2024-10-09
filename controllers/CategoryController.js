import CategoryModel from '../model/Category.model.js';
import QuestionModel from '../model/Question.model.js';

// Tạo danh mục mới
export async function createCategory(req, res) {
   try {
      // Kiểm tra xem người dùng có phải là instructor không
      if (req.user.role !== 'instructor') {
         return res.status(403).json({ error: "Chỉ có giảng viên mới có thể tạo danh mục." });
      }

      console.log("Request Body:", req.body);
      const newCategory = new CategoryModel({
         ...req.body,
         created_by: req.user.userId, // Lưu thông tin người tạo
      });
      await newCategory.save();
      res.status(201).json({ msg: "Danh mục đã được tạo thành công!", category: newCategory });
   } catch (error) {
      console.error("Lỗi khi tạo danh mục:", error);
      res.status(500).json({ error: "Lỗi khi tạo danh mục!" });
   }
}

// Lấy tất cả các danh mục
export async function getAllCategories(req, res) {
   try {
      // Lấy danh mục theo người tạo
      const categories = await CategoryModel.find({ created_by: req.user.userId });
      console.log("Danh sách danh mục:", categories);
      res.status(200).json(categories);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách danh mục:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách danh mục!" });
   }
}

// Lấy danh sách câu hỏi theo danh mục
export async function getQuestionsByCategoryId(req, res) {
   try {
      console.log("Request Category ID:", req.params.id);
      const questions = await QuestionModel.find({ category: req.params.id });
      if (!questions.length) {
         console.log("Không tìm thấy câu hỏi nào cho danh mục ID:", req.params.id);
         return res.status(404).json({ error: "Không tìm thấy câu hỏi nào cho danh mục này." });
      }
      console.log("Danh sách câu hỏi theo danh mục:", questions);
      res.status(200).json(questions);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách câu hỏi theo danh mục:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách câu hỏi theo danh mục!" });
   }
}

// Cập nhật danh mục
export async function updateCategory(req, res) {
   try {
      // Lấy ID và loại bỏ ký tự không mong muốn
      const categoryId = req.params.id.trim(); // Loại bỏ khoảng trắng hoặc ký tự không cần thiết
      console.log("Request Category ID để cập nhật:", categoryId);
      console.log("Request Body:", req.body);

      // Tìm và cập nhật danh mục
      const category = await CategoryModel.findByIdAndUpdate(categoryId, req.body, { new: true });

      // Kiểm tra xem danh mục có tồn tại không
      if (!category) {
         console.log("Không tìm thấy danh mục để cập nhật với ID:", categoryId);
         return res.status(404).json({ error: "Không thể cập nhật danh mục!" });
      }

      console.log("Danh mục đã được cập nhật:", category);
      res.status(200).json({ msg: "Cập nhật danh mục thành công!", category });
   } catch (error) {
      console.error("Lỗi khi cập nhật danh mục:", error);
      return res.status(500).json({ error: "Lỗi khi cập nhật danh mục!" });
   }
}




// Xóa danh mục
export async function deleteCategory(req, res) {
   try {
      console.log("Request Category ID để xóa:", req.params.id);
      const category = await CategoryModel.findById(req.params.id);
      if (!category) {
         console.log("Không tìm thấy danh mục để xóa với ID:", req.params.id);
         return res.status(404).json({ error: "Không thể xóa danh mục!" });
      }

      // Xóa danh mục
      await category.remove();
      console.log("Danh mục đã được xóa thành công với ID:", req.params.id);
      res.status(200).json({ msg: "Xóa danh mục thành công!" });
   } catch (error) {
      console.error("Lỗi khi xóa danh mục:", error);
      res.status(500).json({ error: "Lỗi khi xóa danh mục!" });
   }
}
