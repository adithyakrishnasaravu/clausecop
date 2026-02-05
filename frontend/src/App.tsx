import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import DocumentPage from "./pages/DocumentPage";
import ClausePage from "./pages/ClausePage";
import SearchPage from "./pages/SearchPage";
import ProjectPage from "./pages/ProjectPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/documents/:id" element={<DocumentPage />} />
          <Route path="/clauses/:id" element={<ClausePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/projects/:id" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
