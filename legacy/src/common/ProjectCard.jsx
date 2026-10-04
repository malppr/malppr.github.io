import React from 'react';
import { Link } from "react-router-dom";
import "./ProjectCard.css"
function ProjectCard({ src, link, h3, p }) {
  return (
    <Link to={link} className="project-card">
      <div className="image-container">
        <img className="hover" src={src} alt={`${h3} logo`} />
      </div>
      <div className="text-container">
        <h3>{h3}</h3>
        <p>{p}</p>
      </div>
    </Link>
  );
}

export default ProjectCard;
