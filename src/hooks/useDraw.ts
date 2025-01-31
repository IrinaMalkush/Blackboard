import { jsPDF } from "jspdf";
import * as pdfjsLib from "pdfjs-dist";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { ignoreKeys } from "../constants/ignoreKeys";
import { ColorOfToolType } from "../types/colors";
import { DrawnShape, DrawnText } from "../types/drawnTypes";
import { ToolsType } from "../types/tools";
import { getCoordinates } from "../utils/getCoordinates";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export type CoordinatesType = { x: number; y: number };

type DraggingOperation = "move" | "rotate" | "resize";

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
  const [shapesByPage, setShapesByPage] = useState<DrawnShape[][]>([]);
  const [textsByPage, setTextsByPage] = useState<DrawnText[][]>([]);
  const [textPosition, setTextPosition] = useState<CoordinatesType | null>(null);
  const [pdfPages, setPdfPages] = useState<HTMLCanvasElement[]>([]);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [draggingItem, setDraggingItem] = useState<{
    type: "shape" | "text";
    id: number;
    offsetX: number;
    offsetY: number;
    rotate?: boolean;
    operation: DraggingOperation;
    initialAngle?: number;
    initialMouseAngle?: number;
  } | null>(null);

  useEffect(() => {
    if (pdfPages.length === 0) {
      const w = window.innerWidth - 150;
      const h = window.innerHeight - 86;
      const blankCanvas = document.createElement("canvas");
      blankCanvas.width = w;
      blankCanvas.height = h;

      const ctx = blankCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#f9f8f8";
        ctx.fillRect(0, 0, w, h);
      }

      setPdfPages([blankCanvas]);
    }
  }, [pdfPages]);

  const handleFileUpload = async (file: File) => {
    const fileType = file.type;

    if (fileType === "application/pdf") {
      const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
      const pages: HTMLCanvasElement[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const pageCanvas = document.createElement("canvas");
        const pageCtx = pageCanvas.getContext("2d");

        pageCanvas.width = viewport.width;
        pageCanvas.height = viewport.height;

        if (pageCtx) {
          await page.render({ canvasContext: pageCtx, viewport }).promise;
          pages.push(pageCanvas);
        }
      }
      setPdfPages((prev) => [...prev, ...pages]);
      setShapesByPage((prev) => {
        const newArr = [...prev];
        for (let i = 0; i < pages.length; i++) {
          newArr.push([]); // пустой массив фигур для каждой новой страницы
        }
        return newArr;
      });
      setTextsByPage((prev) => {
        const newArr = [...prev];
        for (let i = 0; i < pages.length; i++) {
          newArr.push([]); // пустой массив текстов для каждой новой страницы
        }
        return newArr;
      });
    } else if (fileType.startsWith("image/")) {
      const img = new Image();
      img.onload = () => {
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = img.width;
        pageCanvas.height = img.height;

        const pageCtx = pageCanvas.getContext("2d");
        if (pageCtx) {
          pageCtx.drawImage(img, 0, 0, img.width, img.height);
        }
        setPdfPages((prev) => [...prev, pageCanvas]);
        setShapesByPage((prev) => [...prev, []]);
        setTextsByPage((prev) => [...prev, []]);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (pdfPages.length > 0 && currentPageIndex < pdfPages.length) {
      const pageCanvas = pdfPages[currentPageIndex];
      if (pageCanvas) {
        ctx.drawImage(pageCanvas, 0, 0);
      }
    }

    if (uploadedImage) {
      ctx.drawImage(uploadedImage, 0, 0, uploadedImage.width, uploadedImage.height);
    }

    const shapes = shapesByPage[currentPageIndex] || [];
    shapes.forEach((shape) => drawShape(ctx, shape));

    if (currentShape) {
      drawShape(ctx, currentShape);
    }

    const texts = textsByPage[currentPageIndex] || [];
    texts.forEach((txt) => drawText(ctx, txt));
  }, [pdfPages, currentPageIndex, uploadedImage, shapesByPage, currentShape, textsByPage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maxW = window.innerWidth - 124;
    const maxH = window.innerHeight - 110;

    if (pdfPages.length > 0 && pdfPages[currentPageIndex]) {
      const pageCanvas = pdfPages[currentPageIndex];
      const finalW = Math.max(pageCanvas.width, maxW);
      const finalH = Math.max(pageCanvas.height, maxH);

      canvas.width = finalW;
      canvas.height = finalH;
    } else {
      canvas.width = maxW;
      canvas.height = maxH;
    }
    redrawCanvas();
  }, [pdfPages, currentPageIndex, redrawCanvas]);

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
        const angleRad = (angle * Math.PI) / 180;
        ctx.translate(centerX, centerY);
        ctx.rotate(angleRad);
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
          const rotateHandlePos = { x: x2 - handleSize, y: y1 };
          const resizeHandlePos = { x: x2 - handleSize, y: y2 - handleSize };

          // Вращаем позиции ручек
          const rotatedRotateHandle = rotatePoint(
            centerX,
            centerY,
            rotateHandlePos.x,
            rotateHandlePos.y,
            angleRad,
          );
          const rotatedResizeHandle = rotatePoint(
            centerX,
            centerY,
            resizeHandlePos.x,
            resizeHandlePos.y,
            angleRad,
          );

          // Рисуем ручку для вращения
          ctx.setLineDash([]);
          ctx.strokeRect(
            rotatedRotateHandle.x - handleSize / 2,
            rotatedRotateHandle.y - handleSize / 2,
            handleSize,
            handleSize,
          );

          // Рисуем ручку для изменения размера
          ctx.strokeRect(
            rotatedResizeHandle.x - handleSize / 2,
            rotatedResizeHandle.y - handleSize / 2,
            handleSize,
            handleSize,
          );

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

    // Если выделено — bounding box + ручки
    if (txt.selected) {
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "blue";
      const margin = 6;

      const left = txt.x - margin;
      const top = txt.y - txt.fontSize - margin;
      const width = maxWidth + margin * 2;
      const height = totalHeight + margin * 2 - (lineHeight - txt.fontSize);
      ctx.strokeRect(left, top, width, height);

      // Ручка для вращения (правый верхний угол)
      const handleSize = 10;
      const rotateHx = left + width - handleSize;
      const rotateHy = top;
      ctx.setLineDash([]);
      ctx.strokeRect(rotateHx, rotateHy, handleSize, handleSize);
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

  function renderPageToCanvas(pageIndex: number): HTMLCanvasElement {
    const basePageCanvas = pdfPages[pageIndex];
    // создаём временный canvas таких же размеров, как basePageCanvas:
    const offscreen = document.createElement("canvas");
    offscreen.width = basePageCanvas.width;
    offscreen.height = basePageCanvas.height;

    const ctx = offscreen.getContext("2d");
    if (!ctx) return offscreen;

    ctx.drawImage(basePageCanvas, 0, 0);
    const pageShapes = shapesByPage[pageIndex] || [];
    pageShapes.forEach((shape) => {
      drawShape(ctx, shape);
    });
    const pageTexts = textsByPage[pageIndex] || [];
    pageTexts.forEach((txt) => {
      drawText(ctx, txt);
    });
    return offscreen;
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
  }, [currentShape, redrawCanvas]);

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
      let operation: DraggingOperation | null = null;

      // 1) Сначала ищем фигуры
      const pageShapes = shapesByPage[currentPageIndex] || [];
      for (let i = pageShapes.length - 1; i >= 0; i--) {
        const shp = pageShapes[i];
        if (shp.path) {
          // Проверка для pencil/eraser
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
          // Проверка для других фигур (line, rectangle и т.д.)
          const left = Math.min(shp.x1 ?? 0, shp.x2 ?? 0);
          const right = Math.max(shp.x1 ?? 0, shp.x2 ?? 0);
          const top = Math.min(shp.y1 ?? 0, shp.y2 ?? 0);
          const bottom = Math.max(shp.y1 ?? 0, shp.y2 ?? 0);

          if (shp.selected) {
            const handleSize = 10;

            // Проверка ручки для вращения (правый верхний угол)
            const rotateHx1 = right - handleSize;
            const rotateHy1 = top;
            const rotateHx2 = right;
            const rotateHy2 = top + handleSize;
            if (
              coordinates.x >= rotateHx1 &&
              coordinates.x <= rotateHx2 &&
              coordinates.y >= rotateHy1 &&
              coordinates.y <= rotateHy2
            ) {
              foundShape = shp;
              operation = "rotate";
              break;
            }

            // Проверка ручки для изменения размера (правый нижний угол)
            const resizeHx1 = right - handleSize;
            const resizeHy1 = bottom - handleSize;
            const resizeHx2 = right;
            const resizeHy2 = bottom;
            if (
              coordinates.x >= resizeHx1 &&
              coordinates.x <= resizeHx2 &&
              coordinates.y >= resizeHy1 &&
              coordinates.y <= resizeHy2
            ) {
              foundShape = shp;
              operation = "resize";
              break;
            }
          }

          // Проверка области фигуры
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
        // Установка выделенной фигуры
        setShapesByPage((prev) => {
          const newArr = [...prev];
          const oldPageShapes = [...(newArr[currentPageIndex] || [])];
          newArr[currentPageIndex] = oldPageShapes.map((s) => ({
            ...s,
            selected: s.id === foundShape!.id,
          }));
          return newArr;
        });

        // Сброс выделения текста
        setTextsByPage((prev) => {
          const newArr = [...prev];
          const pageIndex = currentPageIndex;
          const oldPageTexts = [...(newArr[pageIndex] || [])];
          newArr[pageIndex] = oldPageTexts.map((t) => ({
            ...t,
            selected: false,
            cursorIndex: undefined,
          }));
          return newArr;
        });

        if (operation === "rotate") {
          // Начало вращения фигуры
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
            operation: "rotate",
            initialAngle: foundShape.angle ?? 0,
            initialMouseAngle,
          });
          canvas.style.cursor = "grabbing";
          return;
        }

        if (operation === "resize") {
          // Начало изменения размера фигуры
          setDraggingItem({
            type: "shape",
            id: foundShape.id,
            offsetX: coordinates.x - (foundShape.x2 ?? 0),
            offsetY: coordinates.y - (foundShape.y2 ?? 0),
            operation: "resize",
          });
          canvas.style.cursor = "nwse-resize";
          return;
        }

        // Если не на ручке, начинаем перетаскивание
        setDraggingItem({
          type: "shape",
          id: foundShape.id,
          offsetX,
          offsetY,
          operation: "move",
        });
        canvas.style.cursor = "move";
        return;
      }

      // 2) Если фигуру не нашли, ищем текст
      const ctx = canvas.getContext("2d");
      if (ctx) {
        let foundText: DrawnText | null = null;
        const currentPageTexts = textsByPage[currentPageIndex] || [];
        for (let i = currentPageTexts.length - 1; i >= 0; i--) {
          const txt = currentPageTexts[i];
          ctx.font = `${txt.fontSize}px sans-serif`;
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
          const margin = 6;
          const left = txt.x - margin;
          const top = txt.y - txt.fontSize - margin;
          const width = maxWidth + margin * 2;
          const height = totalHeight + margin * 2 - (lineHeight - txt.fontSize);
          const right = left + width;
          const bottom = top + height;

          // Проверяем ручку для вращения
          if (txt.selected) {
            const handleSize = 10;

            // Ручка для вращения (правый верхний угол)
            const rotateHx1 = right - handleSize;
            const rotateHy1 = top;
            const rotateHx2 = right;
            const rotateHy2 = top + handleSize;
            if (
              coordinates.x >= rotateHx1 &&
              coordinates.x <= rotateHx2 &&
              coordinates.y >= rotateHy1 &&
              coordinates.y <= rotateHy2
            ) {
              foundText = txt;
              operation = "rotate";
              break;
            }

            // Ручка для изменения размера (правый нижний угол)
            const resizeHx1 = right - handleSize;
            const resizeHy1 = bottom - handleSize;
            const resizeHx2 = right;
            const resizeHy2 = bottom;
            if (
              coordinates.x >= resizeHx1 &&
              coordinates.x <= resizeHx2 &&
              coordinates.y >= resizeHy1 &&
              coordinates.y <= resizeHy2
            ) {
              foundText = txt;
              operation = "resize";
              break;
            }
          }

          // Проверяем область текста
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
            const lines = foundText.text.split("\n");
            const lineHeight = foundText.fontSize * 1.2;

            // Определяем, в какую строку был клик по Y
            let totalSoFar = 0; // Суммарный индекс с учётом предыдущих строк
            let clickedLineIndex = -1;
            for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
              const lineTop = foundText.y + lineIdx * lineHeight - foundText.fontSize;
              const lineBottom = lineTop + lineHeight;
              if (coordinates.y >= lineTop && coordinates.y <= lineBottom) {
                clickedLineIndex = lineIdx;
                break;
              }
              // Если не попали в эту строку, добавляем (lines[lineIdx].length + 1) к totalSoFar
              totalSoFar += lines[lineIdx].length + 1; // +1 за символ \n
            }

            if (clickedLineIndex < 0) {
              newCursorIndex = foundText.text.length;
            } else {
              const lineText = lines[clickedLineIndex];
              let cIndex = 0; // Индекс символа внутри строки

              for (let c = 0; c < lineText.length; c++) {
                const part = lineText.slice(0, c);
                const w = ctx.measureText(part).width;
                if (coordinates.x < foundText.x + w) {
                  cIndex = c;
                  break;
                }
                if (c === lineText.length - 1) {
                  cIndex = lineText.length;
                }
              }

              newCursorIndex = totalSoFar + cIndex;
            }
          }

          // Обновляем состояние текста
          setTextsByPage((prev) => {
            const newArr = [...prev];
            const pageIndex = currentPageIndex;
            const oldPageTexts = [...(newArr[pageIndex] || [])];
            newArr[pageIndex] = oldPageTexts.map((t) =>
              t.id === foundText?.id
                ? {
                    ...t,
                    selected: true,
                    cursorIndex: newCursorIndex,
                  }
                : {
                    ...t,
                    selected: false,
                    cursorIndex: undefined,
                  },
            );
            return newArr;
          });

          // Сброс выделения фигур
          setShapesByPage((prev) => {
            const newArr = [...prev];
            const oldPageShapes = [...(newArr[currentPageIndex] || [])];
            newArr[currentPageIndex] = oldPageShapes.map((s) => ({ ...s, selected: false }));
            return newArr;
          });

          if (operation === "rotate") {
            // Начало вращения текста
            const cx = foundText.x;
            const cy = foundText.y;
            const dx = coordinates.x - cx;
            const dy = coordinates.y - cy;
            const initialMouseAngle = Math.atan2(dy, dx);
            setDraggingItem({
              type: "text",
              id: foundText.id,
              offsetX: 0,
              offsetY: 0,
              operation: "rotate",
              initialAngle: foundText.angle ?? 0,
              initialMouseAngle,
            });
            canvas.style.cursor = "grabbing";
            return;
          }

          // Если не на ручке, начинаем перетаскивание
          setDraggingItem({
            type: "text",
            id: foundText.id,
            offsetX,
            offsetY,
            operation: "move",
          });
          canvas.style.cursor = "move";
          return;
        }
      }

      // 3) Если инструмент = "text" и не нашли существующий
      if (selectedTool === "text") {
        setDraggingItem(null);
        setShapesByPage((prev) => {
          const newArr = [...prev];
          const oldPageShapes = [...(newArr[currentPageIndex] || [])];
          newArr[currentPageIndex] = oldPageShapes.map((s) => ({ ...s, selected: false }));
          return newArr;
        });
        setTextsByPage((prev) => {
          const newArr = [...prev];
          const pageIndex = currentPageIndex;
          const oldPageTexts = [...(newArr[pageIndex] || [])];
          newArr[pageIndex] = oldPageTexts.map((t) => ({
            ...t,
            selected: false,
            cursorIndex: undefined,
          }));
          return newArr;
        });
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
        setShapesByPage((prev) => {
          const newArr = [...prev];
          const shapesForPage = newArr[currentPageIndex] ? [...newArr[currentPageIndex]] : [];
          shapesForPage.push(newShape);
          newArr[currentPageIndex] = shapesForPage;
          return newArr;
        });
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
      setShapesByPage((prev) => {
        const newArr = [...prev];
        const oldPageShapes = [...(newArr[currentPageIndex] || [])];
        newArr[currentPageIndex] = oldPageShapes.map((s) => ({ ...s, selected: false }));
        return newArr;
      });
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
    [
      shapesByPage,
      currentPageIndex,
      selectedTool,
      imageForInsert,
      selectedColor,
      lineWidth,
      setImageForInsert,
      textsByPage,
    ],
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

      if (!draggingItem) {
        let isOverHandle = false;

        // Проверяем «ручки» у фигур
        shapesByPage[currentPageIndex]?.forEach((shp) => {
          if (shp.selected && !shp.path) {
            const handleSize = 10;
            const left = Math.min(shp.x1 ?? 0, shp.x2 ?? 0);
            const right = Math.max(shp.x1 ?? 0, shp.x2 ?? 0);
            const top = Math.min(shp.y1 ?? 0, shp.y2 ?? 0);
            const bottom = Math.max(shp.y1 ?? 0, shp.y2 ?? 0);

            // rotate handle (правый верх)
            const rotateHx1 = right - handleSize;
            const rotateHy1 = top;
            const rotateHx2 = right;
            const rotateHy2 = top + handleSize;

            // resize handle (правый низ)
            const resizeHx1 = right - handleSize;
            const resizeHy1 = bottom - handleSize;
            const resizeHx2 = right;
            const resizeHy2 = bottom;

            if (
              (coordinates.x >= rotateHx1 &&
                coordinates.x <= rotateHx2 &&
                coordinates.y >= rotateHy1 &&
                coordinates.y <= rotateHy2) ||
              (coordinates.x >= resizeHx1 &&
                coordinates.x <= resizeHx2 &&
                coordinates.y >= resizeHy1 &&
                coordinates.y <= resizeHy2)
            ) {
              isOverHandle = true;
            }
          }
        });

        // Проверяем «ручки» у текстов
        textsByPage[currentPageIndex]?.forEach((txt) => {
          if (txt.selected) {
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

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

            const handleSize = 10;
            // rotate handle
            const rotateHx1 = right - handleSize;
            const rotateHy1 = top;
            const rotateHx2 = right;
            const rotateHy2 = top + handleSize;

            // resize handle
            const resizeHx1 = right - handleSize;
            const resizeHy1 = bottom - handleSize;
            const resizeHx2 = right;
            const resizeHy2 = bottom;

            if (
              (coordinates.x >= rotateHx1 &&
                coordinates.x <= rotateHx2 &&
                coordinates.y >= rotateHy1 &&
                coordinates.y <= rotateHy2) ||
              (coordinates.x >= resizeHx1 &&
                coordinates.x <= resizeHx2 &&
                coordinates.y >= resizeHy1 &&
                coordinates.y <= resizeHy2)
            ) {
              isOverHandle = true;
            }
          }
        });

        canvas.style.cursor = isOverHandle ? "grab" : "default";
      }

      // Если перетаскиваем, вращаем или изменяем размер
      if (draggingItem) {
        const { type, id, operation } = draggingItem;

        if (type === "shape") {
          const shp = shapesByPage[currentPageIndex]?.find((s) => s.id === id);
          if (!shp) return;

          if (operation === "rotate") {
            const cx = ((shp.x1 ?? 0) + (shp.x2 ?? 0)) / 2;
            const cy = ((shp.y1 ?? 0) + (shp.y2 ?? 0)) / 2;
            const dx = coordinates.x - cx;
            const dy = coordinates.y - cy;
            const currentAngle = Math.atan2(dy, dx);
            const delta = currentAngle - (draggingItem.initialMouseAngle ?? 0);
            const newAngle = (draggingItem.initialAngle ?? 0) + (delta * 180) / Math.PI;

            setShapesByPage((prev) => {
              const newArr = [...prev];
              const oldPageShapes = [...(newArr[currentPageIndex] || [])];
              newArr[currentPageIndex] = oldPageShapes.map((s) =>
                s.id === shp.id ? { ...s, angle: newAngle } : s,
              );
              return newArr;
            });
            canvas.style.cursor = "grabbing";
            return;
          }

          if (operation === "resize") {
            const newX2 = coordinates.x - draggingItem.offsetX;
            const newY2 = coordinates.y - draggingItem.offsetY;
            const minWidth = 50;
            const minHeight = 50;
            const maxWidth = 2000; // Примерное значение
            const maxHeight = 2000; // Примерное значение

            const width = newX2 - (shp.x1 ?? 0);
            const height = newY2 - (shp.y1 ?? 0);

            if (width < minWidth || height < minHeight || width > maxWidth || height > maxHeight) {
              return;
            }

            setShapesByPage((prev) => {
              const newArr = [...prev];
              const oldPageShapes = [...(newArr[currentPageIndex] || [])];
              newArr[currentPageIndex] = oldPageShapes.map((s) =>
                s.id === id ? { ...s, x2: newX2, y2: newY2 } : s,
              );
              return newArr;
            });
            canvas.style.cursor = "nwse-resize";
            return;
          }

          if (operation === "move") {
            if (shp.path) {
              // Перемещение карандаша/ластика
              const newPath = shp.path.map((p) => ({
                x: p.x + (coordinates.x - shp.path![0].x - draggingItem.offsetX),
                y: p.y + (coordinates.y - shp.path![0].y - draggingItem.offsetY),
              }));
              setShapesByPage((prev) => {
                const newArr = [...prev];
                const oldPageShapes = [...(newArr[currentPageIndex] || [])];
                newArr[currentPageIndex] = oldPageShapes.map((s) =>
                  s.id === id ? { ...s, path: newPath } : s,
                );
                return newArr;
              });
            } else {
              // Перемещение других фигур
              const newX1 = coordinates.x - draggingItem.offsetX;
              const newY1 = coordinates.y - draggingItem.offsetY;
              const width = (shp.x2 ?? 0) - (shp.x1 ?? 0);
              const height = (shp.y2 ?? 0) - (shp.y1 ?? 0);
              const newX2 = newX1 + width;
              const newY2 = newY1 + height;

              setShapesByPage((prev) => {
                const newArr = [...prev];
                const oldPageShapes = [...(newArr[currentPageIndex] || [])];
                newArr[currentPageIndex] = oldPageShapes.map((s) =>
                  s.id === id ? { ...s, x1: newX1, y1: newY1, x2: newX2, y2: newY2 } : s,
                );
                return newArr;
              });
            }
            canvas.style.cursor = "move";
            return;
          }
        }

        if (type === "text") {
          const txt = textsByPage[currentPageIndex]?.find((t) => t.id === id);
          if (!txt) return;

          if (operation === "rotate") {
            const cx = txt.x;
            const cy = txt.y;
            const dx = coordinates.x - cx;
            const dy = coordinates.y - cy;
            const currentAngle = Math.atan2(dy, dx);
            const delta = currentAngle - (draggingItem.initialMouseAngle ?? 0);
            const newAngle = (draggingItem.initialAngle ?? 0) + (delta * 180) / Math.PI;

            setTextsByPage((prev) => {
              const newArr = [...prev];
              const oldPageTexts = [...(newArr[currentPageIndex] || [])];
              newArr[currentPageIndex] = oldPageTexts.map((t) =>
                t.id === txt.id ? { ...t, angle: newAngle } : t,
              );
              return newArr;
            });
            canvas.style.cursor = "grabbing";
            return;
          }

          if (operation === "move") {
            const newX = coordinates.x - draggingItem.offsetX;
            const newY = coordinates.y - draggingItem.offsetY;

            setTextsByPage((prev) => {
              const newArr = [...prev];
              const oldPageTexts = [...(newArr[currentPageIndex] || [])];
              newArr[currentPageIndex] = oldPageTexts.map((t) =>
                t.id === id ? { ...t, x: newX, y: newY } : t,
              );
              return newArr;
            });
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

      // Если рисуем другие фигуры (line, rectangle и т.д.)
      if (isPainting && currentShape && mouseDownPosition) {
        setCurrentShape({
          ...currentShape,
          x2: coordinates.x,
          y2: coordinates.y,
        });
      }
    },
    [
      draggingItem,
      currentShape,
      isPainting,
      mouseDownPosition,
      shapesByPage,
      textsByPage,
      currentPageIndex,
    ],
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
      setShapesByPage((prev) => {
        const newArr = [...prev];
        const pageIndex = currentPageIndex;
        const shapesForPage = newArr[pageIndex] ? [...newArr[pageIndex]] : [];
        shapesForPage.push(currentShape);
        newArr[pageIndex] = shapesForPage;
        return newArr;
      });

      setCurrentShape(null);
    }
  }, [currentShape, currentPageIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (event: MouseEvent) => {
      startPaint(event);
    };

    const handleMouseMove = (event: MouseEvent) => {
      paint(event);
    };

    const handleMouseUp = () => {
      exitPaint();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [startPaint, paint, exitPaint]);

  const goToPage = (idx: number) => {
    if (idx >= 0 && idx < pdfPages.length) {
      setCurrentPageIndex(idx);
    }
  };

  /**
   * Клавиатурные события
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        setShapesByPage((prev) => {
          const newArr = [...prev];
          const oldPageShapes = [...(newArr[currentPageIndex] || [])];
          newArr[currentPageIndex] = oldPageShapes.map((s) =>
            s.selected
              ? {
                  ...s,
                  angle: (s.angle ?? 0) + 15,
                }
              : s,
          );
          return newArr;
        });
      }

      if (selectedTool !== "text") return;

      const activeText = textsByPage[currentPageIndex]?.find((t) => t.selected);
      if (activeText) {
        if (ignoreKeys.includes(event.key)) return;
        const cursorIndex = activeText.cursorIndex ?? activeText.text.length;

        if (event.key === "ArrowLeft") {
          if (cursorIndex > 0) {
            setTextsByPage((prev) => {
              const newArr = [...prev];
              const pageIndex = currentPageIndex;
              const oldPageTexts = [...(newArr[pageIndex] || [])];
              newArr[pageIndex] = oldPageTexts.map((t) =>
                t.id === activeText.id ? { ...t, cursorIndex: cursorIndex - 1 } : t,
              );
              return newArr;
            });
          }
          return;
        }
        if (event.key === "ArrowRight") {
          if (cursorIndex < activeText.text.length) {
            setTextsByPage((prev) => {
              const newArr = [...prev];
              const pageIndex = currentPageIndex;
              const oldPageTexts = [...(newArr[pageIndex] || [])];
              newArr[pageIndex] = oldPageTexts.map((t) =>
                t.id === activeText.id ? { ...t, cursorIndex: cursorIndex + 1 } : t,
              );
              return newArr;
            });
          }
          return;
        }

        if (event.key === "Enter") {
          const newText =
            activeText.text.slice(0, cursorIndex) + "\n" + activeText.text.slice(cursorIndex);
          setTextsByPage((prev) => {
            const newArr = [...prev];
            const pageIndex = currentPageIndex;
            const oldPageTexts = [...(newArr[pageIndex] || [])];
            newArr[pageIndex] = oldPageTexts.map((t) =>
              t.id === activeText.id ? { ...t, text: newText, cursorIndex: cursorIndex + 1 } : t,
            );
            return newArr;
          });
          return;
        }

        if (event.key === "Backspace") {
          if (cursorIndex > 0) {
            const newText =
              activeText.text.slice(0, cursorIndex - 1) + activeText.text.slice(cursorIndex);
            setTextsByPage((prev) => {
              const newArr = [...prev];
              const pageIndex = currentPageIndex;
              const oldPageTexts = [...(newArr[pageIndex] || [])];
              newArr[pageIndex] = oldPageTexts.map((t) =>
                t.id === activeText.id
                  ? {
                      ...t,
                      text: newText,
                      cursorIndex: cursorIndex - 1,
                    }
                  : t,
              );
              return newArr;
            });
          }
          return;
        }

        // Пример: если нажата обычная буква
        if (event.key.length === 1) {
          setTextsByPage((prev) => {
            const newArr = [...prev];
            const pageIndex = currentPageIndex;
            const oldPageTexts = [...(newArr[pageIndex] || [])];
            newArr[pageIndex] = oldPageTexts.map((t) => {
              if (t.id === activeText.id) {
                // Собираем новый текст
                const newText =
                  t.text.slice(0, cursorIndex) + event.key + t.text.slice(cursorIndex);
                return {
                  ...t,
                  text: newText,
                  cursorIndex: cursorIndex + 1,
                };
              }
              return t;
            });
            return newArr;
          });
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
          setTextsByPage((prev) => {
            const newArr = [...prev];
            const pageIndex = currentPageIndex;
            const oldPageTexts = newArr[pageIndex] ? [...newArr[pageIndex]] : [];
            const updatedTexts = oldPageTexts.map((t) => ({
              ...t,
              selected: false,
              cursorIndex: undefined as number | undefined,
            }));
            updatedTexts.push({
              id: newId,
              text: event.key,
              x: textPosition.x,
              y: textPosition.y,
              color: selectedColor,
              fontSize: 16,
              selected: true,
              cursorIndex: 1,
              angle: 0,
            });
            newArr[pageIndex] = updatedTexts;
            return newArr;
          });
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
  }, [selectedTool, textPosition, selectedColor, textsByPage, currentPageIndex]);

  const saveCanvasAsPNG = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "myDrawing.png";
    link.click();
  }, []);

  const saveCanvasAsPDF = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const widthPx = canvas.width;
    const heightPx = canvas.height;
    const pxToPt = 72 / 96;
    const widthPt = widthPx * pxToPt;
    const heightPt = heightPx * pxToPt;
    const dataURL = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: widthPt > heightPt ? "landscape" : "portrait",
      unit: "pt",
      format: [widthPt, heightPt],
    });
    pdf.addImage(dataURL, "PNG", 0, 0, widthPt, heightPt);
    pdf.save("myDrawing.pdf");
  }, []);

  const saveAllPagesAsPDF = useCallback(() => {
    if (pdfPages.length === 0) return;
    let pdf = new jsPDF();
    pdfPages.forEach((basePageCanvas, pageIndex) => {
      const finalCanvas = renderPageToCanvas(pageIndex);
      const widthPx = finalCanvas.width;
      const heightPx = finalCanvas.height;
      const pxToPt = 72 / 96;
      const widthPt = widthPx * pxToPt;
      const heightPt = heightPx * pxToPt;
      const dataURL = finalCanvas.toDataURL("image/png");
      if (pageIndex === 0) {
        pdf = new jsPDF({
          orientation: widthPt > heightPt ? "landscape" : "portrait",
          unit: "pt",
          format: [widthPt, heightPt],
        });
      } else {
        pdf!.addPage([widthPt, heightPt], widthPt > heightPt ? "landscape" : "portrait");
      }
      pdf!.addImage(dataURL, "PNG", 0, 0, widthPt, heightPt);
    });

    if (pdf) {
      pdf.save("myDrawing.pdf");
    }
  }, [pdfPages, renderPageToCanvas]);

  /**
   * Создать новую пустую страницу
   */
  const addBlankPage = () => {
    const w = window.innerWidth - 130;
    const h = window.innerHeight - 110;
    const blankCanvas = document.createElement("canvas");
    blankCanvas.width = w;
    blankCanvas.height = h;

    const ctx = blankCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f9f8f8";
      ctx.fillRect(0, 0, w, h);
    }

    setPdfPages((prev) => {
      const newPages = [...prev, blankCanvas];
      setCurrentPageIndex(newPages.length - 1);
      return newPages;
    });

    setShapesByPage((prev) => [...prev, []]);
    setTextsByPage((prev) => [...prev, []]);
  };

  return {
    canvasRef,
    handleFileUpload,
    pdfPages,
    currentPageIndex,
    setCurrentPageIndex: goToPage,
    saveCanvasAsPNG,
    saveAllPagesAsPDF,
    addBlankPage,
  };
};

function rotatePoint(
  cx: number,
  cy: number,
  x: number,
  y: number,
  angleRad: number,
): { x: number; y: number } {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const nx = cos * (x - cx) - sin * (y - cy) + cx;
  const ny = sin * (x - cx) + cos * (y - cy) + cy;
  return { x: nx, y: ny };
}
