import { useCallback, useEffect, useRef, useState } from "react";

import { ignoreKeys } from "../constants/ignoreKeys";
import { ColorOfToolType } from "../types/colors";
import { DrawnShape, DrawnText } from "../types/drawnTypes";
import { ToolsType } from "../types/tools";
import { getCoordinates } from "../utils/getCoordinates";

export type CoordinatesType = { x: number; y: number };

let shapeIdCounter = 1;
let textIdCounter = 1;

// Дополнительно можно определить «контстанты» для шагов курсора и т.п.
// Но пока оставим в коде, как есть.

export const useDraw = (
  selectedTool: ToolsType,
  selectedColor: ColorOfToolType,
  lineWidth: number,
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Состояния для рисования
  const [isPainting, setIsPainting] = useState(false);
  const [mouseDownPosition, setMouseDownPosition] = useState<CoordinatesType | null>(null);

  // Текущая фигура: либо { x1,y1,x2,y2 }, либо { path: [...] }
  const [currentShape, setCurrentShape] = useState<DrawnShape | null>(null);

  // Массив «зафиксированных» фигур
  const [shapes, setShapes] = useState<DrawnShape[]>([]);

  // Для текста
  const [textPosition, setTextPosition] = useState<CoordinatesType | null>(null);
  const [texts, setTexts] = useState<DrawnText[]>([]);

  // Состояние «перетаскивания» или «вращения»
  const [draggingItem, setDraggingItem] = useState<{
    type: "shape" | "text";
    id: number;
    offsetX: number;
    offsetY: number;
    rotate?: boolean;
    initialAngle?: number;
    initialMouseAngle?: number;
  } | null>(null);

  /**
   * Перерисовать холст
   */
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Очищаем холст
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Сначала рисуем зафиксированные фигуры
    shapes.forEach((shape) => {
      drawShape(ctx, shape);
    });

    // Если есть «текущая» (ещё не зафиксированная) фигура — нарисуем
    if (currentShape) {
      drawShape(ctx, currentShape);
    }

    // Теперь рисуем тексты
    texts.forEach((txt) => {
      drawText(ctx, txt);
    });
  }, [shapes, currentShape, texts]);

  /**
   * Отрисовка фигуры
   */
  function drawShape(ctx: CanvasRenderingContext2D, shape: DrawnShape) {
    const { tool, angle = 0, selected, color, lineWidth } = shape;

    // 1) Если это pencil/eraser, рисуем path
    if ((tool === "pencil" || tool === "eraser") && shape.path) {
      ctx.save();
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // для ластика используем белый
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
    ctx.save();
    ctx.font = `${txt.fontSize}px sans-serif`;
    ctx.fillStyle = txt.color;

    const lines = txt.text.split("\n");
    const lineHeight = txt.fontSize * 1.2;

    lines.forEach((line, index) => {
      const yOffset = txt.y + index * lineHeight;
      ctx.fillText(line, txt.x, yOffset);
    });

    // Если выделено — отрисуем bounding box
    if (txt.selected) {
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "blue";

      const totalHeight = lines.length * lineHeight;
      let maxWidth = 0;
      for (const line of lines) {
        const w = ctx.measureText(line).width;
        if (w > maxWidth) {
          maxWidth = w;
        }
      }
      const margin = 6;
      ctx.strokeRect(
        txt.x - margin,
        txt.y - txt.fontSize - margin,
        maxWidth + margin * 2,
        totalHeight + margin * 2 - (lineHeight - txt.fontSize),
      );

      // Рисуем упрощённый «курсор», если у данного txt есть cursorIndex
      if (typeof txt.cursorIndex === "number") {
        // Считаем, в какой строке находится курсор
        // и где примерно по горизонтали
        const { cursorLine, cursorX } = measureCursorPos(ctx, txt, txt.cursorIndex);
        // x, y для курсора
        const cx = txt.x + cursorX;
        const cy = txt.y + cursorLine * lineHeight;

        ctx.beginPath();
        // Высота курсора примем = fontSize
        ctx.moveTo(cx, cy - txt.fontSize);
        ctx.lineTo(cx, cy - txt.fontSize + lineHeight);
        ctx.strokeStyle = "red";
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
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
    // Пробегаем по строкам, вычитая длину каждой строки,
    // пока не «упрёмся» в нужный индекс
    let remaining = cursorIndex;
    let lineIdx = 0;
    let cursorX = 0;

    for (let i = 0; i < lines.length; i++) {
      // Если курсор внутри этой строки
      if (remaining <= lines[i].length) {
        // длина строки = lines[i].length
        // считаем ширину [0..remaining-1] символов
        const partialText = lines[i].slice(0, remaining);
        cursorX = ctx.measureText(partialText).width;
        lineIdx = i;
        break;
      } else {
        // курсор ещё не в этой строке
        remaining -= lines[i].length;
        // Но если cursorIndex «упал» ровно на конец строки,
        // значит мы находимся «между» этой и следующей (если есть \n).
        // Вычитаем +1 если не последняя строка?
        // Однако т.к. cursorIndex хранит абсолютную позицию
        // (включая \n как 1 символ), нужно учесть +1.
        remaining -= 1; // для \n
        if (remaining < 0) {
          remaining = 0;
        }
      }
      // если в самом конце мы вышли за все строки, cursorIndex равен длине всего текста
      // тогда курсор идёт в конец последней строки
      if (i === lines.length - 1) {
        // значит курсор после последней строки
        const partialText = lines[i];
        cursorX = ctx.measureText(partialText).width;
        lineIdx = i;
      }
    }

    return { cursorLine: lineIdx, cursorX };
  }

  // При любом изменении перерисовываем
  useEffect(() => {
    redrawCanvas();
  }, [shapes, currentShape, texts, redrawCanvas]);

  /**
   * startPaint (mousedown)
   */
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

      // Сначала ищем фигуры
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
        // Выделяем фигуру
        setShapes((prev) => prev.map((s) => ({ ...s, selected: s.id === foundShape!.id })));
        // Снимаем выделение с текста
        setTexts((prev) => prev.map((t) => ({ ...t, selected: false, cursorIndex: undefined })));

        if (rotateHandle) {
          const cx = ((foundShape.x1 ?? 0) + (foundShape.x2 ?? 0)) / 2 || 0;
          const cy = ((foundShape.y1 ?? 0) + (foundShape.y2 ?? 0)) / 2 || 0;
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
          setDraggingItem({
            type: "shape",
            id: foundShape.id,
            offsetX,
            offsetY,
          });
          canvas.style.cursor = "grabbing";
          return;
        }
      }

      // Ищем текст
      const ctx = canvas.getContext("2d");
      if (ctx) {
        let foundText: DrawnText | null = null;
        for (let i = texts.length - 1; i >= 0; i--) {
          const txt = texts[i];
          ctx.font = `${txt.fontSize}px sans-serif`;

          // Многострочный текст: нам нужно понять bounding box
          const lines = txt.text.split("\n");
          const lineHeight = txt.fontSize * 1.2;
          let maxWidth = 0;
          for (const line of lines) {
            const w = ctx.measureText(line).width;
            if (w > maxWidth) maxWidth = w;
          }
          const totalHeight = lines.length * lineHeight;

          const left = txt.x;
          const top = txt.y - txt.fontSize;
          const right = txt.x + maxWidth;
          const bottom = top + totalHeight;

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
          setTexts((prev) =>
            prev.map((t) => {
              if (t.id === foundText!.id) {
                // Выделяем этот текст
                return {
                  ...t,
                  selected: true,
                  // cursorIndex: 0 // пока что (установим правильный индекс чуть ниже)
                };
              }
              return { ...t, selected: false, cursorIndex: undefined };
            }),
          );
          setShapes((prev) => prev.map((s) => ({ ...s, selected: false })));

          // Определяем точный cursorIndex (где кликнули)
          // Для упрощения: «перебираем» каждый символ, считаем его ширину, смотрим куда пришёл x/y.
          const clickedText = foundText!;
          // Превращаем в одну строку? Или обходим посимвольно построчно.
          // Пример базовой реализации (более точно — нужно смотреть line + символ).
          let newCursorIndex = 0;
          const lines = clickedText.text.split("\n");
          const lineHeight = clickedText.fontSize * 1.2;

          let totalSoFar = 0;
          for (let li = 0; li < lines.length; li++) {
            // Верхняя граница строки
            const lineTop = clickedText.y - clickedText.fontSize + li * lineHeight;
            const lineBottom = lineTop + lineHeight;

            // Если клик попал в строку li
            if (coordinates.y >= lineTop && coordinates.y <= lineBottom) {
              // Идём посимвольно
              let foundPos = lines[li].length; // считаем, что курсор в самом конце
              for (let c = 0; c < lines[li].length; c++) {
                const part = lines[li].slice(0, c);
                const w = ctx.measureText(part).width;
                // x координата символа c ~ txt.x + w
                if (coordinates.x < clickedText.x + w) {
                  foundPos = c;
                  break;
                }
              }
              newCursorIndex = totalSoFar + foundPos;
              break;
            } else {
              // Переходим к следующей строке
              totalSoFar += lines[li].length + 1; // +1 за символ \n
            }
          }

          setTexts((prev) =>
            prev.map((t) =>
              t.id === foundText!.id
                ? {
                    ...t,
                    selected: true,
                    cursorIndex: newCursorIndex,
                  }
                : t,
            ),
          );

          setDraggingItem({
            type: "text",
            id: foundText.id,
            offsetX,
            offsetY,
          });
          canvas.style.cursor = "grabbing";
          return;
        }
      }

      // Если инструмент = "text", начинаем ввод нового текста
      if (selectedTool === "text") {
        setDraggingItem(null);
        setShapes((prev) => prev.map((s) => ({ ...s, selected: false })));
        setTexts((prev) => prev.map((t) => ({ ...t, selected: false, cursorIndex: undefined })));
        setTextPosition(coordinates);
        return;
      }

      // Иначе рисование фигуры
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

      // Иначе line / rectangle / circle / triangle
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
    [selectedTool, shapes, texts, selectedColor, lineWidth],
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

      const activeShape = shapes.find((s) => s.selected);
      if (activeShape && !activeShape.path) {
        const right = Math.max(activeShape.x1 ?? 0, activeShape.x2 ?? 0);
        const top = Math.min(activeShape.y1 ?? 0, activeShape.y2 ?? 0);
        if (
          coordinates.x >= right - 10 &&
          coordinates.x <= right &&
          coordinates.y >= top &&
          coordinates.y <= top + 10
        ) {
          canvas.style.cursor = "grab";
        }
      }

      if (draggingItem) {
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
            // простое перетаскивание
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
            canvas.style.cursor = "grabbing";
            return;
          }
        } else if (draggingItem.type === "text") {
          // перемещаем текст
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
          canvas.style.cursor = "grabbing";
          return;
        }
      }

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

      if (isPainting && currentShape && mouseDownPosition) {
        setCurrentShape({
          ...currentShape,
          x2: coordinates.x,
          y2: coordinates.y,
        });
      }
    },
    [draggingItem, shapes, currentShape, isPainting, mouseDownPosition],
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
      // Поворот по R (15 градусов)
      if (event.key === "r" || event.key === "R") {
        setShapes((prev) =>
          prev.map((sh) => (sh.selected ? { ...sh, angle: (sh.angle ?? 0) + 15 } : sh)),
        );
      }

      if (selectedTool !== "text") return;

      const activeText = texts.find((t) => t.selected);
      if (activeText) {
        if (ignoreKeys.includes(event.key)) return;

        // Если нет cursorIndex — установим в конец
        const cursorIndex = activeText.cursorIndex ?? activeText.text.length;

        // Стрелки влево/вправо
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

        // Перенос строки
        if (event.key === "Enter") {
          const newText =
            activeText.text.slice(0, cursorIndex) + "\n" + activeText.text.slice(cursorIndex);
          setTexts((prev) =>
            prev.map((txt) =>
              txt.id === activeText.id
                ? {
                    ...txt,
                    text: newText,
                    cursorIndex: cursorIndex + 1,
                  }
                : txt,
            ),
          );
          return;
        }

        // Backspace
        if (event.key === "Backspace") {
          if (cursorIndex > 0) {
            // Удаляем символ слева от cursorIndex
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

        // Добавляем обычный символ
        if (event.key.length === 1) {
          const newText =
            activeText.text.slice(0, cursorIndex) + event.key + activeText.text.slice(cursorIndex);
          setTexts((prev) =>
            prev.map((txt) =>
              txt.id === activeText.id
                ? {
                    ...txt,
                    text: newText,
                    cursorIndex: cursorIndex + 1,
                  }
                : txt,
            ),
          );
        }
        return;
      }

      // Если текст не выделен, но есть textPosition — создаём новый при вводе
      if (textPosition) {
        if (ignoreKeys.includes(event.key)) return;
        if (!canvasRef.current) return;

        if (event.key === "Enter") {
          // Игнорируем или можно создать текст с одним \n
          return;
        }

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
              cursorIndex: 1, // т.к. добавили первый символ
            },
          ]);
          setTextPosition(null);
        } else if (event.key === "Backspace") {
          // Игнорируем
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTool, textPosition, texts, selectedColor]);

  return {
    canvasRef,
    shapes,
    texts,
  };
};
