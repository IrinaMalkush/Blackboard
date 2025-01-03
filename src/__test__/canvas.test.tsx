import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { Canvas } from "../layouts/canvas/Canvas";
import { ColorOfToolType } from "../types/colors";

describe("Canvas Integration Test", () => {
  it("updates the drawing context when tool changes", () => {
    const { rerender } = render(
      <Canvas selectedTool="pencil" selectedColor={ColorOfToolType.RED} lineWidth={4} />,
    );

    // Проверяем начальное состояние канваса
    const canvas = screen.getByRole("img", { name: /canvas/i });
    expect(canvas).toHaveAttribute("data-selected-tool", "pencil");

    // Перерендериваем канвас с новым инструментом и проверяем его состояние
    rerender(<Canvas selectedTool="eraser" selectedColor={ColorOfToolType.RED} lineWidth={4} />);
    expect(canvas).toHaveAttribute("data-selected-tool", "eraser");
  });
});
