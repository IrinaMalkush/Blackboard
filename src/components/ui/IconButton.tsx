import styled from "styled-components";

export interface IIconButtonProps {
  icon: string;
  alt: string;
  onClick: () => void;
  isActive: boolean;
}

export const IconButton = ({ icon, alt, onClick, isActive }: IIconButtonProps) => {
  return (
    <Button onClick={onClick} $isActive={isActive}>
      <Icon alt={alt} src={icon} />
    </Button>
  );
};

const Button = styled.button<{ $isActive?: boolean }>`
  height: 34px;
  width: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(p) => (p.$isActive ? "#00abb3" : "#dcdcdc")};
  border: none;
  border-radius: 6px;
`;

const Icon = styled.img`
  height: 18px;
  filter: invert(32%) sepia(16%) saturate(0%) hue-rotate(137deg) brightness(99%) contrast(76%);
`;
