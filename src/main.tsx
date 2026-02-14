// Entry point - single BrowserRouter here, no router in App.tsx
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    {/* Mount router exactly once at the top-level to prevent remount/blink loops */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </HelmetProvider>
);
