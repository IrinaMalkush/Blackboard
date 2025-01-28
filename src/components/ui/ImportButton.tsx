import React, { useRef } from "react";
import styled from "styled-components";

export interface IImportButtonProps {
  text: string;
  onClick: (file: File) => void;
}

export const ImportButton = ({ text, onClick }: IImportButtonProps) => {
  const hiddenFileInput = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (hiddenFileInput.current) {
      hiddenFileInput.current.click();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onClick(file);
    }
  };

  return (
    <div>
      <Button onClick={handleClick}>{text}</Button>
      <input
        type="file"
        ref={hiddenFileInput}
        onChange={handleChange}
        accept=".pdf,.png,.jpg,.jpeg"
        style={{ display: "none" }}
      />
    </div>
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
  min-width: 120px;

  &:hover {
    background-color: #b8b6b6;
    transition: 0.3s ease;
  }

  &:active {
    background-color: #61d6d0;
  }
`;
