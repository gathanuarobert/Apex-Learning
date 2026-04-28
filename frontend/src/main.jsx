import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import Loader from "./components/Loader";
import { AuthProvider } from "./hooks/useAuth";  
import "./index.css";
import { HelmetProvider } from "react-helmet-async";


const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AuthProvider>          
          <Loader>
            <App />
          </Loader>
        </AuthProvider>         
      </BrowserRouter>
    </GoogleOAuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);