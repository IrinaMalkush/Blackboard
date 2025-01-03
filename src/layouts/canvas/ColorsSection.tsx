import styled from "styled-components";

import { ColorButton } from "../../components/ColorButton";
import { colorOfTool } from "../../constants/colors";
import { ColorOfToolType } from "../../types/colors";

interface IColorsSection {
  selectedColor: ColorOfToolType;
  handleClick: (color: ColorOfToolType) => void;
}

export const ColorsSection = ({ selectedColor, handleClick }: IColorsSection) => {
  return (
    <Container>
      <Label htmlFor="color">Цвет:</Label>
      {colorOfTool.map((color) => (
        <ColorButton
          onClick={() => handleClick(color.name)}
          isActive={selectedColor === color.name}
          color={color.hex}
          key={color.name}
        />
      ))}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
`;
