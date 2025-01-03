import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import { Main } from "../pages/Main";

describe("Main Component Integration Test", () => {
  it("should render header and canvas and handle tool selection", () => {
    render(<Main />);

    // Проверяем, что Header и Canvas отрендерились
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /canvas/i })).toBeInTheDocument();

    // Эмулируем клик по кнопке выбора инструмента "eraser"
    fireEvent.click(screen.getByAltText("eraser"));

    // Проверяем, что выбранный инструмент обновился
    const canvas = screen.getByRole("img", { name: /canvas/i });
    expect(canvas).toHaveAttribute("data-selected-tool", "eraser");
  });
});
