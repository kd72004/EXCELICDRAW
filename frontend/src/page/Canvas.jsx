    export default function Canvas({ canvasRef, width, height }) {
    return (
        <canvas className="outline-none select-none"
        ref={canvasRef}
        width={width}
        height={height}
        style={{
            display: "block",
            width: "100vw",
            height: "100vh",
            backgroundColor: "#2e2e2e", 
        }}
        />
    );
    }
