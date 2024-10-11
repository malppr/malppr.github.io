import React from 'react';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './ProjectsPage.css'; // Add your styles here

const projectData = {
  '1': { title: 'Project One', tabs: ['Overview', 'Code', 'Live Demo'] },
  '2': { title: 'Project Two', tabs: ['Overview', 'Challenges', 'Code'] },
};

const ProjectsPage = () => {
  const { projectId } = useParams();
  const [currentTab, setCurrentTab] = useState('Overview');
  const [project, setProject] = useState(null);

  useEffect(() => {
    // Load project data based on the id
    if (projectData[projectId]) {
      setProject(projectData[projectId]);
    }
  }, [projectId]);

  const renderTabContent = () => {
    switch (currentTab) {
      case 'Overview':
        return <p>This is the overview of {project?.title}</p>;
      case 'Code':
        return <p>Code details for {project?.title}</p>;
      case 'Live Demo':
        return <p>Live demo for {project?.title}</p>;
      case 'Challenges':
        return <p>Challenges faced during {project?.title}</p>;
      default:
        return <p>Tab content not found</p>;
    }
  };

  return (
    <div className="projects-page">
      <h1>{project?.title}</h1>
      <div className="tabs">
        {project?.tabs.map((tab) => (
          <button
            key={tab}
            className={tab === currentTab ? 'active' : ''}
            onClick={() => setCurrentTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
};

export default ProjectsPage;
