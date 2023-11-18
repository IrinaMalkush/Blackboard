import { useCallback, useEffect, useRef, useState } from "react";

import { Tools } from "../types/tools";

type CoordinatesType = {
  x: number;
  y: number;
};

export const usePencilDraw = (selectedTool: Tools) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [mousePosition, setMousePosition] = useState<CoordinatesType | undefined>(undefined);
  const [snapshot, setSnapshot] = useState<ImageData | undefined>(undefined);

  /**
   * Start drawing when the mouse is pressed
   */

  const startPaint = useCallback((event: MouseEvent) => {
    const coordinates = getCoordinates(event);
    if (coordinates) {
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
  }, []);

  const getCoordinates = (event: MouseEvent): CoordinatesType | undefined => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    return { x: event.pageX - canvas.offsetLeft, y: event.pageY - canvas.offsetTop };
  };

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
        const newMousePosition = getCoordinates(event);
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
      context.strokeStyle = selectedTool === "eraser" ? "#f9f8f8" : "red";
      context.lineJoin = "round";
      context.lineWidth = 3;

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

  return canvasRef;
};
