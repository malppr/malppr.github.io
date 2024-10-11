import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css'; // You can style the navbar using CSS

const NavBar = () => {
  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/projects/1">Projects</Link></li>
        <li><a href="/ResumeBryan.pdf" download="YourName_CV.pdf">CV</a></li>
        </ul>
    </nav>
  );
};

export default NavBar;
