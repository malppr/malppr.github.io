import styles from "./ProjectsStyles.module.css";
import leap from "../../assets/project-pics/leap.jpg";
import hyperx from "../../assets/project-pics/hyperx.jpg";
import beetlebot from "../../assets/project-pics/beetlebot.jpg";
import grips from "../../assets/project-pics/grips.png";
import tms from "../../assets/project-pics/tms.png";
import robobook from "../../assets/project-pics/robobook.png";
import kneeexo from "../../assets/project-pics/kneeexo.png";
import lumicomb from "../../assets/project-pics/lumicomb.jpg";
import ProjectCard from "../../common/ProjectCard";
function Projects() {
  return (
    <section id="projects" className={styles.container}>
      <div className="sectionTitle">
        <h1>Projects</h1>
        <em>Click on them to learn more!</em>
      </div>
      <div className={styles.projectsContainer}>
        <ProjectCard
          src={beetlebot}
          link="/projects/p1"
          h3="BeetleBot"
          p="An autonomous Robotic Refuse bin replacement system for urban areas."
        />
        <ProjectCard
          src={leap}
          link="/projects/p2"
          h3="LEAP TTS"
          p="Development of a Text-to-Speech Model combining LLMs and Diffusion Models."
        />
        <ProjectCard
          src={lumicomb}
          link="/projects/p3"
          h3="LumiComb"
          p="A Socially interactive and Walkable Light Exhibition for a post-Covid world."
        />
        <ProjectCard
          src={grips}
          link="/projects/p4"
          h3="Golden Grips"
          p="Designing a Ergonomic and Elderly-Friendly phone grip adapter."
        />
        <ProjectCard
          src={kneeexo}
          link="/projects/p5"
          h3="Knee-Exoskeleton"
          p="A pneumatically powered Walking Assistance Exoskeleton for the knees."
        />

        <ProjectCard
          src={hyperx}
          link="/projects/p6"
          h3="HyperX TTS"
          p="Hyperparameter efficient Model Adaption of Text-to-Speech for new languages."
        />
        <ProjectCard
          src={robobook}
          link="/projects/p7"
          h3="Social Robo-Shelf"
          p="A study on how a Robotic Bookshelf can promote reading for children."
        />
        <ProjectCard
          src={tms}
          link="/projects/p8"
          h3="TMS Coil Research"
          p="Development of a more effective Transcranial Magnetic Stimulation coil. "
        />
      </div>
    </section>
  );
}

export default Projects;
