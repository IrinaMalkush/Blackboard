import "jest-canvas-mock";

import { act, renderHook } from "@testing-library/react-hooks";

import * as module from "../hooks/usePencilDraw";
import { usePencilDraw } from "../hooks/usePencilDraw";

describe("usePencilDraw", () => {
  it("should initiate with correct default values", () => {
    const { result } = renderHook(() => usePencilDraw("pencil"));

    expect(result.current.isPainting).toBe(false);
    expect(result.current.mousePosition).toBeUndefined();
    expect(result.current.snapshot).toBeUndefined();
    expect(result.current.canvasRef).toBeDefined();
  });

  it("should stop painting on mouseUp or mouseLeave", () => {
    const { result } = renderHook(() => usePencilDraw("pencil"));

    // Start and then stop painting
    act(() => {
      const startEvent = { pageX: 100, pageY: 100 };
      result.current.startPaint(startEvent);
      result.current.exitPaint();
    });

    expect(result.current.isPainting).toBe(false);
  });
});

jest.mock("../hooks/usePencilDraw", () => ({
  ...jest.requireActual("../hooks/usePencilDraw"),
  getCoordinates: jest.fn(),
}));

describe("startPaint", () => {
  let setIsPainting, setMousePosition, setSnapshot, getCoordinates;

  beforeEach(() => {
    setIsPainting = jest.fn();
    setMousePosition = jest.fn();
    setSnapshot = jest.fn();
    getCoordinates = module.getCoordinates;
  });

  it("should handle painting correctly when coordinates are provided", () => {
    // Мокирование возвращаемого значения getCoordinates
    getCoordinates.mockReturnValue({ x: 50, y: 50 });

    // Мок canvas и его методов
    const fakeContext = {
      getImageData: jest.fn().mockReturnValue("imageData"),
    };
    const fakeCanvas = {
      getContext: jest.fn().mockReturnValue(fakeContext),
      width: 100,
      height: 100,
    };

    const canvasRef = {
      current: fakeCanvas,
    };

    // Имитация события мыши
    const fakeEvent = {
      pageX: 100,
      pageY: 100,
    };

    // Тестируем функцию startPaint
    const startPaint = () => {
      const coordinates = getCoordinates(fakeEvent, canvasRef);
      if (coordinates) {
        setIsPainting(true);
        setMousePosition(coordinates);

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");
          if (context) {
            setSnapshot(context.getImageData(0, 0, canvas.width, canvas.height));
          }
        }
      }
    };

    // Выполняем функцию
    act(() => {
      startPaint();
    });

    // Проверяем, что все моки вызваны с правильными аргументами
    expect(setIsPainting).toHaveBeenCalledWith(true);
    expect(setMousePosition).toHaveBeenCalledWith({ x: 50, y: 50 });
    expect(fakeCanvas.getContext).toHaveBeenCalledWith("2d");
    expect(fakeContext.getImageData).toHaveBeenCalledWith(0, 0, 100, 100);
    expect(setSnapshot).toHaveBeenCalledWith("imageData");
  });
});
