import { ToolsType } from "./tools";

export interface DrawnShape {
  id: number;
  tool: ToolsType;
  img?: HTMLImageElement; // Сам загруженный объект
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  // Массив точек для pencil/eraser
  path?: { x: number; y: number }[];
  color: string;
  lineWidth: number;
  selected: boolean;
  angle?: number;
}

export interface DrawnText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  selected: boolean;
  cursorIndex?: number;
  angle?: number; // в градусах
}
