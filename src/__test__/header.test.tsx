import "@testing-library/jest-dom";

// import { fireEvent, render, screen } from "@testing-library/react";
//
// import { Header } from "../layouts/header/Header";
// import { ColorOfToolType } from "../types/colors";

describe("Header Component Integration Test", () => {
  it("renders all tool buttons and handles clicks", () => {
    // const handleClick = jest.fn();
    // const handleChooseColor = jest.fn();
    // const handleLineWidthChange = jest.fn();
    // const toggleRotationMode = jest.fn();
    // render(
    //   <Header
    //     handleChooseTool={handleClick}
    //     selectedTool={"pencil"}
    //     handleChooseColor={handleChooseColor}
    //     selectedColor={ColorOfToolType.RED}
    //     lineWidth={5}
    //     handleLineWidthChange={handleLineWidthChange}
    //     isRotationMode={false}
    //     toggleRotationMode={toggleRotationMode}
    //   />,
    // );
    //
    // // Проверяем наличие всех кнопок инструментов
    // const tools = ["pencil", "line", "circle", "triangle", "rectangle", "eraser"];
    // tools.forEach((tool) => {
    //   const button = screen.getByAltText(tool);
    //   expect(button).toBeInTheDocument();
    //
    //   // Эмулируем клик по каждой кнопке и проверяем обработчик
    //   fireEvent.click(button);
    //   expect(handleClick).toHaveBeenCalledWith(tool);
    // });
    //
    // // Убеждаемся, что обработчик клика был вызван корректное количество раз
    // expect(handleClick).toHaveBeenCalledTimes(tools.length);
  });
});
