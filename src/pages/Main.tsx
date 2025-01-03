import { ChangeEvent, useState } from "react";
import styled from "styled-components";

import { Canvas } from "../layouts/canvas/Canvas";
import { Header } from "../layouts/header/Header";
import { ColorOfToolType } from "../types/colors";
import { ToolsType } from "../types/tools";

export const Main = () => {
  const [selectedTool, setSelectedTool] = useState<ToolsType>("pencil");
  const handleChooseTool = (tool: ToolsType) => {
    setSelectedTool(tool);
  };

  const [selectedColor, setSelectedColor] = useState<ColorOfToolType>(ColorOfToolType.BLACK);
  const handleChooseColor = (color: ColorOfToolType) => {
    setSelectedColor(color);
  };

  const [lineWidth, setLineWidth] = useState<number>(3);
  const handleLineWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value, 10);
    setLineWidth(newValue > 0 ? newValue : 1);
  };

  return (
    <Layout>
      <Header
        handleChooseTool={handleChooseTool}
        selectedTool={selectedTool}
        selectedColor={selectedColor}
        handleChooseColor={handleChooseColor}
        lineWidth={lineWidth}
        handleLineWidthChange={handleLineWidthChange}
      />
      <Canvas selectedTool={selectedTool} selectedColor={selectedColor} lineWidth={lineWidth} />
    </Layout>
  );
};

const Layout = styled.div`
  background-color: #f9f8f8;
  margin-top: 100px;
`;
