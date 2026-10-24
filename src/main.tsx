import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { startAccount } from "@/game/account";
import { startTheme } from "@/lib/theme";
import { Crashed } from "@/screen/Crashed";

startTheme();
startAccount();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Crashed>
      <App />
    </Crashed>
  </StrictMode>,
);
