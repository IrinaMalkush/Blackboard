import styled from "styled-components";

import { IconButton } from "../../components/IconButton";
import PencilIcon from "../../static/icons/pencil.svg";

export const Header = () => {
  const handlePaint = () => {
    console.log("paint");
  };

  return (
    <Container>
      <Buttons>
        <IconButton icon={PencilIcon} alt={"pencil"} onClick={handlePaint} />
      </Buttons>
    </Container>
  );
};

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background-color: #efefef;
`;

const Buttons = styled.div`
  margin: 12px;
`;
