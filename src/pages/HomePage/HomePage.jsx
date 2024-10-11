import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { useInView } from 'react-intersection-observer';
import './HomePage.css'; // Styles for the page

const HomePage = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location

  useEffect(() => {
    // Simulate fetching highlighted projects from an API
    const fetchedProjects = [
      { id: 'p1', title: 'Project One', description: 'Description for project one', imageUrl: 'TTSmodel.jpg' },
      { id: 'p2', title: 'Project Two', description: 'Description for project two', imageUrl: 'TTSmodel.jpg' }
    ];
    setProjects(fetchedProjects);
    
    // Scroll to the section if there's a hash in the URL
    if (location.hash) {
      const section = document.querySelector(location.hash);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  const goToProject = (id) => {
    navigate(`/projects/${id}`);
  };

  return (
    <div className="home">
      <section id="bio" className="full-page-section bio-section">
        <header className="bio">
          <h1>Your Name</h1>
          <p>This is a short bio about yourself and your work.</p>
        </header>
      </section>

      <section id="projects" className="projects-highlight">
        <h2>Highlighted Projects</h2>
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onClick={() => goToProject(project.id)} />
          ))}
        </div>
      </section>
    </div>
  );
};

const ProjectCard = ({ project, onClick }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} id={project.id} className={`project-card ${inView ? 'visible' : 'hidden'}`} onClick={onClick}>
      <img src={project.imageUrl} alt={project.title} />
      <div className="project-card.description">
        <h3>{project.title}</h3>
        <p>{project.description}</p>
      </div>
    </div>
  );
};

export default HomePage;
