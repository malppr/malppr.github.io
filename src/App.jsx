import './App.css';
import Home from './sections/Home'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProjectsPage from './pages/ProjectsPage/ProjectsPage';
// import NavBar from './pages/NavBar/NavBar';

function App() {
  return (
    <Router>
      <div>
        {/* <NavBar /> Render NavBar on all pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects/:projectId" element={<ProjectsPage />} />
          {/* <Route path="/cv" element={<CVPage />} />  New CV Route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
