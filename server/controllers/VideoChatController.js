import dotenv from 'dotenv';
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';
import RoomModel from '../model/Room.model.js';
import ClassRoomModel from '../model/ClassRoom.model.js';

dotenv.config();

const roomService = new RoomServiceClient(
    process.env.LIVEKIT_API_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
  );

  export function generateRoomId() {
    const randomString = () => Math.random().toString(36).substring(2, 6); // Adjust length as needed
    return `${randomString()}-${randomString()}`;
  }

  function randomString(length){
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  const createParticipantToken = async (participantName, roomName) => {
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, participantName);
    at.ttl = '5m'; // 5 minutes
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });
    at.identity = participantName
    console.log(at);
    
    return at.toJwt();
  };
  

// Tạo phòng mới
export const createRoom = async (req, res) => {
  const { roomTitle, author, classId } = req.body;

  // Ensure all required fields are present
  if (!roomTitle || !author || !classId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Generate a unique roomName
    const roomName = generateRoomId();

    // Check if a room with this roomName already exists
    const existingRoom = await RoomModel.findOne({ roomName });
    if (existingRoom) {
      return res.status(400).json({ error: 'Room name already exists' });
    }
    // Create the room with the generated roomName
    const newRoom = new RoomModel({
      roomTitle,
      author, // Author is the user who creates the room
      roomName, // Use the generated roomName here
      serverUrl: process.env.LIVEKIT_API_URL, // Assuming the URL comes from the environment variables
      classId,
    });

    console.log(newRoom);
    
    // Save the room to the database
    await newRoom.save();

    res.json({
      message: 'Room created successfully',
      roomName: newRoom.roomName,
      roomTitle: newRoom.roomTitle,
      classId: newRoom.classId,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Unable to create room' });
  }
};

// Tham gia phòng hiện có
export const joinRoom = async (req, res) => {
  const { roomName, userName } = req.body;
  const metadata = '';
  if (!roomName || !userName) {
    return res.status(400).json({ error: 'Mã phòng và tên người dùng là bắt buộc' });
  }

  try {
    // Tìm tên phòng theo mã ngẫu nhiên
    const room = await RoomModel.findOne({ roomName });
    if (!room) {
      return res.status(404).json({ error: 'Phòng không tồn tại với mã này' });
    }

    // Tạo token cho người dùng để tham gia phòng
    const participantToken = await createParticipantToken(userName, roomName);  // Đảm bảo thứ tự tham số đúng

    res.json({
      message: 'Tham gia phòng thành công',
      data: {
        serverUrl: process.env.LIVEKIT_API_URL,
        roomName: roomName,
        participantToken: participantToken,
        participantName: userName,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Không thể tham gia phòng' });
  }
};


// Get rooms by author
export const getRoomByAuthor = async (req, res) => {
  const { author } = req.query;  // Lấy author từ query params thay vì body

  // Ensure author is provided
  if (!author) {
    return res.status(400).json({ error: 'Author is required' });
  }

  try {
    // Find rooms by author and populate classId
    const rooms = await RoomModel.find({ author })
      .populate('classId'); // Populate với classId nếu cần

    if (rooms.length === 0) {
      return res.status(404).json({ error: 'No rooms found for this author' });
    }

    // Return the rooms found
    res.json({
      message: 'Rooms found successfully',
      rooms: rooms,
    });
  } catch (error) {
    console.error('Error fetching rooms by author:', error);
    res.status(500).json({ error: 'Unable to fetch rooms' });
  }
};


// Get rooms by classId
export const getRoomByLearnerId = async (req, res) => {
  const { userId } = req.query;  

  // Ensure userId is provided
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Step 1: Find classes that the user is enrolled in
    const classes = await ClassRoomModel.find({ learners: userId }).populate('learners');

    if (classes.length === 0) {
      return res.status(404).json({ error: 'No classes found for this user' });
    }

    // Step 2: Get classIds of those classes
    const classIds = classes.map(cls => cls._id);

    // Step 3: Find rooms for those classIds
    const rooms = await RoomModel.find({ classId: { $in: classIds } }).populate('classId');

    if (rooms.length === 0) {
      return res.status(404).json({ error: 'No rooms found for the classes this user is enrolled in' });
    }

    // Return the rooms found
    res.json({
      message: 'Rooms found successfully',
      rooms: rooms,
    });
  } catch (error) {
    console.error('Error fetching rooms by learnerId:', error);
    res.status(500).json({ error: 'Unable to fetch rooms' });
  }
};


export const deleteRoom = async (req, res) => {
  const { roomId } = req.params;  // Lấy `roomId` từ URL params

  if (!roomId) {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  try {
    // Tìm và xóa phòng
    const room = await RoomModel.findByIdAndDelete(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Nếu phòng xóa thành công
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Unable to delete room' });
  }
};
