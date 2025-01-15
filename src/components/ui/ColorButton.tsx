import styled from "styled-components";

export interface IColorButtonProps {
  onClick: () => void;
  isActive: boolean;
  color: string;
}

export const ColorButton = ({ onClick, isActive, color }: IColorButtonProps) => {
  return <Button onClick={onClick} $isActive={isActive} $color={color} />;
};

const Button = styled.button<{ $isActive?: boolean; $color: string }>`
  height: 32px;
  width: 32px;
  background-color: ${(p) => p.$color};
  border: 3px solid ${(p) => (p.$isActive ? "#00abb3" : "#dcdcdc")};
  border-radius: 18px;
`;
