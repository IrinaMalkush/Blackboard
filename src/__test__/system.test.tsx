import "@testing-library/jest-dom";
import "jest-canvas-mock";

import { act, fireEvent, render, screen } from "@testing-library/react";

import { Main } from "../pages/Main";

describe("System Test", () => {
  it("allows the user to select tools and draw on the canvas", () => {
    render(<Main />);

    // Проверяем, что заголовок и канвас отрендерились
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /canvas/i })).toBeInTheDocument();

    // Выбираем инструмент "eraser"
    const eraserButton = screen.getByAltText("eraser");
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      fireEvent.click(eraserButton);
    });

    // Проверяем, что инструмент изменился на "eraser"
    const canvas = screen.getByRole("img", { name: /canvas/i });
    expect(canvas).toHaveAttribute("data-selected-tool", "eraser");

    // Эмулируем действия мыши на канвасе для рисования
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
    });
  });
});
