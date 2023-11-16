import styled from "styled-components";

interface IIconButton {
  icon: string;
  alt: string;
  onClick: () => void;
}

export const IconButton = ({ icon, alt, onClick }: IIconButton) => {
  return (
    <Button onClick={onClick}>
      <Icon alt={alt} src={icon} />
    </Button>
  );
};

const Button = styled.button`
  height: 34px;
  width: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #dcdcdc;
  border: none;
  border-radius: 6px;
`;

const Icon = styled.img`
  height: 18px;
  filter: invert(32%) sepia(16%) saturate(0%) hue-rotate(137deg) brightness(99%) contrast(76%);
`;
