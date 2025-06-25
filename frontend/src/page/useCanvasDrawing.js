import { useEffect, useRef } from "react";

export default function useCanvasDrawing(canvasRef, shapeType, roomId, socket, clearVersion, setShapeType) {
  const shapesRef = useRef([]);
  const shapeTypeRef = useRef(shapeType);
  const selectedShapeIndexRef = useRef(null);

  
  useEffect(() => {
    shapeTypeRef.current = shapeType;
  }, [shapeType]);

  
  const drawRoundedRect = (ctx, x, y, width, height, radius = 10) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
  };

  const drawArrow = (ctx, x1, y1, x2, y2) => {
    const headlen = 10;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const drawShape = (ctx, shape) => {
    switch (shape.type) {
      case "rect":
        drawRoundedRect(ctx, shape.x, shape.y, shape.width, shape.height);
        break;
      case "square":
        const side = Math.min(shape.width, shape.height);
        drawRoundedRect(ctx, shape.x, shape.y, side, side);
        break;
      case "circle":
        ctx.beginPath();
        ctx.ellipse(
          shape.x + shape.width / 2,
          shape.y + shape.height / 2,
          Math.abs(shape.width) / 2,
          Math.abs(shape.height) / 2,
          0,
          0,
          2 * Math.PI
        );
        ctx.stroke();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(shape.x + shape.width / 2, shape.y);
        ctx.lineTo(shape.x, shape.y + shape.height);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.closePath();
        ctx.stroke();
        break;
      case "arrow":
        drawArrow(ctx, shape.x, shape.y, shape.x + shape.width, shape.y + shape.height);
        break;
      case "text":
  const approxWidth = shape.text.length * 8;
  const approxHeight = shape.text.split("\n").length * 20;
  return (
    x >= shape.x &&
    x <= shape.x + approxWidth &&
    y >= shape.y - 16 &&
    y <= shape.y + approxHeight
  );

    }
  };

  const drawAllShapes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#2e2e2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";

    shapesRef.current.forEach((shape) => {
      drawShape(ctx, shape);
    });

    if (
      shapeTypeRef.current === "select" &&
      selectedShapeIndexRef.current !== null &&
      shapesRef.current[selectedShapeIndexRef.current]
    ) {
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 2;
      drawShape(ctx, shapesRef.current[selectedShapeIndexRef.current]);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
    }
  };

  const isInsideShape = (shape, x, y) => {
    switch (shape.type) {
      case "rect":
      case "square":
      case "circle":
      case "triangle":
      case "arrow":
        return (
          x >= shape.x &&
          x <= shape.x + shape.width &&
          y >= shape.y &&
          y <= shape.y + shape.height
        );
      case "text":
  const approxWidth = shape.text.length * 8;
  const approxHeight = shape.text.split("\n").length * 20;
  return (
    x >= shape.x &&
    x <= shape.x + approxWidth &&
    y >= shape.y &&
    y <= shape.y + approxHeight
  );

  break;

      default:
        return false;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isDrawing = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentWidth = 0;
    let currentHeight = 0;

    const fetchShapes = async () => {
      try {
        const res = await fetch(`http://localhost:5000/shape/${roomId}`);
        const shapes = await res.json();
        shapesRef.current = shapes;
        drawAllShapes();
      } catch (err) {
        console.error("Failed to load past shapes:", err);
      }
    };

    fetchShapes();

    const handleClick = (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (shapeType === "text") {
    setTextInput({ visible: true, x, y, value: "" });
  }

  selectedShapeIndexRef.current = null;
  for (let i = shapesRef.current.length - 1; i >= 0; i--) {
    if (isInsideShape(shapesRef.current[i], x, y)) {
      selectedShapeIndexRef.current = i;
      break;
    }
  }

  drawAllShapes();
};


    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (shapeTypeRef.current === "select") {
        if (
          selectedShapeIndexRef.current !== null &&
          isInsideShape(shapesRef.current[selectedShapeIndexRef.current], x, y)
        ) {
          isDragging = true;
          startX = x;
          startY = y;
        }
        return;
      }

      if (shapeTypeRef.current === "text") return;

      isDrawing = true;
      startX = x;
      startY = y;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDragging && selectedShapeIndexRef.current !== null) {
        const shape = shapesRef.current[selectedShapeIndexRef.current];
        const dx = mouseX - startX;
        const dy = mouseY - startY;
        shape.x += dx;
        shape.y += dy;
        startX = mouseX;
        startY = mouseY;
        drawAllShapes();
        return;
      }

      if (!isDrawing || shapeTypeRef.current === "text") return;

      currentWidth = mouseX - startX;
      currentHeight = mouseY - startY;
      drawAllShapes();
      drawShape(ctx, {
        type: shapeTypeRef.current,
        x: startX,
        y: startY,
        width: currentWidth,
        height: currentHeight,
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        const movedShape = shapesRef.current[selectedShapeIndexRef.current];
        if (socket?.readyState === WebSocket.OPEN && movedShape?._id) {
          socket.send(
            JSON.stringify({
              type: "move_shape",
              shapeId: movedShape._id,
              x: movedShape.x,
              y: movedShape.y,
            })
          );
        }
        return;
      }

      if (!isDrawing || shapeTypeRef.current === "text") return;
      isDrawing = false;

      const newShape = {
        type: shapeTypeRef.current,
        x: startX,
        y: startY,
        width: currentWidth,
        height: currentHeight,
        color: "white",
      };

      shapesRef.current.push(newShape);
      drawAllShapes();

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "draw_shape",
            roomId,
            shape: newShape,
          })
        );
      }
      

      setShapeType("select"); 
    };

    

    const handleKeyDown = (e) => {
      if (e.key === "Backspace" && selectedShapeIndexRef.current !== null) {
        const deletedShape = shapesRef.current[selectedShapeIndexRef.current];
        shapesRef.current.splice(selectedShapeIndexRef.current, 1);
        selectedShapeIndexRef.current = null;
        drawAllShapes();

        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "delete_shape",
              roomId,
              shapeId: deletedShape._id,
            })
          );
        }
      }
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canvasRef, socket, roomId, clearVersion]);


  useEffect(() => {
    if (!socket) return;

    const handleShapeMessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === "draw_shape" && data.shape) {
          shapesRef.current.push(data.shape);
          drawAllShapes();
        }

        if (data.type === "delete_shape" && data.shapeId) {
          shapesRef.current = shapesRef.current.filter((s) => s._id !== data.shapeId);
          drawAllShapes();
        }

        if (data.type === "move_shape" && data.shapeId) {
          const shape = shapesRef.current.find((s) => s._id === data.shapeId);
          if (shape) {
            shape.x = data.x;
            shape.y = data.y;
            drawAllShapes();
          }
        }

        if (data.type === "clear_canvas") {
          shapesRef.current = [];
          drawAllShapes();
        }
      } catch (err) {
        console.error("Invalid shape from WebSocket:", err);
      }
    };

    socket.addEventListener("message", handleShapeMessage);
    return () => socket.removeEventListener("message", handleShapeMessage);
  }, [socket]);
}
