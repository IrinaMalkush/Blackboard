import { useState } from "react";
import styled from "styled-components";

import { Canvas } from "../layouts/canvas/Canvas";
import { Header } from "../layouts/header/Header";
import { Tools } from "../types/tools";

export const Main = () => {
  const [selectedTool, setSelectedTool] = useState<Tools>("pencil");
  const handleClick = (tool: Tools) => {
    setSelectedTool(tool);
  };

  return (
    <Layout>
      <Header handleClick={handleClick} />
      <Canvas selectedTool={selectedTool} />
    </Layout>
  );
};

const Layout = styled.div`
  background-color: #f9f8f8;
  margin-top: 100px;
`;
