import { gsap } from "gsap";

export const animations = () => {

  const triggerAnimation = () => {
    gsap.fromTo(
      ".ViewMusic",
      {
        y: 0,
      },
      {
        y: 3,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      }
    );

    gsap.fromTo(
      ".ViewMusic",
      {
        opacity: 1,
        y: 0,
        x: 550,
        scale: 0.7,
      },
      {
        opacity: 1,
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        duration: 0.6,
        scale: 1,
        ease: "power4.out",
      }
    );
    gsap.fromTo(
      "#peasy, #pnormal, #phard",
      {
        opacity: 0,
        y: 0,
        x: 100,
        scale: 1,
        
      },
      {
        delay: 0.6,
        opacity: 1,
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        duration: 0.6,
        scale: 1,
        ease: "back.inOut",
    }
  );

    gsap.fromTo(
      "#easy, #normal, #hard",
      {
        opacity: 0,
        y: 0,
        x: 0,
        rotate: 0,
        scale: 3,
      },
      {
       
        opacity: 1,
        x: 0,
        y: 0,
        rotateX: 0,
        rotationX: 0,
        rotationY: 0,
        duration: 0.7,
        scale: 1,
        ease: "back.inOut",
      }
    );
  };
  gsap.to(".StartMusic", {
        duration: 0.7,

        color: "rgb(104, 188, 224)",
        repeat: -1,
        yoyo: true
    });
    
  return triggerAnimation;
};
