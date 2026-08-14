import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  useAnimations,
  useGLTF,
  Center
} from '@react-three/drei';
import * as THREE from 'three';
import "./3dModel.css";

const MODEL_URL =
  `${import.meta.env.BASE_URL}3dModels/idle_yukiko.glb`;

function YukikoModel() {
  const { scene, animations } = useGLTF(MODEL_URL);

  const { actions, names } = useAnimations(
    animations,
    scene
  );

  useEffect(() => {
    console.log('Animações disponíveis:', names);

    const idle = actions[names[0]];

    if (!idle) return;

    idle
      .reset()
      .setLoop(THREE.LoopRepeat, Infinity)
      .fadeIn(0.3)
      .play();

    return () => {
      idle.fadeOut(0.3);
      idle.stop();
    };
  }, [actions, names]);

  return (
    <Center>
      <primitive
        object={scene}
        scale={1}
      />
    </Center>
  );
}

useGLTF.preload(MODEL_URL);

export default function Yukiko() {
  return (
    <div
      className="YukikoModel"
    >
      <Canvas
        camera={{
          position: [-2.7, 2, 3],
          fov: 18
        }}
      >
        <ambientLight intensity={0.8} color="#FFFFFF" />

        <directionalLight
          position={[0, 0, 1]}
          intensity={10}
          color="#6182FF"
        />

        <Suspense fallback={null}>
          <YukikoModel />
        </Suspense>

        <OrbitControls target={[0,2,0]}  />
      </Canvas>
    </div>
  );
}