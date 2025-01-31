import { ChangeEvent } from "react";
import styled from "styled-components";

interface ITextSizeSectionProps {
  size: number;
  handleSizeChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const TextSizeSection = ({ size, handleSizeChange }: ITextSizeSectionProps) => {
  return (
    <Container>
      <Label htmlFor="text-size">Размер шрифта:</Label>
      <NumberInput
        id="text-size"
        type="number"
        min="16"
        max="72"
        step="2"
        value={size}
        onChange={handleSizeChange}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
`;

const NumberInput = styled.input`
  width: 60px;
  text-align: center;
`;
