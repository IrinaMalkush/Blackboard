import styled from "styled-components";

import { IconButton } from "../../components/IconButton";
import CircleIcon from "../../static/icons/circle.svg";
import EraserIcon from "../../static/icons/eraser.svg";
import PencilIcon from "../../static/icons/pencil.svg";
import SlashIcon from "../../static/icons/slash.svg";
import SquareIcon from "../../static/icons/square.svg";
import TriangleIcon from "../../static/icons/triangle.svg";
import { Tools } from "../../types/tools";

interface IHeaderProps {
  handleClick: (tool: Tools) => void;
}

export const Header = ({ handleClick }: IHeaderProps) => {
  return (
    <Container>
      <Buttons>
        <IconButton icon={PencilIcon} alt={"pencil"} onClick={() => handleClick("pencil")} />
        <IconButton icon={SlashIcon} alt={"line"} onClick={() => handleClick("line")} />
        <IconButton icon={CircleIcon} alt={"circle"} onClick={() => handleClick("circle")} />
        <IconButton icon={TriangleIcon} alt={"triangle"} onClick={() => handleClick("triangle")} />
        <IconButton icon={SquareIcon} alt={"rectangle"} onClick={() => handleClick("rectangle")} />
        <IconButton icon={EraserIcon} alt={"eraser"} onClick={() => handleClick("eraser")} />
      </Buttons>
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

const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;
