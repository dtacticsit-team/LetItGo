import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initializeAnalytics } from "./analytics";
import "./index.css";
import App from "./App";

initializeAnalytics(import.meta.env.VITE_ANALYTICS_ENDPOINT);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
