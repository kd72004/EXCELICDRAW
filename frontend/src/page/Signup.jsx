import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  const signup = async () => {
    try {
      await axios.post('http://localhost:5000/signup', { username, password });
      alert('Signup successful! Please log in.');
      nav('/'); 
    } catch (err) {
      alert(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-md border border-[#3b3b3b] bg-[#2e2e2e] text-white space-y-6">
        <h1 className="text-3xl font-semibold text-center text-purple-400">Sign Up</h1>

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
            onClick={signup}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 transition duration-200 rounded-md font-medium"
          >
            Sign Up
          </button>
        </div>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <span
            className="text-purple-400 cursor-pointer hover:underline"
            onClick={() => nav('/')}
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}
