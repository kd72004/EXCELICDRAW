import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket } from '../utils/socket';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  const login = async () => {
    try {
      const res = await axios.post('http://localhost:5000/login', { username, password });
      const token = res.data.token;
      localStorage.setItem('token', token);

      await connectSocket(token);
      nav('/room');
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-md border border-[#3b3b3b] bg-[#2e2e2e] text-white space-y-6">
        <h1 className="text-3xl font-semibold text-center text-purple-400">Login</h1>

        <div className="space-y-4">
          <input
            className="w-full px-4 py-3 bg-[#1e1e1e] text-white placeholder-gray-400 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="w-full px-4 py-3 bg-[#1e1e1e] text-white placeholder-gray-400 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 transition duration-200 rounded-md font-medium"
          >
            Login
          </button>
        </div>

        <p className="text-center text-sm text-gray-400">
          Don’t have an account?{' '}
          <span
            className="text-purple-400 cursor-pointer hover:underline"
            onClick={() => nav('/signup')}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}
