import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import Loader from "./components/Loader";
import "./index.css";

const clientId = "702572481682-gi5q72056ucms8ciifg5vlbjgvni880h.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <Loader>
          <App />
        </Loader>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);