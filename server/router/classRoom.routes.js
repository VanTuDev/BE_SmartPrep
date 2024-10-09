import { Router } from 'express';
import * as classRoomController from '../controllers/ClassRoomController.js';
import Auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

// Route tạo lớp học mới
// URL: POST /api/classrooms/create
// Chức năng: Tạo một lớp học mới với thông tin tên và mô tả lớp học, chỉ giáo viên mới có thể tạo lớp.
// Yêu cầu Auth middleware để đảm bảo người dùng đã đăng nhập và có quyền tạo lớp học.
router.post('/create', Auth, classRoomController.createClassRoom);

// Thêm nhiều học sinh vào lớp học qua danh sách email
// URL: POST /api/classrooms/:classId/add-learners
// Chức năng: Thêm học sinh vào lớp học qua danh sách email, lưu vào danh sách `learners`.
// Chỉ cho phép giáo viên của lớp học thực hiện.
router.post('/:classId/add-learners', Auth, classRoomController.addMultipleLearners);

// Học sinh tham gia lớp học bằng mã code
// URL: POST /api/classrooms/join
// Chức năng: Học sinh nhập mã code để tham gia lớp học. Yêu cầu mã code của lớp hợp lệ.
// Sau khi tham gia, học sinh sẽ được thêm vào danh sách `pending_requests` chờ được duyệt bởi giáo viên.
router.post('/join', Auth, classRoomController.joinClassByCode);

// Giáo viên duyệt học sinh tham gia lớp
// URL: POST /api/classrooms/approve
// Chức năng: Giáo viên chấp thuận yêu cầu tham gia của học sinh dựa trên email. Sau khi duyệt,
// học sinh sẽ được thêm vào danh sách `learners` và xóa khỏi `pending_requests`.
router.post('/approve', Auth, classRoomController.approveJoinRequest);

// Mời học sinh vào lớp bằng email
// URL: POST /api/classrooms/:classId/invite
// Chức năng: Mời nhiều học sinh vào lớp học qua danh sách email, thêm vào `invited_learners`.
// Học sinh phải chấp nhận lời mời để được thêm vào danh sách `learners`.
router.post('/:classId/invite', Auth, classRoomController.inviteLearners);

// Học sinh chấp nhận lời mời tham gia lớp học qua email
// URL: POST /api/classrooms/:classId/accept-invite
// Chức năng: Học sinh chấp nhận lời mời tham gia lớp học. Sau khi chấp nhận, học sinh sẽ được thêm vào danh sách `learners`
// và được xóa khỏi danh sách `invited_learners`.
router.post('/:classId/accept-invite', Auth, classRoomController.acceptClassInvitation);

// Học sinh rời khỏi lớp học
// URL: DELETE /api/classrooms/:classId/leave
// Chức năng: Xóa học sinh khỏi danh sách `learners` của lớp học và cập nhật lại dữ liệu.
// Yêu cầu học sinh phải là thành viên của lớp để thực hiện rời khỏi lớp học.
router.delete('/:classId/leave', Auth, classRoomController.leaveClass);

// Lấy tất cả lớp học do giáo viên tạo
// URL: GET /api/classrooms/instructor
// Chức năng: Lấy danh sách tất cả các lớp học mà giáo viên đã tạo, chỉ hiển thị cho giáo viên đã đăng nhập.
router.get('/instructor', Auth, classRoomController.getAllClassesByInstructor);

// Lấy chi tiết thông tin lớp học
// URL: GET /api/classrooms/:classId/details
// Chức năng: Lấy toàn bộ thông tin của lớp học, bao gồm danh sách học sinh, bài kiểm tra và tài liệu.
router.get('/:classId/details', Auth, classRoomController.getClassRoomDetails);

// Cập nhật thông tin lớp học
// URL: PUT /api/classrooms/:classId
// Chức năng: Cập nhật các thông tin cơ bản của lớp học như tên, mô tả. Chỉ giáo viên của lớp mới có quyền thực hiện.
router.put('/:classId', Auth, classRoomController.updateClassRoom);

// Tải tài liệu lên lớp học
// URL: POST /api/classrooms/:classId/upload
// Chức năng: Tải tệp tài liệu lên lớp học, lưu trữ các thông tin về tài liệu trong danh sách `resources` của lớp học.
// Sử dụng middleware `upload` để quản lý việc tải file.
// router.post('/:classId/upload', Auth, upload.single('file'), classRoomController.uploadResource);

// Thêm bài kiểm tra vào lớp học
// URL: POST /api/classrooms/:classId/add-test
// Chức năng: Thêm bài kiểm tra vào danh sách bài kiểm tra của lớp học.
// Giáo viên của lớp có quyền thêm các bài kiểm tra đã được tạo sẵn vào lớp học.
// router.post('/:classId/add-test', Auth, classRoomController.addTestToClass);

// Cập nhật thông tin tài liệu của lớp học
// URL: PUT /api/classrooms/:classId/resources/:resourceId
// Chức năng: Cập nhật thông tin của tài liệu đã tải lên trong lớp học. Cho phép chỉnh sửa tên tệp hoặc các thông tin khác.
// router.put('/:classId/resources/:resourceId', Auth, classRoomController.updateResource);

// Xóa tài liệu khỏi lớp học
// URL: DELETE /api/classrooms/:classId/resources/:resourceId
// Chức năng: Xóa tài liệu ra khỏi danh sách `resources` của lớp học dựa trên `resourceId`.
// router.delete('/:classId/resources/:resourceId', Auth, classRoomController.deleteResource);

export default router;
