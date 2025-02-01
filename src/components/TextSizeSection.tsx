import React, { useEffect, useState } from "react";
import styled from "styled-components";

interface ITextSizeSectionProps {
  size: number;
  handleSizeChange: (val: number) => void;
}

export const TextSizeSection = ({ size, handleSizeChange }: ITextSizeSectionProps) => {
  const [textSizeInput, setTextSizeInput] = useState(String(size));

  useEffect(() => {
    setTextSizeInput(String(size));
  }, [size]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextSizeInput(e.target.value);
  };

  const handleBlur = () => {
    const num = parseInt(textSizeInput, 10);
    if (isNaN(num) || num < 16) {
      setTextSizeInput("16");
      handleSizeChange(16);
    } else if (num > 72) {
      setTextSizeInput("72");
      handleSizeChange(72);
    } else {
      setTextSizeInput(String(num));
      handleSizeChange(num);
    }
  };

  return (
    <Container>
      <Label htmlFor="text-size">Размер шрифта:</Label>
      <NumberInput
        id="text-size"
        type="number"
        min="16"
        max="72"
        step="2"
        value={textSizeInput}
        onChange={handleInputChange}
        onBlur={handleBlur}
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
