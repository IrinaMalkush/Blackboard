import styled from "styled-components";

export interface IDownloadButtonProps {
  text: string;
  onClick: () => void;
}

export const DownloadButton = ({ text, onClick }: IDownloadButtonProps) => {
  return <Button onClick={onClick}>{text}</Button>;
};

const Button = styled.button`
  height: 34px;
  background-color: #dcdcdc;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;

  &:hover {
    background-color: #b8b6b6;
    transition: 0.3s ease;
  }

  &:active {
    background-color: #61d6d0;
  }
`;
