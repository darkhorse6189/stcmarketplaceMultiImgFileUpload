import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import STCMarketplace from "./pages/STCMarketplace";

import AuthProvider from "./AuthProvider"

const App = () => {

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Marketplaces */}
          <Route
            path="/"
            element={
              <STCMarketplace
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
