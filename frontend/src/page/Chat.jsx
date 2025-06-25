import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken, getUserIdFromToken } from '../utils/auth';
import { connectSocket, getSocket } from '../utils/socket';

export default function Chat() {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const userId = getUserIdFromToken();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      alert('Login required');
      nav('/login');
      return;
    }

    let socket = getSocket();
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      socket = connectSocket(token);
    }

    socketRef.current = socket;

    const joinRoom = () => {
      socket.send(JSON.stringify({ type: 'join_room', roomId }));
    };

    if (socket.readyState === WebSocket.OPEN) {
      joinRoom();
    } else {
      socket.onopen = () => joinRoom();
    }

    axios
      .get(`http://localhost:5000/chat/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const formatted = res.data.map((msg) => ({
          ...msg,
          sender: String(msg.sender?._id || msg.sender),
        }));
        setMessages(formatted);
      })
      .catch(() => alert('Failed to load messages'));

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat') {
        const senderId = String(data.sender?._id || data.sender);
        setMessages((prev) => [...prev, { ...data, sender: senderId }]);
      } else if (data.error) {
        alert(data.error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'leave_room', roomId }));
      }
    };
  }, [roomId, nav]);

  const sendMessage = () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert('WebSocket not connected');
      return;
    }

    const data = {
      type: 'chat',
      roomId,
      message,
    };

    socket.send(JSON.stringify(data));

    setMessages((prev) => [
      ...prev,
      {
        ...data,
        sender: userId,
        timestamp: new Date().toISOString(),
      },
    ]);

    setMessage('');
  };

  const leaveRoom = () => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'leave_room', roomId }));
    }
    nav('/room');
  };

  return (
  <div className="h-screen overflow-hidden bg-[#1e1e1e] text-white flex items-center justify-center px-4 py-6">
    <div className="w-full max-w-4xl h-[90vh] bg-[#2e2e2e] border border-[#444] shadow-xl rounded-2xl p-6 flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-purple-400">Room: {roomId}</h2>
        <button
          onClick={leaveRoom}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-medium transition"
        >
          🚪 Leave
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#1a1a1a] rounded-lg p-4 space-y-2 border border-gray-700">
        {messages.map((msg, i) => {
          const senderId = String(msg.sender);
          const isCurrentUser = senderId === userId;

          return (
            <div key={i} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-lg shadow-md text-sm break-words ${
                  isCurrentUser ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
              >
                <p>{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          className="flex-1 px-4 py-3 rounded-lg bg-[#1a1a1a] text-white border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow transition"
        >
          Send
        </button>
      </div>
    </div>
  </div>
);

}
