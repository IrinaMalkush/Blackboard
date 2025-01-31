import React from "react";

import { CoordinatesType } from "../hooks/usePencilDraw";

export const getCoordinates = (
  event: MouseEvent,
  canvasRef: React.RefObject<HTMLCanvasElement> | null,
): CoordinatesType | undefined => {
  if (!canvasRef?.current) {
    return;
  }
  const canvas: HTMLCanvasElement = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};
