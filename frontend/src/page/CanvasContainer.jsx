import Canvas from "./Canvas";
import useCanvasDrawing from "./useCanvasDrawing";
import RoomDrawer from './RoomDrawer'; 
import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import { connectSocket, getSocket } from "../utils/socket";

const SVGIcons = {
  select: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7"><path d="M4 4h7l-7 16v-16z" /></svg>,
  rect: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7"><rect x="3" y="3" width="18" height="18" rx="6" /></svg>,
  square: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7"><rect x="6" y="6" width="12" height="12" rx="4" /></svg>,
  circle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7"><circle cx="12" cy="12" r="10" /></svg>,
  triangle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7"><polygon points="12 3 21 20 3 20" /></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
  text: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7"><line x1="4" y1="6" x2="20" y2="6" /><line x1="9" y1="6" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="18" /></svg>,
};

export default function CanvasContainer() {
  const canvasRef = useRef(null);
   const [showDrawer, setShowDrawer] = useState(false);
  const [shapeType, setShapeType] = useState("select");
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, value: "" });
  const [clearVersion, setClearVersion] = useState(0);
  const { roomId } = useParams();
  const nav = useNavigate();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      nav("/login");
      return;
    }

    (async () => {
      let sock = getSocket();
      if (!sock || sock.readyState === WebSocket.CLOSED) {
        sock = await connectSocket(token);
      }

      sock.send(JSON.stringify({ type: "join_room", roomId }));
      setSocket(sock);
    })();
  }, [roomId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (e) => {
      if (shapeType === "text") {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setTextInput({ visible: true, x, y, value: "" });
      }
    };

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [shapeType]);

  useCanvasDrawing(canvasRef, shapeType, roomId, socket, clearVersion, setShapeType);

  const handleClearCanvas = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "clear_canvas",
        roomId
      }));
      setClearVersion(prev => prev + 1);
    }
  };

  const shapeOptions = [
    { type: "select", label: "Move" },
    { type: "rect", label: "Rectangle" },
    { type: "square", label: "Square" },
    { type: "circle", label: "Circle" },
    { type: "triangle", label: "Triangle" },
    { type: "arrow", label: "Arrow" },
    { type: "text", label: "Text Box" },
  ];

  return (
    <div className="w-screen h-screen bg-[#2e2e2e] text-white flex flex-col overflow-hidden">
      <div className="w-full flex justify-center items-center py-4 px-6 bg-[#2e2e2e]">
        <div className="flex flex-wrap gap-4 bg-[#2e2e2e] px-6 py-3 rounded-2xl border border-gray-700">
          {shapeOptions.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setShapeType(type)}
              className={`px-5 py-3 rounded-xl flex items-center gap-2 text-lg font-medium transition border-2
                ${shapeType === type
                  ? "border-purple-400 text-white"
                  : "bg-transparent border-gray-600 text-gray-300 hover:border-purple-500"
                }`}
              title={label}
            >
              {SVGIcons[type]}
              <span>{label}</span>
            </button>
          ))}

          <button
            onClick={handleClearCanvas}
            className="px-5 py-3 rounded-xl text-lg font-medium border-2 bg-red-600 hover:bg-red-700 text-white border-red-700"
          >
            🧹 Clear Canvas
          </button>

           <button
    onClick={() => nav('/room')}
    className="ml-6 px-5 py-3 rounded-xl text-lg font-medium border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
  >
    🚪 Leave Room
  </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <Canvas canvasRef={canvasRef} width={dimensions.width} height={dimensions.height} />
        
        {textInput.visible && (
          <textarea
            autoFocus
            value={textInput.value}
            onChange={(e) =>
              setTextInput((prev) => ({ ...prev, value: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey && textInput.value.trim() !== "") {
                if (socket?.readyState === WebSocket.OPEN) {
                  socket.send(
                    JSON.stringify({
                      type: "draw_shape",
                      roomId,
                      shape: {
                        type: "text",
                        x: textInput.x,
                        y: textInput.y,
                        text: textInput.value,
                        color: "white",
                      },
                    })
                  );
                }

                setTextInput({ visible: false, x: 0, y: 0, value: "" });
              }
            }}
            placeholder="Enter text... (Ctrl + Enter to place)"
            style={{
              position: "absolute",
              top: textInput.y,
              left: textInput.x,
              minWidth: "140px",
              minHeight: "26px",
              background: "#2e2e2e",
              color: "white",
              border: "1px solid #ccc",
              padding: "6px 8px",
              fontSize: "14px",
              resize: "both",
              overflow: "auto",
            }}
          />
        )}
      </div>
    </div>
  );
}
