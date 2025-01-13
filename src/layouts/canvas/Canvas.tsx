// import { usePencilDraw } from "../../hooks/usePencilDraw";
import { useDraw } from "../../hooks/useDraw";
import { ColorOfToolType } from "../../types/colors";
import { ToolsType } from "../../types/tools";

interface ICanvasProps {
  selectedTool: ToolsType;
  selectedColor: ColorOfToolType;
  lineWidth: number;
}

export const Canvas = ({ selectedTool, selectedColor, lineWidth }: ICanvasProps) => {
  // const { canvasRef } = usePencilDraw(selectedTool, selectedColor, lineWidth);
  const { canvasRef } = useDraw(selectedTool, selectedColor, lineWidth);

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="canvas"
        height={window.innerHeight - 104}
        width={window.innerWidth}
        data-selected-tool={selectedTool}
      >
        canvas
      </canvas>
    </div>
  );
};
