import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket, connectSocket } from '../utils/socket';
import { getToken } from '../utils/auth';

export default function Room() {
  const [roomId, setRoomId] = useState('');
  const [socketReady, setSocketReady] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = getSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      connectSocket(token)
        .then(() => setSocketReady(true))
        .catch(() => alert("WebSocket connection failed"));
    } else {
      setSocketReady(true);
    }
  }, []);

  const createRoom = () => {
    const socket = getSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return alert("WebSocket not connected");
    }
    socket.onmessage = null;
    socket.send(JSON.stringify({ type: 'create_room', roomId }));

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'room_created' && data.roomId === roomId) {
        // nav(`/chat/${roomId}`);
        nav(`/canvas/${roomId}`);
      } else if (data.error) {
        alert(data.error);
      }
    };
  };

  const joinRoom = () => {
    const socket = getSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return alert("WebSocket not connected");
    }
    socket.onmessage = null;
    socket.send(JSON.stringify({ type: 'join_room', roomId }));

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'joined_room' && data.roomId === roomId) {
        
        nav(`/canvas/${roomId}`);

      } else if (data.error) {
        alert(data.error);
      }
    };
  };

  const joinRoomChat = () => {
    const socket = getSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return alert("WebSocket not connected");
    }
    socket.onmessage = null;
    socket.send(JSON.stringify({ type: 'join_room', roomId }));

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'joined_room' && data.roomId === roomId) {
        nav(`/chat/${roomId}`);
        // nav(`/canvas/${roomId}`);

      } else if (data.error) {
        alert(data.error);
      }
    };
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 bg-[#2e2e2e] rounded-2xl border border-[#3b3b3b] shadow-md space-y-6 text-white">
        <h1 className="text-3xl font-semibold text-center text-purple-400">Enter Room</h1>

        <input
          className="w-full px-4 py-3 bg-[#1e1e1e] text-white placeholder-gray-400 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
        />

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={createRoom}
            disabled={!socketReady}
            className={`flex-1 py-3 rounded-md font-medium transition ${
              socketReady
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            Create Room
          </button>

          <button
            onClick={joinRoom}
            disabled={!socketReady}
            className={`flex-1 py-3 rounded-md font-medium transition ${
              socketReady
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            Join Room for Canvas
          </button>

          <button
            onClick={joinRoomChat}
            disabled={!socketReady}
            className={`flex-1 py-3 rounded-md font-medium transition ${
              socketReady
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            Join Room for Chat
          </button>
        </div>
      </div>
    </div>
  );
}
