import styled from "styled-components";

import { Canvas } from "../layouts/canvas/Canvas";
import { Header } from "../layouts/header/Header";

export const Main = () => {
  return (
    <Layout>
      <Header />
      <Canvas />
    </Layout>
  );
};

const Layout = styled.div`
  background-color: #f9f8f8;
  margin-top: 100px;
`;
