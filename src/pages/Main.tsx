import React, { ChangeEvent, useState } from "react";
import styled from "styled-components";

import { ColorsSection } from "../components/ColorsSection";
import { LineWidthSection } from "../components/LineWidthSection";
import { TextSizeSection } from "../components/TextSizeSection";
import { ToolsSection } from "../components/ToolsSection";
import { DownloadButton } from "../components/ui/DownloadButton";
import { ImportButton } from "../components/ui/ImportButton";
import { useDraw } from "../hooks/useDraw";
import PlusIcon from "../static/icons/plus.png";
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

  const [textSize, setTextSize] = useState<number>(16);
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

  const {
    canvasRef,
    handleFileUpload,
    pdfPages,
    currentPageIndex,
    setCurrentPageIndex,
    saveCanvasAsPNG,
    saveAllPagesAsPDF,
    addBlankPage,
  } = useDraw(selectedTool, selectedColor, lineWidth, textSize, imageForInsert, setImageForInsert);

  return (
    <Layout>
      <HeaderContainer role="banner">
        <FirstLine>
          <ToolsSection
            selectedTool={selectedTool}
            handleClick={handleChooseTool}
            handleFileChange={handleFileChange}
            isFileChosen={imageForInsert !== null}
          />
          <DownloadSection>
            <DownloadButton onClick={saveCanvasAsPNG} text={"сохранить в PNG"} />
            <DownloadButton onClick={saveAllPagesAsPDF} text={"сохранить в PDF"} />
          </DownloadSection>
        </FirstLine>
        <SecondLine>
          <Parameters>
            <LineWidthSection lineWidth={lineWidth} handleLineWidthChange={handleLineWidthChange} />
            <ColorsSection selectedColor={selectedColor} handleClick={handleChooseColor} />
            <TextSizeSection size={textSize} handleSizeChange={setTextSize} />
          </Parameters>
          <DownloadSection>
            <ImportButton onClick={handleFileUpload} text={"импорт PNG"} />
            <ImportButton onClick={handleFileUpload} text={"импорт PDF"} />
          </DownloadSection>
        </SecondLine>
      </HeaderContainer>
      <MainContainer>
        <PreviewPanel>
          {pdfPages.length > 0 ? (
            pdfPages.map((pageCanvas, idx) => {
              const smallDataURL = pageCanvas.toDataURL("image/png");
              return (
                <PreviewImage
                  key={idx}
                  src={smallDataURL}
                  onClick={() => setCurrentPageIndex(idx)}
                  isActive={idx === currentPageIndex}
                />
              );
            })
          ) : (
            <p>Нет страниц</p>
          )}

          <AddPageButton alt={"add page"} src={PlusIcon} onClick={addBlankPage} />
        </PreviewPanel>
        <CanvasArea>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="canvas"
            // height={window.innerHeight - 110}
            // width={window.innerWidth - 160}
            data-selected-tool={selectedTool}
          >
            canvas
          </canvas>
        </CanvasArea>
      </MainContainer>
    </Layout>
  );
};

const Layout = styled.div`
  background-color: #f9f8f8;
  margin-top: 110px;
`;

const HeaderContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 86px;
  background-color: #efefef;
  border-bottom: 1px solid #ccc;
  padding: 12px;
`;

const FirstLine = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-right: 38px;
`;

const SecondLine = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-right: 38px;
  margin-top: 16px;
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
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100vh - 110px);
`;

const PreviewPanel = styled.div`
  width: 124px;
  border-right: 1px solid #ccc;
  padding: 10px;
  overflow-y: auto;
  background-color: #efefef;
`;

const PreviewImage = styled.img.attrs<{ isActive: boolean }>((props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isActive, ...rest } = props;
  return rest;
})`
  display: block;
  width: 100px;
  height: auto;
  margin-bottom: 8px;
  border: ${(p) => (p.isActive ? "2px solid #00b" : "1px solid #aaa")};
  cursor: pointer;
`;

const CanvasArea = styled.div`
  flex: 1;
  padding: 10px;
  overflow: auto;
`;

const AddPageButton = styled.img`
  height: 40px;
  margin-left: 28px;
  filter: invert(81%) sepia(8%) saturate(65%) hue-rotate(314deg) brightness(84%) contrast(88%);

  &:hover {
    filter: invert(60%) sepia(0%) saturate(0%) hue-rotate(159deg) brightness(88%) contrast(87%);
  }
`;
