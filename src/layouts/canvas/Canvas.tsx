import { usePencilDraw } from "../../hooks/usePencilDraw";
import { Tools } from "../../types/tools";

interface ICanvasProps {
  selectedTool: Tools;
}

export const Canvas = ({ selectedTool }: ICanvasProps) => {
  const canvasRef = usePencilDraw(selectedTool);

  return (
    <div>
      <canvas ref={canvasRef} height={window.innerHeight - 104} width={window.innerWidth}>
        canvas
      </canvas>
    </div>
  );
};
