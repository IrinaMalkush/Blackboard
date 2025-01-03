import { render } from "@testing-library/react";

import { getCoordinates } from "../utils/getCoordinates";

describe("getCoordinates", () => {
  it("returns coordinates relative to the canvas", () => {
    // Рендерим пустой канвас в документ
    const { container } = render(
      <canvas style={{ position: "absolute", top: "100px", left: "100px" }} />,
    );
    // eslint-disable-next-line testing-library/no-node-access
    const canvas = container.firstChild;

    // Создаём фиктивное событие мыши
    const fakeEvent = {
      pageX: 150,
      pageY: 200,
    };

    const canvasRef = {
      current: canvas,
    };

    // Вызываем getCoordinates и проверяем результат
    const coordinates = getCoordinates(fakeEvent, canvasRef);
    expect(coordinates).toEqual({ x: 150, y: 200 });
  });

  it("returns undefined if canvasRef is null", () => {
    const fakeEvent = {
      pageX: 150,
      pageY: 200,
    };

    const canvasRef = null;

    const coordinates = getCoordinates(fakeEvent, canvasRef);
    expect(coordinates).toBeUndefined();
  });
});
