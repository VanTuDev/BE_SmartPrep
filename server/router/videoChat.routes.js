import express from 'express';
import { createRoom, joinRoom, getRoomByLearnerId, getRoomByAuthor, deleteRoom } from '../controllers/VideoChatController.js';

const router = express.Router();

router.post('/create-room', createRoom);
router.post('/join-room', joinRoom);
router.get('/get-room-by-learnerId', getRoomByLearnerId);
router.get('/get-room-by-author', getRoomByAuthor);
router.delete('/delete/:roomId', deleteRoom);

export default router;
