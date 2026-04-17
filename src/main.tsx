import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { bootstrapRevenueCat } from "./lib/revenuecat";
import "./index.css";

void bootstrapRevenueCat({});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
