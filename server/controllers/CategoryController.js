import CategoryModel from '../model/Category.model.js';
import QuestionModel from '../model/Question.model.js';

// Tạo danh mục mới
export async function createCategory(req, res) {
   try {
      console.log("Request Body:", req.body);

      // Kiểm tra xem req.user có được định nghĩa không
      if (!req.user || !req.user.userId) {
         console.error("Không tìm thấy thông tin người dùng trong request");
         return res.status(403).json({ error: "Xác thực không thành công!" });
      }

      const newCategory = new CategoryModel({
         ...req.body,
         created_by: req.user.userId,
      });
      await newCategory.save();
      console.log("Danh mục đã được tạo thành công:", newCategory);
      res.status(201).json({ msg: "Danh mục đã được tạo thành công!", category: newCategory });
   } catch (error) {
      console.error("Lỗi khi tạo danh mục:", error);
      res.status(500).json({ error: "Lỗi khi tạo danh mục!" });
   }
}
// Lấy tất cả các danh mục
export async function getAllCategories(req, res) {
   try {
      const categories = await CategoryModel.find({});
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
      console.log("Request Category ID để cập nhật:", req.params.id);
      console.log("Request Body:", req.body);
      const category = await CategoryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!category) {
         console.log("Không tìm thấy danh mục để cập nhật với ID:", req.params.id);
         return res.status(404).json({ error: "Không thể cập nhật danh mục!" });
      }
      console.log("Danh mục đã được cập nhật:", category);
      res.status(200).json({ msg: "Cập nhật danh mục thành công!", category });
   } catch (error) {
      console.error("Lỗi khi cập nhật danh mục:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật danh mục!" });
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
