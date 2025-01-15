import React, { useCallback, useEffect, useRef, useState } from "react";

import { ignoreKeys } from "../constants/ignoreKeys";
import { ColorOfToolType } from "../types/colors";
import { DrawnShape, DrawnText } from "../types/drawnTypes";
import { ToolsType } from "../types/tools";
import { getCoordinates } from "../utils/getCoordinates";

export type CoordinatesType = { x: number; y: number };

let shapeIdCounter = 1;
let textIdCounter = 1;

export const useDraw = (
  selectedTool: ToolsType,
  selectedColor: ColorOfToolType,
  lineWidth: number,
  imageForInsert: HTMLImageElement | null,
  setImageForInsert: React.Dispatch<React.SetStateAction<HTMLImageElement | null>>,
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [mouseDownPosition, setMouseDownPosition] = useState<CoordinatesType | null>(null);
  const [currentShape, setCurrentShape] = useState<DrawnShape | null>(null);
  const [shapes, setShapes] = useState<DrawnShape[]>([]);
  const [textPosition, setTextPosition] = useState<CoordinatesType | null>(null);
  const [texts, setTexts] = useState<DrawnText[]>([]);

  const [draggingItem, setDraggingItem] = useState<{
    type: "shape" | "text";
    id: number;
    offsetX: number;
    offsetY: number;
    rotate?: boolean;
    initialAngle?: number;
    initialMouseAngle?: number;
  } | null>(null);

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach((shape) => {
      drawShape(ctx, shape);
    });

    if (currentShape) {
      drawShape(ctx, currentShape);
    }

    texts.forEach((txt) => {
      drawText(ctx, txt);
    });
  }, [shapes, currentShape, texts]);

  /**
   * Отрисовка фигуры
   */
  function drawShape(ctx: CanvasRenderingContext2D, shape: DrawnShape) {
    const { tool, angle = 0, selected, color, lineWidth } = shape;
    if (shape.tool === "image" && shape.img) {
      ctx.save();
      const { x1, y1, x2, y2, angle = 0 } = shape;

      if (x1 != null && x2 != null && y1 != null && y2 != null) {
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        const width = x2 - x1;
        const height = y2 - y1;
        ctx.drawImage(shape.img, x1, y1, width, height);

        // Если selected, рисуем bounding box и handle
        if (shape.selected) {
          ctx.save();
          ctx.strokeStyle = "blue";
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(x1, y1, width, height);

          // handle
          const handleSize = 10;
          const hx = x1 + width - handleSize;
          const hy = y1;
          ctx.setLineDash([]);
          ctx.strokeRect(hx, hy, handleSize, handleSize);
          ctx.restore();
        }
      }

      ctx.restore();
      return;
    }

    // 1) Если это pencil/eraser, рисуем path
    if ((tool === "pencil" || tool === "eraser") && shape.path) {
      ctx.save();
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = tool === "eraser" ? "#f9f8f8" : color;

      const points = shape.path;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Если selected, нарисуем bounding box
      if (selected) {
        ctx.save();
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        let minX = points[0].x;
        let maxX = points[0].x;
        let minY = points[0].y;
        let maxY = points[0].y;
        for (const p of points) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.restore();
      }
      ctx.restore();
      return;
    }

    // 2) Иначе это line/rectangle/circle/triangle
    const { x1, y1, x2, y2 } = shape;
    if (x1 == null || x2 == null || y1 == null || y2 == null) return;

    // Настраиваем контекст
    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.lineJoin = "round";

    // Центр для вращения
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const angleRad = (angle * Math.PI) / 180;

    ctx.translate(centerX, centerY);
    ctx.rotate(angleRad);
    ctx.translate(-centerX, -centerY);

    if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (tool === "rectangle") {
      ctx.beginPath();
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    } else if (tool === "circle") {
      ctx.beginPath();
      const rx = (x2 - x1) / 2;
      const ry = (y2 - y1) / 2;
      ctx.ellipse(x1 + rx, y1 + ry, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === "triangle") {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x1 * 2 - x2, y2);
      ctx.closePath();
      ctx.stroke();
    }
    // Восстанавливаем трансформацию в 0
    ctx.restore();

    // Если фигура выделена
    if (selected) {
      ctx.save();
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 3]);
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const top = Math.min(y1, y2);
      const bottom = Math.max(y1, y2);
      ctx.strokeRect(left, top, right - left, bottom - top);
      ctx.restore();

      // Рисуем «ручку» (handle) для поворота в правом верхнем углу bounding box
      const handleSize = 10;
      const hx = right - handleSize;
      const hy = top;
      ctx.save();
      ctx.strokeStyle = "blue";
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.strokeRect(hx, hy, handleSize, handleSize);
      ctx.restore();
    }
  }

  /**
   * Отрисовать надпись (с учётом переноса строки)
   */
  function drawText(ctx: CanvasRenderingContext2D, txt: DrawnText) {
    const angle = txt.angle ?? 0;
    const angleRad = (angle * Math.PI) / 180;

    ctx.save();
    ctx.font = `${txt.fontSize}px sans-serif`;
    ctx.fillStyle = txt.color;

    const lines = txt.text.split("\n");
    const lineHeight = txt.fontSize * 1.2;
    let maxWidth = 0;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxWidth) {
        maxWidth = w;
      }
    }
    const totalHeight = lines.length * lineHeight;

    // Центр для вращения
    const centerX = txt.x + maxWidth / 2;
    const centerY = txt.y - txt.fontSize + totalHeight / 2;

    // Поворачиваем контекст
    ctx.translate(centerX, centerY);
    ctx.rotate(angleRad);
    ctx.translate(-centerX, -centerY);

    // Рисуем строки текста
    lines.forEach((line, index) => {
      const lineY = txt.y + index * lineHeight;
      ctx.fillText(line, txt.x, lineY);
    });

    // Если выделено — bounding box + handle
    if (txt.selected) {
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "blue";
      const margin = 6;

      const left = txt.x - margin;
      const top = txt.y - txt.fontSize - margin;
      const width = maxWidth + margin * 2;
      const height = totalHeight + margin * 2 - (lineHeight - txt.fontSize);
      ctx.strokeRect(left, top, width, height);

      // Handle
      const handleSize = 10;
      const hx = left + width - handleSize;
      const hy = top;
      ctx.setLineDash([]);
      ctx.strokeRect(hx, hy, handleSize, handleSize);
    }

    if (txt.selected && typeof txt.cursorIndex === "number") {
      const { cursorLine, cursorX } = measureCursorPos(ctx, txt, txt.cursorIndex);
      const cx = txt.x + cursorX;
      const cy = txt.y + cursorLine * lineHeight;

      ctx.beginPath();
      ctx.moveTo(cx, cy - txt.fontSize);
      ctx.lineTo(cx, cy - txt.fontSize + lineHeight);
      ctx.strokeStyle = "red";
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Утилита: определить, в какой «строке» и на каком «X-смещении» будет курсор
   * с учётом текущего текста (включая `\n`).
   */
  function measureCursorPos(
    ctx: CanvasRenderingContext2D,
    txt: DrawnText,
    cursorIndex: number,
  ): { cursorLine: number; cursorX: number } {
    const lines = txt.text.split("\n");

    let remaining = cursorIndex;
    let lineIdx = 0;
    let cursorX = 0;

    for (let i = 0; i < lines.length; i++) {
      if (remaining <= lines[i].length) {
        const partialText = lines[i].slice(0, remaining);
        cursorX = ctx.measureText(partialText).width;
        lineIdx = i;
        break;
      } else {
        remaining -= lines[i].length;
        remaining -= 1; // для \n
        if (remaining < 0) {
          remaining = 0;
        }
        if (i === lines.length - 1) {
          // курсор после последней строки
          const partialText = lines[i];
          cursorX = ctx.measureText(partialText).width;
          lineIdx = i;
        }
      }
    }

    return { cursorLine: lineIdx, cursorX };
  }

  useEffect(() => {
    redrawCanvas();
  }, [shapes, currentShape, texts, redrawCanvas]);

  const startPaint = useCallback(
    (event: MouseEvent) => {
      if (!canvasRef.current) return;
      const coordinates = getCoordinates(event, canvasRef);
      if (!coordinates) return;

      const canvas = canvasRef.current;
      canvas.style.cursor = "default";

      let foundShape: DrawnShape | null = null;
      let offsetX = 0;
      let offsetY = 0;
      let rotateHandle = false;

      // 1) Сначала ищем фигуры
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shp = shapes[i];
        if (shp.path) {
          let minX = shp.path[0].x;
          let maxX = shp.path[0].x;
          let minY = shp.path[0].y;
          let maxY = shp.path[0].y;
          for (const p of shp.path) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          }
          if (
            coordinates.x >= minX &&
            coordinates.x <= maxX &&
            coordinates.y >= minY &&
            coordinates.y <= maxY
          ) {
            foundShape = shp;
            offsetX = coordinates.x - minX;
            offsetY = coordinates.y - minY;
            break;
          }
        } else {
          const left = Math.min(shp.x1 ?? 0, shp.x2 ?? 0);
          const right = Math.max(shp.x1 ?? 0, shp.x2 ?? 0);
          const top = Math.min(shp.y1 ?? 0, shp.y2 ?? 0);
          const bottom = Math.max(shp.y1 ?? 0, shp.y2 ?? 0);

          if (shp.selected) {
            // handle 10x10 в правом верхнем углу
            const handleSize = 10;
            const hx1 = right - handleSize;
            const hy1 = top;
            const hx2 = right;
            const hy2 = top + handleSize;
            if (
              coordinates.x >= hx1 &&
              coordinates.x <= hx2 &&
              coordinates.y >= hy1 &&
              coordinates.y <= hy2
            ) {
              foundShape = shp;
              rotateHandle = true;
              break;
            }
          }

          if (
            coordinates.x >= left &&
            coordinates.x <= right &&
            coordinates.y >= top &&
            coordinates.y <= bottom
          ) {
            foundShape = shp;
            offsetX = coordinates.x - (shp.x1 ?? 0);
            offsetY = coordinates.y - (shp.y1 ?? 0);
            break;
          }
        }
      }

      if (foundShape) {
        setShapes((prev) => prev.map((s) => ({ ...s, selected: s.id === foundShape!.id })));
        // сброс выделения текста
        setTexts((prev) => prev.map((t) => ({ ...t, selected: false, cursorIndex: undefined })));

        if (rotateHandle) {
          // вращаем фигуру
          const cx = ((foundShape.x1 ?? 0) + (foundShape.x2 ?? 0)) / 2;
          const cy = ((foundShape.y1 ?? 0) + (foundShape.y2 ?? 0)) / 2;
          const dx = coordinates.x - cx;
          const dy = coordinates.y - cy;
          const initialMouseAngle = Math.atan2(dy, dx);
          setDraggingItem({
            type: "shape",
            id: foundShape.id,
            offsetX: 0,
            offsetY: 0,
            rotate: true,
            initialAngle: foundShape.angle ?? 0,
            initialMouseAngle,
          });
          canvas.style.cursor = "grabbing";
          return;
        } else {
          // перетаскивание
          setDraggingItem({
            type: "shape",
            id: foundShape.id,
            offsetX,
            offsetY,
          });
          canvas.style.cursor = "move";
          return;
        }
      }

      // 2) Если не нашли фигуру, ищем текст
      const ctx = canvas.getContext("2d");
      if (ctx) {
        let foundText: DrawnText | null = null;
        for (let i = texts.length - 1; i >= 0; i--) {
          const txt = texts[i];
          ctx.font = `${txt.fontSize}px sans-serif`;
          const lines = txt.text.split("\n");
          const lineHeight = txt.fontSize * 1.2;
          let maxWidth = 0;
          for (const line of lines) {
            const w = ctx.measureText(line).width;
            if (w > maxWidth) maxWidth = w;
          }
          const totalHeight = lines.length * lineHeight;
          const margin = 6;
          const left = txt.x - margin;
          const top = txt.y - txt.fontSize - margin;
          const width = maxWidth + margin * 2;
          const height = totalHeight + margin * 2 - (lineHeight - txt.fontSize);
          const right = left + width;
          const bottom = top + height;

          // Проверяем handle (10x10) в правом верхнем углу
          if (txt.selected) {
            const handleSize = 10;
            const hx1 = right - handleSize;
            const hy1 = top;
            const hx2 = right;
            const hy2 = top + handleSize;
            if (
              coordinates.x >= hx1 &&
              coordinates.x <= hx2 &&
              coordinates.y >= hy1 &&
              coordinates.y <= hy2
            ) {
              foundText = txt;
              rotateHandle = true;
              break;
            }
          }

          // Проверяем сам box
          if (
            coordinates.x >= left &&
            coordinates.x <= right &&
            coordinates.y >= top &&
            coordinates.y <= bottom
          ) {
            foundText = txt;
            offsetX = coordinates.x - txt.x;
            offsetY = coordinates.y - txt.y;
            break;
          }
        }

        if (foundText) {
          let newCursorIndex = 0;
          {
            // Разбиваем текст на строки
            const lines = foundText.text.split("\n");
            const lineHeight = foundText.fontSize * 1.2;

            // Считаем, какую строку кликнули по Y
            let totalSoFar = 0; // это будет «суммарный индекс» с учётом предыдущих строк
            let clickedLineIndex = -1;
            for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
              const lineTop = foundText.y + lineIdx * lineHeight - foundText.fontSize;
              const lineBottom = lineTop + lineHeight;
              if (coordinates.y >= lineTop && coordinates.y <= lineBottom) {
                clickedLineIndex = lineIdx;
                break;
              }
              // если не попали в эту строку, добавим (lines[lineIdx].length + 1) к totalSoFar
              totalSoFar += lines[lineIdx].length + 1; // +1 за символ \n
            }

            // Если мы вообще не попали ни в одну строку (клик выше/ниже),
            // можно поставить курсор в начало/конец текста. Или игнорировать.
            if (clickedLineIndex < 0) {
              // Пусть будет в конец:
              newCursorIndex = foundText.text.length;
            } else {
              // Кликнули в строку clickedLineIndex
              // Идём посимвольно по lines[clickedLineIndex], чтобы понять,
              // между какими символами остановиться
              const lineText = lines[clickedLineIndex];
              let cIndex = 0; // индекс символа внутри строки
              // «Левая граница» строки — это foundText.x
              // Учитываем, что (lineTop) ~ foundText.y + lineIdx * lineHeight - foundText.fontSize
              // Но по X нам достаточно смотреть (coordinates.x - foundText.x)

              for (let c = 0; c < lineText.length; c++) {
                const part = lineText.slice(0, c);
                const w = ctx.measureText(part).width;
                // если клик левее "c"-го символа, останавливаемся
                if (coordinates.x < foundText.x + w) {
                  cIndex = c;
                  break;
                }
                // если дошли до конца
                if (c === lineText.length - 1) {
                  cIndex = lineText.length;
                }
              }

              // теперь полный индекс = totalSoFar + cIndex
              newCursorIndex = totalSoFar + cIndex;
            }
          }

          // Теперь меняем состояние
          setTexts((prev) =>
            prev.map((t) =>
              t.id === foundText!.id
                ? {
                    ...t,
                    selected: true,
                    cursorIndex: newCursorIndex, // <-- ключевой момент
                  }
                : {
                    ...t,
                    selected: false,
                    cursorIndex: undefined,
                  },
            ),
          );
          setShapes((prev) => prev.map((s) => ({ ...s, selected: false })));
          if (rotateHandle) {
            // вращаем текст
            const angle0 = foundText.angle ?? 0;
            // Центр текста (упрощённо считаем)
            ctx.font = `${foundText.fontSize}px sans-serif`;
            const lines = foundText.text.split("\n");
            let maxWidth = 0;
            lines.forEach((l) => {
              const w = ctx.measureText(l).width;
              if (w > maxWidth) maxWidth = w;
            });
            const totalHeight = lines.length * foundText.fontSize * 1.2;

            // Центр (приблизительно)
            const cx = foundText.x + maxWidth / 2;
            const cy = foundText.y - foundText.fontSize + totalHeight / 2;

            const dx = coordinates.x - cx;
            const dy = coordinates.y - cy;
            const initialMouseAngle = Math.atan2(dy, dx);
            setDraggingItem({
              type: "text",
              id: foundText.id,
              offsetX: 0,
              offsetY: 0,
              rotate: true,
              initialAngle: angle0,
              initialMouseAngle,
            });
            canvas.style.cursor = "grabbing";
            return;
          } else {
            // перетаскивание
            setDraggingItem({
              type: "text",
              id: foundText.id,
              offsetX,
              offsetY,
            });
            canvas.style.cursor = "move";
            return;
          }
        }
      }

      // 3) Если инструмент = "text" и не нашли существующий
      if (selectedTool === "text") {
        setDraggingItem(null);
        setShapes((prev) => prev.map((s) => ({ ...s, selected: false })));
        setTexts((prev) => prev.map((t) => ({ ...t, selected: false, cursorIndex: undefined })));
        setTextPosition(coordinates);
        return;
      }

      if (selectedTool === "image" && imageForInsert) {
        const newId = shapeIdCounter++;
        const newShape: DrawnShape = {
          id: newId,
          tool: "image",
          img: imageForInsert,
          x1: coordinates.x,
          y1: coordinates.y,
          x2: coordinates.x + 100,
          y2: coordinates.y + 100,
          angle: 0,
          selected: true,
          color: "#000", // не используется
          lineWidth: 1,
        };
        setShapes((prev) => [...prev, newShape]);
        setImageForInsert(null);
        return;
      }

      // Иначе рисуем фигуру
      if (selectedTool === "pencil" || selectedTool === "eraser") {
        setIsPainting(true);
        const newId = shapeIdCounter++;
        const newShape: DrawnShape = {
          id: newId,
          tool: selectedTool,
          path: [{ x: coordinates.x, y: coordinates.y }],
          color: selectedTool === "eraser" ? "#f9f8f8" : selectedColor,
          lineWidth,
          selected: false,
        };
        setCurrentShape(newShape);
        return;
      }

      // line / rectangle / circle / triangle
      setIsPainting(true);
      setMouseDownPosition(coordinates);
      setShapes((prev) => prev.map((s) => ({ ...s, selected: false })));
      const newId = shapeIdCounter++;
      const newShape: DrawnShape = {
        id: newId,
        tool: selectedTool,
        x1: coordinates.x,
        y1: coordinates.y,
        x2: coordinates.x,
        y2: coordinates.y,
        color: selectedColor,
        lineWidth,
        selected: true,
        angle: 0,
      };
      setCurrentShape(newShape);
    },
    [selectedTool, imageForInsert, selectedColor, lineWidth, shapes, texts],
  );

  /**
   * paint (mousemove)
   */
  const paint = useCallback(
    (event: MouseEvent) => {
      if (!canvasRef.current) return;
      const coordinates = getCoordinates(event, canvasRef);
      if (!coordinates) return;

      const canvas = canvasRef.current;
      canvas.style.cursor = "default";

      // Если перетаскиваем или вращаем
      if (draggingItem) {
        // 1) Фигуры
        if (draggingItem.type === "shape") {
          if (draggingItem.rotate) {
            const shp = shapes.find((s) => s.id === draggingItem.id);
            if (!shp || shp.path) return;
            const cx = ((shp.x1 ?? 0) + (shp.x2 ?? 0)) / 2;
            const cy = ((shp.y1 ?? 0) + (shp.y2 ?? 0)) / 2;
            const dx = coordinates.x - cx;
            const dy = coordinates.y - cy;
            const currentAngle = Math.atan2(dy, dx);
            const delta = currentAngle - (draggingItem.initialMouseAngle ?? 0);
            const newAngle = (draggingItem.initialAngle ?? 0) + (delta * 180) / Math.PI;
            setShapes((prev) => prev.map((s) => (s.id === shp.id ? { ...s, angle: newAngle } : s)));
            canvas.style.cursor = "grabbing";
            return;
          } else {
            // перетаскивание
            setShapes((prev) =>
              prev.map((s) => {
                if (s.id === draggingItem.id) {
                  if (s.path) {
                    const dx = coordinates.x - draggingItem.offsetX;
                    const dy = coordinates.y - draggingItem.offsetY;
                    const shiftX = dx - (s.path[0]?.x ?? dx);
                    const shiftY = dy - (s.path[0]?.y ?? dy);
                    const newPath = s.path.map((p) => ({
                      x: p.x + shiftX,
                      y: p.y + shiftY,
                    }));
                    return { ...s, path: newPath };
                  } else {
                    const w = (s.x2 ?? 0) - (s.x1 ?? 0);
                    const h = (s.y2 ?? 0) - (s.y1 ?? 0);
                    const x1 = coordinates.x - draggingItem.offsetX;
                    const y1 = coordinates.y - draggingItem.offsetY;
                    return {
                      ...s,
                      x1,
                      y1,
                      x2: x1 + w,
                      y2: y1 + h,
                    };
                  }
                }
                return s;
              }),
            );
            canvas.style.cursor = "move";
            return;
          }
        }

        // 2) Текст (NEW: поддержка rotate)
        else if (draggingItem.type === "text") {
          if (draggingItem.rotate) {
            const txt = texts.find((t) => t.id === draggingItem.id);
            if (!txt) return;
            // Снова ищем центр
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.font = `${txt.fontSize}px sans-serif`;
            const lines = txt.text.split("\n");
            let maxWidth = 0;

            lines.forEach((l) => {
              const w = ctx.measureText(l).width;
              if (w > maxWidth) maxWidth = w;
            });
            const totalHeight = lines.length * txt.fontSize * 1.2;

            const cx = txt.x + maxWidth / 2;
            const cy = txt.y - txt.fontSize + totalHeight / 2;
            const dx = coordinates.x - cx;
            const dy = coordinates.y - cy;
            const currentAngle = Math.atan2(dy, dx);
            const delta = currentAngle - (draggingItem.initialMouseAngle ?? 0);
            const newAngle = (draggingItem.initialAngle ?? 0) + (delta * 180) / Math.PI;

            setTexts((prev) => prev.map((t) => (t.id === txt.id ? { ...t, angle: newAngle } : t)));
            canvas.style.cursor = "grabbing";
            return;
          } else {
            // перетаскиваем текст
            setTexts((prev) =>
              prev.map((t) => {
                if (t.id === draggingItem.id) {
                  const x = coordinates.x - draggingItem.offsetX;
                  const y = coordinates.y - draggingItem.offsetY;
                  return { ...t, x, y };
                }
                return t;
              }),
            );
            canvas.style.cursor = "move";
            return;
          }
        }
      }

      // Если рисуем pencil/eraser
      if (
        isPainting &&
        currentShape &&
        (currentShape.tool === "pencil" || currentShape.tool === "eraser")
      ) {
        const newPath = currentShape.path ?? [];
        newPath.push({ x: coordinates.x, y: coordinates.y });
        setCurrentShape({ ...currentShape, path: newPath });
        return;
      }

      // Иначе line/rectangle/circle/triangle
      if (isPainting && currentShape && mouseDownPosition) {
        setCurrentShape({
          ...currentShape,
          x2: coordinates.x,
          y2: coordinates.y,
        });
      }
    },
    [draggingItem, shapes, texts, currentShape, isPainting, mouseDownPosition],
  );

  /**
   * Завершение рисования
   */
  const exitPaint = useCallback(() => {
    setIsPainting(false);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = "default";
    }
    setDraggingItem(null);

    if (currentShape) {
      setShapes((prev) => [...prev, currentShape]);
      setCurrentShape(null);
    }
  }, [currentShape]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    canvas.addEventListener("mousedown", startPaint);
    canvas.addEventListener("mousemove", paint);
    canvas.addEventListener("mouseup", exitPaint);
    canvas.addEventListener("mouseleave", exitPaint);

    return () => {
      canvas.removeEventListener("mousedown", startPaint);
      canvas.removeEventListener("mousemove", paint);
      canvas.removeEventListener("mouseup", exitPaint);
      canvas.removeEventListener("mouseleave", exitPaint);
    };
  }, [startPaint, paint, exitPaint]);

  /**
   * Клавиатурные события
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        setShapes((prev) =>
          prev.map((sh) => (sh.selected ? { ...sh, angle: (sh.angle ?? 0) + 15 } : sh)),
        );
      }

      if (selectedTool !== "text") return;

      const activeText = texts.find((t) => t.selected);
      if (activeText) {
        if (ignoreKeys.includes(event.key)) return;
        const cursorIndex = activeText.cursorIndex ?? activeText.text.length;

        if (event.key === "ArrowLeft") {
          if (cursorIndex > 0) {
            setTexts((prev) =>
              prev.map((txt) =>
                txt.id === activeText.id ? { ...txt, cursorIndex: cursorIndex - 1 } : txt,
              ),
            );
          }
          return;
        }
        if (event.key === "ArrowRight") {
          if (cursorIndex < activeText.text.length) {
            setTexts((prev) =>
              prev.map((txt) =>
                txt.id === activeText.id ? { ...txt, cursorIndex: cursorIndex + 1 } : txt,
              ),
            );
          }
          return;
        }

        // Enter -> перенос строки
        if (event.key === "Enter") {
          const newText =
            activeText.text.slice(0, cursorIndex) + "\n" + activeText.text.slice(cursorIndex);
          setTexts((prev) =>
            prev.map((txt) =>
              txt.id === activeText.id
                ? { ...txt, text: newText, cursorIndex: cursorIndex + 1 }
                : txt,
            ),
          );
          return;
        }

        // Backspace
        if (event.key === "Backspace") {
          if (cursorIndex > 0) {
            const newText =
              activeText.text.slice(0, cursorIndex - 1) + activeText.text.slice(cursorIndex);
            setTexts((prev) =>
              prev.map((txt) =>
                txt.id === activeText.id
                  ? {
                      ...txt,
                      text: newText,
                      cursorIndex: cursorIndex - 1,
                    }
                  : txt,
              ),
            );
          }
          return;
        }

        // Пример: если нажата обычная буква
        if (event.key.length === 1) {
          setTexts((prev) =>
            prev.map((txt) => {
              if (txt.id === activeText.id) {
                // Собираем новый текст
                const newText =
                  txt.text.slice(0, cursorIndex) + event.key + txt.text.slice(cursorIndex);
                return {
                  ...txt,
                  text: newText,
                  cursorIndex: cursorIndex + 1,
                };
              }
              return txt;
            }),
          );
        }
        return;
      }

      // Если текст не выделен, но есть textPosition — создаём новый
      if (textPosition) {
        if (ignoreKeys.includes(event.key)) return;
        if (!canvasRef.current) return;

        if (event.key === "Enter") return;

        if (event.key.length === 1) {
          const newId = textIdCounter++;
          setTexts((prev) => [
            ...prev.map((t) => ({ ...t, selected: false, cursorIndex: undefined })),
            {
              id: newId,
              text: event.key,
              x: textPosition.x,
              y: textPosition.y,
              color: selectedColor,
              fontSize: 16,
              selected: true,
              cursorIndex: 1,
              // NEW: добавим angle = 0
              angle: 0,
            },
          ]);
          setTextPosition(null);
        } else if (event.key === "Backspace") {
          // игнор
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTool, textPosition, texts, selectedColor]);

  /**
   * Сохранить текущее содержимое canvas в файл PNG
   */
  const saveCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");

    // Создаем временную ссылку и кликаем по ней, чтобы скачать
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "myDrawing.png"; // любое имя файла
    link.click();

    // Альтернативно, можно добавить link в документ,
    // затем вызвать link.click() и удалить link
  }, []);

  return {
    canvasRef,
    shapes,
    texts,
    saveCanvas,
  };
};
