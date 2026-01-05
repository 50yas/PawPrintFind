import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';

import { generateSphere, generateHelix, generatePaw } from '../src/utils/particleGenerators';

import { Points, PointMaterial, Float, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useTheme } from '../contexts/ThemeContext';

import { generateSphere, generateHelix, generatePaw } from '../src/utils/particleGenerators';

// Custom Shader Material for Morphing
const MorphMaterial = shaderMaterial(
  {
    uTime: 0,
    uMorph: 0,
    uColor: new THREE.Color('#22d3ee'),
    uSize: 0.003,
  },
  // Vertex Shader
  `
  varying vec3 vColor;
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform vec3 uColor;
  attribute vec3 targetPosition;
  attribute vec3 sourcePosition;

  void main() {
    vColor = uColor;
    
    // Smooth interpolation
    vec3 pos = mix(sourcePosition, targetPosition, uMorph);
    
    // Add some subtle waving animation
    pos.x += sin(uTime * 0.5 + pos.y) * 0.05;
    pos.z += cos(uTime * 0.5 + pos.x) * 0.05;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  // Fragment Shader
  `
  varying vec3 vColor;
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    gl_FragColor = vec4(vColor, alpha * 0.8);
  }
  `
);

extend({ MorphMaterial });

// Particle Component
const Particles = ({ color }: { color: string }) => {
  const ref = useRef<any>();
  const materialRef = useRef<any>();
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  
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

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const t = (time % 10) / 10;
    
    let currentSource: Float32Array;
    let currentTarget: Float32Array;
    let factor = 0;

    if (t < 0.4) {
      currentSource = shapes.sphere;
      currentTarget = shapes.helix;
      factor = t / 0.4;
    } else if (t < 0.5) {
      currentSource = shapes.helix;
      currentTarget = shapes.helix;
      factor = 1;
    } else if (t < 0.9) {
      currentSource = shapes.helix;
      currentTarget = shapes.paw;
      factor = (t - 0.5) / 0.4;
    } else {
      currentSource = shapes.paw;
      currentTarget = shapes.sphere;
      factor = (t - 0.9) / 0.1;
    }

    if (materialRef.current) {
      materialRef.current.uTime = time;
      materialRef.current.uMorph = factor;
      materialRef.current.uColor = threeColor;
    }

    if (ref.current) {
      ref.current.rotation.x = time / 20;
      ref.current.rotation.y = time / 25;
      
      if (ref.current.geometry.attributes.sourcePosition.array !== currentSource) {
        ref.current.geometry.attributes.sourcePosition.array = currentSource;
        ref.current.geometry.attributes.sourcePosition.needsUpdate = true;
      }
      if (ref.current.geometry.attributes.targetPosition.array !== currentTarget) {
        ref.current.geometry.attributes.targetPosition.array = currentTarget;
        ref.current.geometry.attributes.targetPosition.needsUpdate = true;
      }
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={shapes.sphere}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-sourcePosition"
            count={count}
            array={shapes.sphere}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-targetPosition"
            count={count}
            array={shapes.helix}
            itemSize={3}
          />
        </bufferGeometry>
        {/* @ts-ignore */}
        <morphMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
};

// Main Component
export const BiometricBackground = () => {
  const { colors } = useTheme();

  return (
    <div className="fixed inset-0 z-[-1] bg-slate-950 w-full h-full" style={{ backgroundColor: colors.background }}>
      <Canvas camera={{ position: [0, 0, 1.5] }}>
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
           <Particles color={colors.primary} />
        </Float>
      </Canvas>
      {/* Cinematic Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent pointer-events-none" style={{ background: `linear-gradient(to top, ${colors.background}, ${colors.background}80, transparent)` }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at top, ${colors.primary}33, ${colors.background}00, ${colors.background}00)` }} />
    </div>
  );
};
