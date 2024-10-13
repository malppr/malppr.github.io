import styles from "./HeroStyles.module.css";
// import heroImg from '../../assets/hero.png';
import heroImg from "../../assets/hero-cartoon.png";
import email from "../../assets/email.png";
import githubLight from "../../assets/github-light.svg";
import linkedinLight from "../../assets/linkedin-light.svg";
import CV from "../../assets/cv.pdf";
import { useTheme } from "../../common/ThemeContext";

function Hero() {
  return (
    <section id="hero" className={styles.container}>
      <div className={styles.colorModeContainer}>
        <img
          src={heroImg}
          className={styles.hero}
          alt="Profile picture of Bryan Chew"
        />
      </div>
      <div className={styles.info}>
        <h3>Hello, I'm</h3>
        <h1>Bryan Chew</h1>
        {/* <h2>Engineer</h2> */}
        <span>
          <a href="mailto:bryanchewlj@gmail.com" target="_blank">
            <img src={email} alt="Twitter icon" />
          </a>
          <a href="https://github.com/malppr" target="_blank">
            <img src={githubLight} alt="Github icon" />
          </a>
          <a href="https://www.linkedin.com/in/bchewlj/" target="_blank">
            <img src={linkedinLight} alt="Linkedin icon" />
          </a>
        </span>
        <p className={styles.description}>
          An engineer with a passion for all things tech, experienced in diverse
          fields including AI research, Product Design, and Robotics.
        </p>
        <a href={CV} download="Bryan_CV.pdf">
          <button className="hover">Resume</button>
        </a>
      </div>
    </section>
  );
}

export default Hero;
