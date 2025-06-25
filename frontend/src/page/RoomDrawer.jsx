import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket, connectSocket } from '../utils/socket';
import { getToken } from '../utils/auth';

export default function RoomDrawer({ isOpen }) {
  const [roomId, setRoomId] = useState('');
  const [socketReady, setSocketReady] = useState(true); 
  const nav = useNavigate();

  const createRoom = () => {
    const socket = getSocket();
    socket.onmessage = null;
    socket.send(JSON.stringify({ type: 'create_room', roomId }));
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'room_created') nav(`/canvas/${roomId}`);
      else if (data.error) alert(data.error);
    };
  };

  const joinRoom = () => {
    const socket = getSocket();
    socket.onmessage = null;
    socket.send(JSON.stringify({ type: 'join_room', roomId }));
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'joined_room') nav(`/canvas/${roomId}`);
      else if (data.error) alert(data.error);
    };
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[400px] bg-[#2e2e2e] border-l border-[#444] shadow-lg transform transition-transform z-40 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-6 space-y-4 text-white">
        <h1 className="text-2xl font-bold text-purple-400">Join/Create Room</h1>
        <input
          className="w-full px-4 py-2 bg-[#1e1e1e] text-white border border-gray-600 rounded-md"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <div className="flex gap-4">
          <button
            onClick={createRoom}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-md"
          >
            Create
          </button>
          <button
            onClick={joinRoom}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-md"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
