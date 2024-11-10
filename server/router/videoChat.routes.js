import express from 'express';
import { createRoom, joinRoom, getRoomByClassId, getRoomByAuthor, deleteRoom } from '../controllers/VideoChatController.js';

const router = express.Router();

router.post('/create-room', createRoom);
router.post('/join-room', joinRoom);
router.get('/get-room-by-classId', getRoomByClassId);
router.get('/get-room-by-author', getRoomByAuthor);
router.delete('/room/delete/:roomId', deleteRoom);

export default router;
