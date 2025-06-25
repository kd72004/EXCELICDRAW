require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

let Chat, Room ,Shape;
const fetch = require('node-fetch');


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('WS-Backend connected to MongoDB');
  Chat = require('./models/Chat');
  Room = require('./models/Room');
  Shape=require('./models/Shape');
  
  startWebSocketServer();
}).catch((err) => {
  console.error('MongoDB connection failed:', err);
});

function startWebSocketServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('WebSocket server is running!');
  });

  const wss = new WebSocket.Server({ server });
  const users = [];

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const roomId = url.searchParams.get('roomId');

    if (!token) {
      ws.send(JSON.stringify({ error: 'Missing token or roomId' }));
      return ws.close();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      ws.send(JSON.stringify({ error: 'Invalid or expired token' }));
      return ws.close();
    }

    const uid = decoded.uid;
    if (!uid) return ws.close();

    users.push({ uid, rooms: [roomId], ws });
    console.log(` User ${uid} joined room ${roomId}`);

    ws.uid = uid;
    ws.roomId = roomId;

    ws.on('message', async (data) => {
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch (err) {
        return ws.send(JSON.stringify({ error: 'Invalid JSON' }));
      }

      const user = users.find(u => u.ws === ws);
      if (!user) return;

      //  CREATE ROOM
     if (parsedData.type === 'create_room') {
  const newRoomId = parsedData.roomId;
  try {
    const existing = await Room.findOne({ roomId: newRoomId });
    if (existing) {
      ws.send(JSON.stringify({ error: 'Room already exists' })); 
    } else {
      const room = new Room({
        roomId: newRoomId,
        createdBy: new mongoose.Types.ObjectId(uid)
      });
      await room.save();
      ws.send(JSON.stringify({ type: 'room_created', roomId: newRoomId }));
    }
  } catch (err) {
    ws.send(JSON.stringify({ error: 'Failed to create room' }));
  }
}

   
if (parsedData.type === 'draw_shape') {
  const { roomId, shape } = parsedData;

  if (!roomId || !shape?.type) {
    return ws.send(JSON.stringify({ error: 'Invalid shape data' }));
  }

  try {
    const newShape = await Shape.create({
      roomId,
      type: shape.type,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      text: shape.text,
      color: shape.color || 'white'
    });

   
    users.forEach(u => {
      if (u.rooms.includes(roomId) && u.ws !== ws) {
        u.ws.send(JSON.stringify({
          type: 'draw_shape',
          shape: newShape
        }));
      }
    });

    console.log(`🎨 Shape saved from ${uid} in ${roomId}`);
  } catch (err) {
    console.error(' Failed to save shape:', err);
    ws.send(JSON.stringify({ error: 'Failed to save shape' }));
  }
}

if (parsedData.type === 'move_shape') {
  const { shapeId, x, y } = parsedData;
  if (!shapeId || x == null || y == null) {
    return ws.send(JSON.stringify({ error: 'Invalid shape move data' }));
  }

  try {
    const updatedShape = await Shape.findByIdAndUpdate(
      shapeId,
      { x, y },
      { new: true }
    );

    if (!updatedShape) {
      return ws.send(JSON.stringify({ error: 'Shape not found' }));
    }

    console.log(`↔️ Shape ${shapeId} moved by ${uid}`);

    users.forEach(u => {
      if (u.rooms.includes(ws.roomId) && u.ws !== ws) {
        u.ws.send(JSON.stringify({
          type: "move_shape",
          shapeId,
          x,
          y
        }));
      }
    });

  } catch (err) {
    console.error('Failed to move shape:', err);
    ws.send(JSON.stringify({ error: 'Failed to move shape' }));
  }
}

//  CLEAR CANVAS
if (parsedData.type === "clear_canvas") {
  const { roomId } = parsedData;
  try {
    await Shape.deleteMany({ roomId });
    console.log(`🧹 Cleared canvas for room: ${roomId}`);

    // broadcast to everyone in room
    users.forEach(u => {
      if (u.rooms.includes(roomId)) {
        u.ws.send(JSON.stringify({ type: "clear_canvas" }));
      }
    });
  } catch (err) {
    console.error('Failed to clear canvas:', err);
    ws.send(JSON.stringify({ error: 'Failed to clear canvas' }));
  }
}


if (parsedData.type === 'delete_shape') {
  const { shapeId } = parsedData;
  if (!shapeId) return;

  try {
    const res = await fetch(`http://localhost:5000/shape/${shapeId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const errMsg = await res.json();
      return ws.send(JSON.stringify({ error: errMsg.error || 'Failed to delete shape' }));
    }

    console.log(`🗑️ Shape permanently deleted by ${uid}: ${shapeId}`);


    users.forEach(u => {
      if (u.rooms.includes(ws.roomId) && u.ws !== ws) {
        u.ws.send(JSON.stringify({
          type: 'delete_shape',
          shapeId
        }));
      }
    });
  } catch (err) {
    console.error(' Failed to delete shape:', err);
    ws.send(JSON.stringify({ error: 'Failed to delete shape' }));
  }
}



      //  JOIN ROOM
     if (parsedData.type === 'join_room') {
  const roomIdToJoin = parsedData.roomId;

  // Don't show error if already joined
  if (!user.rooms.includes(roomIdToJoin)) {
    const roomExists = await Room.exists({ roomId: roomIdToJoin });
    if (!roomExists) {
      return ws.send(JSON.stringify({ error: 'Room does not exist' }));
    }

    user.rooms.push(roomIdToJoin);
  }

  ws.send(JSON.stringify({ type: 'joined_room', roomId: roomIdToJoin }));
}
      // LEAVE ROOM
      if (parsedData.type === 'leave_room') {
        const roomToLeave = parsedData.roomId;
        user.rooms = user.rooms.filter(r => r !== roomToLeave);
        ws.send(JSON.stringify({ type: 'left_room', roomId: roomToLeave }));
        console.log(`➖ User ${uid} left ${roomToLeave}`);
      }

      //  CHAT MESSAGE
      if (parsedData.type === 'chat') {
        const room = parsedData.roomId;
        const message = parsedData.message;

        // broadcast to all EXCEPT sender
        users.forEach(u => {
          if (u.rooms.includes(room) && u.ws !== ws) {
            u.ws.send(JSON.stringify({
              type: 'chat',
              message,
              roomId: room,
              sender: uid,
              timestamp: new Date().toISOString()
            }));
          }
        });

        try {
          const newChat = await Chat.create({
            message,
            sender: new mongoose.Types.ObjectId(uid),
            roomId: room
          });
          console.log(`💾 Chat saved from ${uid} in ${room}`);
        } catch (err) {
          console.error(' Failed to save chat:', err);
        }
      }
    });

    ws.on('close', () => {
      console.log(`User ${uid} disconnected`);
      const index = users.findIndex(u => u.ws === ws);
      if (index !== -1) users.splice(index, 1);
    });
  });

  server.listen(8080, () => {
    console.log('WebSocket server running on ws://localhost:8080');
  });
}
