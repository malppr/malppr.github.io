import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import ProjectsPage from './pages/ProjectsPage/ProjectsPage';
import NavBar from './pages/NavBar/NavBar';
import './App.css';

function App() {
  return (
    <Router>
      <div>
        <NavBar /> {/* Render NavBar on all pages */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects/:projectId" element={<ProjectsPage />} />
          {/* <Route path="/cv" element={<CVPage />} />  New CV Route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

