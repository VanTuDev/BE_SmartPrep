// middleware/instructorAuth.js
export default function verifyInstructor(req, res, next) {
   try {
      if (req.user.role !== 'instructor') {
         return res.status(403).json({ error: "Bạn không có quyền thực hiện thao tác này!" });
      }
      next(); // Nếu hợp lệ, chuyển đến controller tiếp theo
   } catch (error) {
      console.error("Lỗi xác thực Instructor:", error);
      res.status(500).json({ error: "Lỗi xác thực Instructor!" });
   }
}
