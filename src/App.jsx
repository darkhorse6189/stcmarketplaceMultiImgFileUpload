import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import STCMarketplace from "./pages/STCMarketplace";
const App = () => {

  return (
      <BrowserRouter>
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
      </BrowserRouter>
  );
};

export default App;
