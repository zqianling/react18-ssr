import React from "react";
import App from "./page/App";
import { hydrateRoot } from "react-dom/client";

const root = document.getElementById("root");
const element = <App />;
hydrateRoot(root, element);
