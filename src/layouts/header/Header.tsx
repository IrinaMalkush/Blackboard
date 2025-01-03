import { ChangeEvent } from "react";
import styled from "styled-components";

import { ColorOfToolType } from "../../types/colors";
import { ToolsType } from "../../types/tools";
import { ColorsSection } from "../canvas/ColorsSection";
import { LineWidthSection } from "../canvas/LineWidthSection";
import { ToolsSection } from "../canvas/ToolsSection";

interface IHeaderProps {
  selectedTool: ToolsType;
  handleChooseTool: (tool: ToolsType) => void;
  selectedColor: ColorOfToolType;
  handleChooseColor: (color: ColorOfToolType) => void;
  lineWidth: number;
  handleLineWidthChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const Header = ({
  selectedTool,
  handleChooseTool,
  selectedColor,
  handleChooseColor,
  lineWidth,
  handleLineWidthChange,
}: IHeaderProps) => {
  return (
    <Container role="banner">
      <ToolsSection selectedTool={selectedTool} handleClick={handleChooseTool} />
      <Parameters>
        <LineWidthSection lineWidth={lineWidth} handleLineWidthChange={handleLineWidthChange} />
        <ColorsSection selectedColor={selectedColor} handleClick={handleChooseColor} />
      </Parameters>
    </Container>
  );
};

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background-color: #efefef;
  padding: 12px;
`;

const Parameters = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin-top: 16px;
`;
