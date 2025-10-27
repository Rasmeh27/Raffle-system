import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Asegúrate de tener este archivo con el contenido de tu componente App
import "./index.css"; // Asegúrate de tener este archivo con tus estilos globales

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);