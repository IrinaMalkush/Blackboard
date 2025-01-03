import { useCallback, useEffect, useRef, useState } from "react";

import { ignoreKeys } from "../constants/ignoreKeys";
import { ColorOfToolType } from "../types/colors";
import { ToolsType } from "../types/tools";
import { getCoordinates } from "../utils/getCoordinates";

export type CoordinatesType = {
  x: number;
  y: number;
};

export const usePencilDraw = (
  selectedTool: ToolsType,
  selectedColor: ColorOfToolType,
  lineWidth: number,
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [mousePosition, setMousePosition] = useState<CoordinatesType | undefined>(undefined);
  const [snapshot, setSnapshot] = useState<ImageData | undefined>(undefined);
  const [textPosition, setTextPosition] = useState<CoordinatesType | undefined>(undefined);

  /**
   * Start drawing or typing when the mouse is pressed
   */

  const startPaint = useCallback(
    (event: MouseEvent) => {
      const coordinates = getCoordinates(event, canvasRef);
      if (coordinates) {
        if (selectedTool === "text") {
          setTextPosition(coordinates);
        } else {
          setIsPainting(true);
          setMousePosition(coordinates);

          if (canvasRef.current) {
            const canvas: HTMLCanvasElement = canvasRef.current;
            const context = canvas.getContext("2d");
            if (context) {
              setSnapshot(context.getImageData(0, 0, canvas.width, canvas.height));
            }
          }
        }
      }
    },
    [selectedTool],
  );

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mousedown", startPaint);

    return () => {
      canvas.removeEventListener("mousedown", startPaint);
    };
  }, [startPaint]);

  /**
   * Draw the line on mouse move
   */

  const paint = useCallback(
    (event: MouseEvent) => {
      if (isPainting) {
        const newMousePosition = getCoordinates(event, canvasRef);
        if (mousePosition && newMousePosition) {
          if (selectedTool === "pencil" || selectedTool === "eraser") {
            draw(mousePosition, newMousePosition);
            setMousePosition(newMousePosition);
          } else {
            draw(mousePosition, newMousePosition);
          }
        }
      }
    },
    [isPainting, mousePosition],
  );

  const draw = (originalMousePosition: CoordinatesType, newMousePosition: CoordinatesType) => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    const context = canvas.getContext("2d");
    if (context) {
      context.strokeStyle = selectedTool === "eraser" ? "#f9f8f8" : selectedColor;
      context.lineJoin = "round";
      context.lineWidth = lineWidth;

      if (selectedTool === "pencil" || selectedTool === "eraser") {
        context.beginPath();
        context.moveTo(originalMousePosition.x, originalMousePosition.y);
        context.lineTo(newMousePosition.x, newMousePosition.y);
        context.stroke();
      } else if (selectedTool === "line") {
        if (snapshot) {
          context.putImageData(snapshot, 0, 0);
          context.beginPath();
          context.moveTo(originalMousePosition.x, originalMousePosition.y);
          context.lineTo(newMousePosition.x, newMousePosition.y);
          context.stroke();
        }
      } else if (selectedTool === "rectangle") {
        if (snapshot) {
          context.putImageData(snapshot, 0, 0);
          context.beginPath();
          context.strokeRect(
            newMousePosition.x,
            newMousePosition.y,
            originalMousePosition.x - newMousePosition.x,
            originalMousePosition.y - newMousePosition.y,
          );
        }
      } else if (selectedTool === "circle") {
        if (snapshot) {
          context.putImageData(snapshot, 0, 0);
          context.beginPath();
          // const radius = Math.sqrt(
          //   Math.pow(originalMousePosition.x - newMousePosition.x, 2) +
          //     Math.pow(originalMousePosition.y - newMousePosition.y, 2),
          // );
          // context.arc(originalMousePosition.x, originalMousePosition.y, radius, 0, 2 * Math.PI);
          context.moveTo(
            originalMousePosition.x,
            originalMousePosition.y + (newMousePosition.y - originalMousePosition.y) / 2,
          );
          context.bezierCurveTo(
            originalMousePosition.x,
            originalMousePosition.y,
            newMousePosition.x,
            originalMousePosition.y,
            newMousePosition.x,
            originalMousePosition.y + (newMousePosition.y - originalMousePosition.y) / 2,
          );
          context.bezierCurveTo(
            newMousePosition.x,
            newMousePosition.y,
            originalMousePosition.x,
            newMousePosition.y,
            originalMousePosition.x,
            originalMousePosition.y + (newMousePosition.y - originalMousePosition.y) / 2,
          );
          context.stroke();
        }
      } else if (selectedTool === "triangle") {
        if (snapshot) {
          context.putImageData(snapshot, 0, 0);
          context.beginPath();
          context.moveTo(originalMousePosition.x, originalMousePosition.y); // moving triangle to the mouse pointer
          context.lineTo(newMousePosition.x, newMousePosition.y); // creating first line according to the mouse pointer
          context.lineTo(originalMousePosition.x * 2 - newMousePosition.x, newMousePosition.y); // creating bottom line of triangle
          context.closePath();
          context.stroke();
        }
      }
    }
  };

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mousemove", paint);

    return () => {
      canvas.removeEventListener("mousemove", paint);
    };
  }, [paint]);

  /**
   * Stop drawing on mouse release
   */

  const exitPaint = useCallback(() => {
    setIsPainting(false);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mouseup", exitPaint);
    canvas.addEventListener("mouseleave", exitPaint);

    return () => {
      canvas.removeEventListener("mouseup", exitPaint);
      canvas.removeEventListener("mouseleave", exitPaint);
    };
  }, [exitPaint]);

  /**
   * Keyboard handling: printing text on canvas with the "text" tool selected.
   */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedTool !== "text" || !textPosition) return;
      if (ignoreKeys.includes(event.key)) {
        return;
      }

      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.font = "16px sans-serif"; //todo цвет и шрифт
      context.fillStyle = "black";

      context.fillText(event.key, textPosition.x, textPosition.y);
      const textWidth = context.measureText(event.key).width;
      setTextPosition((prevPos) => {
        if (!prevPos) return prevPos;
        return {
          x: prevPos.x + textWidth,
          y: prevPos.y,
        };
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTool, textPosition]);

  return { canvasRef, isPainting, mousePosition, snapshot, startPaint, paint, exitPaint };
};
