import React from "react";
import Header from "../page/Header";
import Footer from "../page/Footer";
import User from "../page/User";
const routerConfig = [
  {
    path: "/",
    element: <Header />,
    index: true,
  },
  {
    path: "/footer",
    element: <Footer />,
  },
  {
    path: "/user",
    element: <User />,
  },
];

export default routerConfig;
