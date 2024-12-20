import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import projectData from "./projectData"; // Import the project data
import "./ProjectsPage.css"; // Add your styles here

const ProjectsPage = () => {
  const { projectId } = useParams();
  // const [currentTab, setCurrentTab] = useState('Overview');
  const [project, setProject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load project data based on the id
    if (projectData[projectId]) {
      setProject(projectData[projectId]);
    }
  }, [projectId]);

  const goToHome = (id) => {
    navigate(`/`);
  };

  const renderTabContent = () => {
    if (project) {
      return project.content || <p>Tab content not found</p>;
    }
  };

  return (
    <div className="projects-page">
      <h1 className="back-button" onClick={() => goToHome(projectId)}>
        Back to Projects
      </h1>
      <h1 className="project-title">{project?.title}</h1>
      <div className="project-content">{renderTabContent()}</div>
    </div>
  );
};

export default ProjectsPage;
