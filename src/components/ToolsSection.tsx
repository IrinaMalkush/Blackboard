import { ChangeEvent, useRef } from "react";
import styled from "styled-components";

import { tools } from "../constants/tools";
import { ToolsType } from "../types/tools";
import { IconButton } from "./ui/IconButton";

interface IToolsSection {
  selectedTool: ToolsType;
  handleClick: (tool: ToolsType) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isFileChosen: boolean;
}

export const ToolsSection = ({
  selectedTool,
  handleClick,
  handleFileChange,
  isFileChosen,
}: IToolsSection) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  return (
    <Container>
      {tools.map((tool) => (
        <IconButton
          icon={tool.icon}
          alt={tool.name}
          onClick={() => handleClick(tool.name)}
          isActive={selectedTool === tool.name}
          key={tool.name}
        />
      ))}
      {selectedTool === "image" && (
        <div>
          <LoadFileButton $isActive={isFileChosen} onClick={handleUploadClick}>
            {isFileChosen ? "Файл загружен" : "Выбрать файл"}
          </LoadFileButton>
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const LoadFileButton = styled.button<{ $isActive?: boolean }>`
  margin-left: 16px;
  height: 34px;
  width: 160px;
  background-color: ${(p) => (p.$isActive ? "#dcdcdc" : "#00abb3")};
  border: none;
  border-radius: 6px;

  &:active {
    background-color: #61d6d0;
  }
`;
