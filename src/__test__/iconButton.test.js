import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { IconButton } from "../components/IconButton";

describe("IconButton", () => {
  it("renders the icon with the correct alt text", () => {
    const mockOnClick = jest.fn();
    render(<IconButton icon="icon-path.png" alt="Icon description" onClick={mockOnClick} />);

    const iconElement = screen.getByAltText("Icon description");
    expect(iconElement).toBeInTheDocument();
    expect(iconElement.src).toContain("icon-path.png");
  });

  it("calls onClick handler when clicked", () => {
    const mockOnClick = jest.fn();
    render(<IconButton icon="icon-path.png" alt="Icon description" onClick={mockOnClick} />);

    const buttonElement = screen.getByRole("button");
    fireEvent.click(buttonElement);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
