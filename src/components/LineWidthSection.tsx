import { ChangeEvent } from "react";
import styled from "styled-components";

interface ILineWidthSection {
  lineWidth: number;
  handleLineWidthChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const LineWidthSection = ({ lineWidth, handleLineWidthChange }: ILineWidthSection) => {
  return (
    <Container>
      <Label htmlFor="line-width">Толщина пера:</Label>
      <NumberInput
        id="line-width"
        type="number"
        min="1"
        max="50"
        step="1"
        value={lineWidth}
        onChange={handleLineWidthChange}
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
