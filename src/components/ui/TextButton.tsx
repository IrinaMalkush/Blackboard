import styled from "styled-components";

import DownloadIcon from "../../static/icons/download.svg";

export interface ITextButtonProps {
  text: string;
  onClick: () => void;
}

export const TextButton = ({ text, onClick }: ITextButtonProps) => {
  return (
    <Button onClick={onClick}>
      <Icon alt={text} src={DownloadIcon} />
      {text}
    </Button>
  );
};

const Button = styled.button`
  height: 34px;
  background-color: #dcdcdc;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;

  :hover {
    fill: blue;
  }
`;

const Icon = styled.img`
  height: 18px;
  margin-right: 8px;
  filter: invert(32%) sepia(16%) saturate(0%) hue-rotate(137deg) brightness(99%) contrast(76%);
`;
