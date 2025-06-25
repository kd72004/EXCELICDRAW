// utils/socket.js
let socket = null;

export function connectSocket(token) {
  return new Promise((resolve, reject) => {
    socket = new WebSocket(`ws://localhost:8080?token=${token}`);
    socket.onopen = () => resolve(socket);
    socket.onerror = (err) => reject(err);
  });
}

export function getSocket(){
  return socket;
}
