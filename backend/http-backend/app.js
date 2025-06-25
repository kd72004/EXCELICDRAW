require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Room = require('./models/Room');
const auth = require('./middlewear/auth');
const Chat = require('./models/Chat');
const Shape = require('./models/Shape'); 

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(console.error);

// Signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({ username, password: hashed });
    res.json({ message: 'User created successfully' });
  } catch (err) {
    res.status(400).json({ error: 'User already exists' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'User not found' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid password' });

  const token = jwt.sign({ uid: user._id }, process.env.JWT_SECRET, { expiresIn: '70h' });
  res.json({ token });
});

// Create Room (Authenticated)
app.post('/create-room', auth, async (req, res) => {
  const { roomId } = req.body;
  try {
    const room = await Room.create({ roomId, createdBy: req.user.uid });
    res.json({ message: 'Room created', roomId: room.roomId });
  } catch (err) {
    res.status(400).json({ error: 'Room already exists or error creating room' });
  }
});

// app.post('/join-room', auth, async (req, res) => {
//   const { roomId } = req.body;
//   const userId = req.user.uid;

//   try {
//     const room = await Room.findOne({ roomId });
//     if (!room) return res.status(404).json({ error: 'Room not found' });

//     // Only push if user not already in room
//     if (!room.users.includes(userId)) {
//       room.users.push(userId);
//       await room.save();
//     }

//     res.json({ message: 'Joined room successfully', roomUsers: room.users });
//   } catch (err) {
//     res.status(500).json({ error: 'Error joining room' });
//   }
// });

app.get('/chat/:roomId', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ roomId: req.params.roomId })
      .populate('sender', 'username') // replace sender ID with actual username
      .sort({ createdAt: 1 }); // oldest to newest
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch messages' });
  }
});

// app.get('/room/:roomId/users', auth, async (req, res) => {
//   try {
//     const room = await Room.findOne({ roomId: req.params.roomId }).populate('users', 'username');
//     if (!room) return res.status(404).json({ error: 'Room not found' });
//     res.json({ users: room.users });
//   } catch (err) {
//     res.status(500).json({ error: 'Could not get users' });
//   }
// });

// app.post('/leave-room', auth, async (req, res) => {
//   const { roomId } = req.body;
//   const userId = req.user.uid;

//   try {
//     const room = await Room.findOne({ roomId });
//     if (!room) return res.status(404).json({ error: 'Room not found' });

//     room.users = room.users.filter(uid => uid.toString() !== userId);
//     await room.save();

//     res.json({ message: 'Left room successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Error leaving room' });
//   }
// });

app.get('/my-rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { createdBy: req.user.uid },
        { users: req.user.uid }
      ]
    });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch rooms' });
  }
});

app.post('/shape', async (req, res) => {
  try {
    const shape = new Shape(req.body);
    const saved = await shape.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: 'Failed to save shape', details: err.message });
  }
});

// GET /shapes/:roomId - Get all shapes for a room
app.get('/shape/:roomId', async (req, res) => {
  try {
    const shapes = await Shape.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
    res.json(shapes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shapes' });
  }
});

app.delete('/shape/:id', async (req, res) => {
  try {
    const deleted = await Shape.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Shape not found' });
    res.status(200).json({ message: 'Shape deleted successfully', shapeId: req.params.id });
  } catch (err) {
    console.error('❌ Error deleting shape:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
