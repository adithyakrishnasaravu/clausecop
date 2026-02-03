import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import DocumentPage from "./pages/DocumentPage";
import ClausePage from "./pages/ClausePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/documents/:id" element={<DocumentPage />} />
          <Route path="/clauses/:id" element={<ClausePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
