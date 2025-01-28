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

  &:hover {
    background-color: ${(p) => (p.$isActive ? "#00abb3" : "#b8b6b6")};
    transition: 0.3s ease-in-out;
  }

  &:active {
    background-color: #61d6d0;
    transition: 0.3s ease-in-out;
  }
`;

const Icon = styled.img`
  height: 18px;
  filter: invert(32%) sepia(16%) saturate(0%) hue-rotate(137deg) brightness(99%) contrast(76%);
`;
