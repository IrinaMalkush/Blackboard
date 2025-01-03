import styled from "styled-components";

import { IconButton } from "../../components/IconButton";
import { tools } from "../../constants/tools";
import { ToolsType } from "../../types/tools";

interface IToolsSection {
  selectedTool: ToolsType;
  handleClick: (tool: ToolsType) => void;
}

export const ToolsSection = ({ selectedTool, handleClick }: IToolsSection) => {
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
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;
