import React, { ChangeEvent, useState } from "react";
import styled from "styled-components";

import { ColorsSection } from "../components/ColorsSection";
import { LineWidthSection } from "../components/LineWidthSection";
import { ToolsSection } from "../components/ToolsSection";
import { TextButton } from "../components/ui/TextButton";
import { useDraw } from "../hooks/useDraw";
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

  const [imageForInsert, setImageForInsert] = useState<HTMLImageElement | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setImageForInsert(img);
    };
  }

  const { canvasRef, saveCanvasAsPNG, saveCanvasAsPDF } = useDraw(
    selectedTool,
    selectedColor,
    lineWidth,
    imageForInsert,
    setImageForInsert,
  );

  return (
    <Layout>
      <Container role="banner">
        <FirstLine>
          <ToolsSection
            selectedTool={selectedTool}
            handleClick={handleChooseTool}
            handleFileChange={handleFileChange}
            isFileChosen={imageForInsert !== null}
          />
          <DownloadSection>
            <TextButton onClick={saveCanvasAsPNG} text={"PNG"} />
            <TextButton onClick={saveCanvasAsPDF} text={"PDF"} />
          </DownloadSection>
        </FirstLine>
        <Parameters>
          <LineWidthSection lineWidth={lineWidth} handleLineWidthChange={handleLineWidthChange} />
          <ColorsSection selectedColor={selectedColor} handleClick={handleChooseColor} />
        </Parameters>
      </Container>
      <div>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="canvas"
          height={window.innerHeight - 104}
          width={window.innerWidth}
          data-selected-tool={selectedTool}
        >
          canvas
        </canvas>
      </div>
    </Layout>
  );
};

const Layout = styled.div`
  background-color: #f9f8f8;
  margin-top: 100px;
`;

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background-color: #efefef;
  padding: 12px;
`;

const FirstLine = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-right: 38px;
`;

const DownloadSection = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

const Parameters = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin-top: 16px;
`;
