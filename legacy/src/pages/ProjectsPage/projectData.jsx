import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const projectData = {
  p1: {
    title: "BeetleBot",
    content: (
      <div>
        <img
          src="/capstone/key.jpg"
          alt="Beetlebot key image"
          className="key-image"
        />
        <h2>
          An autonomous Robotic Refuse bin replacement system for urban areas.
        </h2>
        <p>
          Beetlebot was developed in collaboration with NCS Pte Ltd as part of
          my final-year capstone project. The goal was to create an autonomous
          robotic solution for replacing bins, specifically for airport
          environments. Our team built a full-scale prototype, attaching it to
          an NCS robotic mobile base that utilized a forklift-like mechanism to
          transport bins to a central collection point.
          <br />
          <br /> We developed the software and algorithms in ROS for the robot
          to autonomously move bins. Combined with the mobile base's navigation
          stack, this created a fully automated bin replacement system.
          Additionally, we designed a mobile app, a web application, and a
          back-end server to schedule the robots in a potential swarm, allowing
          users to monitor and control the entire system.
          <br />
          <br />
          As the lead for the robotic unit development, my responsibilities
          included overseeing software and electronics integration, as well as
          engineering the hardware to ensure smooth operation.
          <br />
          <br />
          You can read more about this project{" "}
          <a
            href="https://capstoneshowcase.sutd.edu.sg/project/beetlebot-the-future-of-waste-management/"
            target="_blank"
          >
            here.
          </a>
        </p>
        <iframe
          width="400"
          height="250"
          src="https://www.youtube.com/embed/jKT9NWG_ypI?si=NnmFnIYY_IXPrIei"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>{" "}
        <h1>Gallery</h1>
        <Carousel className="gallery" showArrows={true}>
          <div className="gallery">
            <img src="/capstone/nice.png" />
          </div>

          <div className="gallery">
            <img src="/capstone/camera.png" />
          </div>

          <div className="gallery">
            <img src="/capstone/robotstructure.png" />
          </div>
          <div className="gallery">
            <img src="/capstone/takingall.png" />
          </div>
          <div className="gallery">
            <img src="/capstone/proto.png" />
          </div>
          <div className="gallery">
            <img src="/capstone/holding.png" />
          </div>
        </Carousel>
      </div>
    ),
  },
  p2: {
    title: "LEAP Text-to-Speech",
    content: (
      <div>
        <img src="/leap/key.png" alt="Leap key image" className="key-image" />

        <h2>A Text-to-Speech Model combining LLMs and Diffusion Models.</h2>
        <p>
          {" "}
          At the Deep Cognition and Language Research (DeCLaRe) Lab, I worked on
          developing a state-of-the-art text-to-speech model designed for
          zero-shot scenarios. This model can generate high-quality speech in
          the style of a speaker after analyzing just a 3-second audio sample.
          The architecture leverages a large language model, taking words and
          phonemes as input to produce speech via reverse diffusion. <br />
          <br /> I built the full training and evaluation pipeline using PyTorch
          and DeepSpeed, while also exploring alternative model architectures
          such as GANs and VAEs. This ongoing project aims to advance speech
          synthesis technologies.
        </p>
        <h3>Sample Ground Truth</h3>
        <audio controls>
          <source src="/leap/reconstru.wav" type="audio/wav"></source>
          <source src="/leap/prediction.wav" type="audio/wav"></source>
        </audio>
        <h3>Sample Prediction</h3>
        <audio controls>
          <source src="/leap/prediction.wav" type="audio/wav"></source>
        </audio>
      </div>
    ),
  },
  p3: {
    title: "LumiComb",
    content: (
      <div>
        <img
          src="/lumicomb/key.jpg"
          alt="LumiComb key image"
          className="key-image"
        />
        <h2>
          A Socially interactive and Walkable Light Exhibition for a post-Covid
          world.{" "}
        </h2>
        <p>
          LumiComb was created in 2021 as part of the 3.007 Design Thinking and
          Innovation module. Set in a post-COVID recovery context, this project
          aimed to encourage social interaction through a walkable light
          exhibition with dynamic, interactive light patterns.
          <br />
          <br />
          The exhibit was designed as a series of hexagonal tiles that detect
          when people stand on them, with each tile changing colors to form an
          overall pattern. Several patterns were programmed to respond to human
          presence, such as linking people through illuminated connections or
          creating expanding circles as people moved between adjacent tiles.
          <br />
          <br />A small-scale prototype was built using 3D-printed wood
          filament, motion sensors, and LED strips to test the interaction
          patterns. Two full-scale units were also constructed, using recycled
          wooden planks along with LED lighting and motion sensors to bring the
          concept to life.
        </p>
        <h1>Gallery</h1>
        <Carousel className="gallery" showArrows={true}>
          {/* <div className="gallery">
            <img src="/lumicomb/standing.jpeg" />
          </div> */}

          <div className="gallery">
            <img src="/lumicomb/largeannot.png" />
          </div>

          <div className="gallery">
            <img src="/lumicomb/BestSmall.jpg" />
          </div>
          <div className="gallery">
            <img src="/lumicomb/reallife.jpg" />
          </div>
          <div className="gallery">
            <img src="/lumicomb/spec1.png" />
          </div>
          <div className="gallery">
            <img src="/lumicomb/spec2.png" />
          </div>
          <div className="gallery">
            <img src="/lumicomb/overallflow.png" />
          </div>
        </Carousel>
      </div>
    ),
  },
  p4: {
    title: "Golden Grips",
    content: (
      <div>
        <img
          src="/grips/key.png"
          alt="Golden Grips key image"
          className="key-image"
        />
        <h2>Designing a Ergonomic and Elderly-Friendly phone grip adapter.</h2>

        <p>
          As part of the 30.120 Design & Manufacturing module, a phone adapter
          was designed to help the elderly handle and use their phones more
          easily. The adapter features an ergonomic grip and an attachable
          baseplate with loops for an adjustable strap, allowing users to
          securely fasten the phone to their hand.
          <br />
          <br />
          This project aimed to create a functional souvenir for the school,
          with a focus on scalability and cost-effectiveness. The design used
          accessible materials, primarily 3D-printed components, and an
          inexpensive strap. 3D printing was key to the iterative design
          process, enabling us to test and refine the adapter for optimal
          comfort. Additionally, scalable manufacturing methods were evaluated
          to ensure the design could be mass-produced efficiently.
        </p>
        <h1>Gallery</h1>
        <Carousel className="gallery" showArrows={true}>
          <div className="gallery">
            <img src="/grips/complete.png" />
          </div>

          <div className="gallery">
            <img src="/grips/process1.png" />
          </div>

          <div className="gallery">
            <img src="/grips/process2.png" />
          </div>
          <div className="gallery">
            <img src="/grips/assembly.png" />
          </div>
          <div className="gallery">
            <img src="/grips/test.png" />
          </div>
        </Carousel>
      </div>
    ),
  },
  p5: {
    title: "Knee-Exoskeleton",
    content: (
      <div>
        <img
          src="/knee/key.jpg"
          alt="Knee-Exoskeleton key image"
          className="key-image"
        />
        <h2>
          A pneumatically powered Walking Assistance Exoskeleton for the knees.
        </h2>

        <p>
          This knee exoskeleton, developed as part of the 30.007 Engineering
          Design Innovation module, features pneumatic actuators that assist
          with walking. The actuators use novel pouch designs that contract when
          inflated, powered by small air compressors housed in a waist bag. An
          Arduino-controlled system of air valves directs airflow, with a flex
          sensor detecting knee movement to activate the exoskeleton and provide
          assistance.
          <br />
          <br />
          For comfort and support, knee straps were made from stretchable fabric
          using fabric printing, while a 3D-printed brace was used for
          structural support. I led the team on this project, designing the
          braces and pneumatic pouches, while overseeing the integration of all
          components.
        </p>
        <h1>Gallery</h1>
        <Carousel className="gallery" showArrows={true}>
          <div className="gallery">
            <img src="/knee/layout.jpeg" />
          </div>

          <div className="gallery">
            <img src="/knee/sidebrace.png" />
          </div>

          <div className="gallery">
            <img src="/knee/poster.jpg" />
          </div>
        </Carousel>
      </div>
    ),
  },
  p6: {
    title: "HyperX Text-to-Speech",
    content: (
      <div>
        <img
          src="/leap/hyperkey.png"
          alt="HyperX key image"
          className="key-image"
        />

        <h2>
          Leveraging Parameter-Efficient Transfer Learning for Multi-Lingual
          Text-to-Speech Adaptation
        </h2>
        <p>
          Different languages have unique phonetic systems and prosodic
          features, making it challenging to develop a Text-to-Speech (TTS)
          model that can effectively synthesize speech in multilingual settings.
          This project integrated parameter-efficient transfer learning (PETL)
          techniques, such as adapters and hypernetworks, into TTS architecture
          for multilingual speech synthesis.
          <br />
          <br />
          As part of the project, I modified the model to support the input of
          new phonemes from different languages. Additionally, I developed a
          data-processing pipeline for the CS10 dataset and fine-tuned the model
          on several languages.
          <br />
          <br />
          You can read more about this work{" "}
          <a href="https://arxiv.org/abs/2406.17257" target="_blank">
            here.
          </a>
        </p>
      </div>
    ),
  },
  p7: {
    title: "Social Robo-Shelf",
    content: (
      <div>
        <img
          src="/book/key.png"
          alt="Robo-Shelf key image"
          className="key-image"
        />
        <h2>
          A study on how a Robotic Bookshelf can promote reading for children.{" "}
        </h2>

        <p>
          This project began as part of a design workshop for a children's
          library, where the concept of an interactive robotic bookshelf was
          developed to engage children and encourage them to read. The idea
          evolved into a formal study, where a prototype robotic bookshelf was
          created and tested to assess its impact on children's reading habits.
          <br />
          <br />
          The bookshelf was designed in the shape of an elephant, featuring a
          continuum mechanism to mimic an elephant’s trunk, and could be
          controlled remotely. I was responsible for designing and building the
          robot’s hardware and software systems. Additionally, I planned and
          wrote the initial study proposal, which was successfully approved by
          my university's Institutional Review Board (IRB).
          <br />
          <br />
          This study was later published in the IEEE ROMAN 2023, which can be
          found here{" "}
          <a
            href="https://www.researchgate.net/publication/375626848_Reading_or_iPad_Gaming_Investigating_Socially_Interactive_Robotic_Bookshelf_Proactively_Engages_Children_in_Reading_Physical_Books"
            target="_blank"
          >
            here.
          </a>
        </p>
        <h1>Gallery</h1>
        <Carousel className="gallery" showArrows={true}>
          <div className="gallery">
            <img src="/book/bare.jpg" />
          </div>

          <div className="gallery">
            <img src="/book/design.png" />
          </div>

          <div className="gallery">
            <img src="/book/continum.png" />
          </div>
        </Carousel>
      </div>
    ),
  },
  p8: {
    title: "Transcranial Magnetic Stimulation Coil Research",
    content: (
      <div>
        <img
          src="/tms/tms.png"
          alt="TMS coil key image"
          className="key-image"
        />
        <h2>
          Static Negative Permeability Metasurface Based Transcranial Magnetic
          Stimulation Coil{" "}
        </h2>

        <p>
          Transcranial Magnetic Stimulation (TMS) is a non-invasive treatment
          that uses brain stimulation to treat conditions such as depression. In
          this project, a novel TMS coil was developed to project virtual
          figure-8 loops below the surface of the head, enabling a more focused
          point of stimulation. Prototype coils were hand-wound and tested using
          a high-voltage setup with electric field detectors, even through a
          pig’s heads, to validate the effectiveness of the design.
          <br />
          <br />
          This research contributed to a PhD thesis but, due to unforeseen
          delays, was not able to be published.
        </p>
        <h1>Gallery</h1>
        <Carousel className="gallery" showArrows={true}>
          <div className="gallery">
            <img src="/tms/closeup.png" />
          </div>

          <div className="gallery">
            <img src="/tms/readings.png" />
          </div>

          <div className="gallery">
            <img src="/tms/setup.png" />
          </div>
        </Carousel>
      </div>
    ),
  },
};

export default projectData;
