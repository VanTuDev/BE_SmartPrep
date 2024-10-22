import CategoryModel from '../model/Category.model.js';

// Tạo danh mục môn học
export async function createCategory(req, res) {
   try {
      const { name, description, grade_id } = req.body;
      const newCategory = new CategoryModel({
         name,
         description,
         grade_id,
         instructor: req.user.userId
      });
      await newCategory.save();
      res.status(201).json({ msg: "Danh mục môn học đã được tạo!", category: newCategory });
   } catch (error) {
      console.error("Lỗi khi tạo danh mục:", error);
      res.status(500).json({ error: "Lỗi khi tạo danh mục!" });
   }
}

// Lấy tất cả danh mục môn học của instructor
export async function getAllCategories(req, res) {
   try {
      const categories = await CategoryModel.find({ instructor: req.user.userId })
         .populate('grade_id', 'name');
      res.status(200).json(categories);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách danh mục:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách danh mục!" });
   }
}

// Cập nhật danh mục môn học
export async function updateCategory(req, res) {
   try {
      const categoryId = req.params.id;
      const updatedCategory = await CategoryModel.findByIdAndUpdate(
         categoryId,
         req.body,
         { new: true }
      );

      if (!updatedCategory) {
         return res.status(404).json({ error: "Không tìm thấy danh mục!" });
      }

      res.status(200).json({ msg: "Cập nhật danh mục thành công!", category: updatedCategory });
   } catch (error) {
      console.error("Lỗi khi cập nhật danh mục:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật danh mục!" });
   }
}

// Xóa danh mục môn học
export async function deleteCategory(req, res) {
   try {
      const category = await CategoryModel.findById(req.params.id);
      if (!category) {
         return res.status(404).json({ error: "Không tìm thấy danh mục!" });
      }

      await category.remove();
      res.status(200).json({ msg: "Xóa danh mục thành công!" });
   } catch (error) {
      console.error("Lỗi khi xóa danh mục:", error);
      res.status(500).json({ error: "Lỗi khi xóa danh mục!" });
   }
}

//
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


//
export async function getCategoryById(req, res) {
   try {
      const category = await CategoryModel.findById(req.params.id)
         .populate('grade_id', 'name'); // Populate để lấy thông tin tên của khối

      if (!category) {
         return res.status(404).json({ error: "Không tìm thấy danh mục!" });
      }

      res.status(200).json(category);
   } catch (error) {
      console.error("Lỗi khi lấy danh mục theo ID:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh mục theo ID!" });
   }
}

// Lấy tất cả danh mục môn học theo khối (grade_id)
export async function getAllCategoriesByGrade(req, res) {
   try {
      const { grade_id } = req.query; // Lấy grade_id từ query parameters
      const categories = await CategoryModel.find({ grade_id });

      if (!categories.length) {
         return res.status(404).json({ error: 'Không có môn học nào cho khối này!' });
      }

      res.status(200).json(categories);
   } catch (error) {
      console.error('Lỗi khi lấy danh mục theo grade_id:', error);
      res.status(500).json({ error: 'Lỗi khi lấy danh mục theo grade_id!' });
   }
}
