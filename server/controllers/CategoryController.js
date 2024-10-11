import CategoryModel from '../model/Category.model.js';
import QuestionModel from '../model/Question.model.js';

// Tạo danh mục mới
export async function createCategory(req, res) {
   try {
      if (req.user.role !== 'instructor') {
         return res.status(403).json({ error: "Chỉ có giảng viên mới có thể tạo danh mục." });
      }

      const newCategory = new CategoryModel({
         ...req.body,
         created_by: req.user.userId,
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
      const categories = await CategoryModel.find({ created_by: req.user.userId });
      res.status(200).json(categories);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách danh mục:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách danh mục!" });
   }
}

// Lấy danh sách câu hỏi theo danh mục
export async function getQuestionsByCategoryId(req, res) {
   try {
      const questions = await QuestionModel.find({ category: req.params.id });
      if (!questions.length) {
         return res.status(404).json({ error: "Không tìm thấy câu hỏi nào cho danh mục này." });
      }
      res.status(200).json(questions);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách câu hỏi theo danh mục:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách câu hỏi theo danh mục!" });
   }
}

// Cập nhật danh mục
export async function updateCategory(req, res) {
   try {
      const categoryId = req.params.id.trim();
      const category = await CategoryModel.findByIdAndUpdate(categoryId, req.body, { new: true });

      if (!category) {
         return res.status(404).json({ error: "Không thể cập nhật danh mục!" });
      }

      res.status(200).json({ msg: "Cập nhật danh mục thành công!", category });
   } catch (error) {
      console.error("Lỗi khi cập nhật danh mục:", error);
      return res.status(500).json({ error: "Lỗi khi cập nhật danh mục!" });
   }
}

// Xóa danh mục
export async function deleteCategory(req, res) {
   try {
      const category = await CategoryModel.findById(req.params.id);
      if (!category) {
         return res.status(404).json({ error: "Không thể xóa danh mục!" });
      }

      await category.remove();
      res.status(200).json({ msg: "Xóa danh mục thành công!" });
   } catch (error) {
      console.error("Lỗi khi xóa danh mục:", error);
      res.status(500).json({ error: "Lỗi khi xóa danh mục!" });
   }
}
