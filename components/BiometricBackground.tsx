import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';

import { generateSphere, generateHelix, generatePaw } from '../src/utils/particleGenerators';

// Particle Component
const Particles = (props: any) => {
  const ref = useRef<any>();
  
  // Adaptive particle count based on device
  const count = typeof window !== 'undefined' && window.innerWidth < 768 ? 2000 : 5000;
  
  // Generate shapes
  const shapes = useMemo(() => {
    return {
      sphere: generateSphere(count),
      helix: generateHelix(count),
      paw: generatePaw(count)
    };
  }, [count]);

  const [positions, setPositions] = useState(shapes.sphere);
  const currentPositions = useRef(new Float32Array(count * 3));

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Cycle every 10 seconds: 0-4s Helix, 4-6s transition, 6-10s Paw, etc.
    const t = (time % 10) / 10;
    
    let target: Float32Array;
    let source: Float32Array;
    let factor = 0;

    if (t < 0.4) {
      source = shapes.sphere;
      target = shapes.helix;
      factor = t / 0.4;
    } else if (t < 0.5) {
      source = shapes.helix;
      target = shapes.helix;
      factor = 1;
    } else if (t < 0.9) {
      source = shapes.helix;
      target = shapes.paw;
      factor = (t - 0.5) / 0.4;
    } else {
      source = shapes.paw;
      target = shapes.sphere;
      factor = (t - 0.9) / 0.1;
    }

    if (ref.current) {
      ref.current.rotation.x = time / 15;
      ref.current.rotation.y = time / 20;

      // Only update positions if we are in transition or need to
      const positionsArray = ref.current.geometry.attributes.position.array;
      for (let i = 0; i < count * 3; i++) {
        positionsArray[i] += (source[i] + (target[i] - source[i]) * factor - positionsArray[i]) * 0.1;
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#22d3ee" // Cyan-400
          size={0.003}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
          blending={2} // Additive blending
        />
      </Points>
    </group>
  );
};

// Main Component
export const BiometricBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-slate-950 w-full h-full">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
           <Particles />
        </Float>
      </Canvas>
      {/* Cinematic Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none" />
    </div>
  );
};
