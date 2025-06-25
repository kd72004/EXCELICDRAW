import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './page/Login';
import Signup from './page/Signup';
import Room from './page/Room';
import Chat from './page/Chat';
import CanvasContainer from './page/CanvasContainer';
import './index.css'
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/room" element={<Room />} />
        <Route path="/chat/:roomId" element={<Chat />} />
        <Route path="/canvas/:roomId" element={<CanvasContainer />} />
      </Routes>
    </BrowserRouter>
  );
}
