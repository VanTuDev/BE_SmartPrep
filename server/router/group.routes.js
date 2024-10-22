   // router/group.routes.js
   import { Router } from 'express';
   import * as groupController from '../controllers/GroupQuestionController.js';
   import Auth from '../middleware/auth.js';
   import verifyInstructor from '../middleware/instructorAuth.js';

   const router = Router();

   // Tạo chương mới (Chỉ Instructor)
   router.post('/create', Auth, verifyInstructor, groupController.createGroup);

   // Lấy tất cả các chương của instructor
   router.get('/', Auth, groupController.getAllGroups);
   router.get('/byCategory', Auth, verifyInstructor, groupController.getGroupsByCategory);

   // Lấy thông tin của chương học theo ID
   router.get('/:id', Auth, groupController.getGroupById);
   // Route lấy tất cả các chương theo môn học (category_id)


   // Cập nhật chương
   router.put('/:id', Auth, verifyInstructor, groupController.updateGroup);

   // Xóa chương
   router.delete('/:id', Auth, verifyInstructor, groupController.deleteGroup);

   export default router;
