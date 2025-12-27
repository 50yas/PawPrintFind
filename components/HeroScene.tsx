'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Icosahedron, MeshDistortMaterial, Points, PointMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';

const AICore = () => {
  const meshRef = useRef<THREE.Group>(null);
  const particleRef = useRef<THREE.Points>(null);
  const [glitchFactor, setGlitchFactor] = useState(1);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      // 1. Slow breathing pulse
      const pulse = 1 + Math.sin(time * 0.8) * 0.05;
      meshRef.current.scale.set(pulse, pulse, pulse);
      
      // 2. Glitch rotation logic every ~5 seconds
      if (Math.floor(time) % 5 === 0 && Math.sin(time * 10) > 0.8) {
        meshRef.current.rotation.y += 0.5;
        meshRef.current.rotation.z += 0.2;
        setGlitchFactor(1.5);
      } else {
        meshRef.current.rotation.y += 0.005;
        setGlitchFactor(1);
      }
    }
    
    if (particleRef.current) {
      particleRef.current.rotation.y -= 0.01 * glitchFactor;
    }
  });

  const particlesCount = 400;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      const r = 1.2 * Math.pow(Math.random(), 0.5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  return (
    <group ref={meshRef}>
      {/* Geodesic Wireframe Shell */}
      <Icosahedron args={[1.5, 2]}>
        <meshBasicMaterial 
          color="#00D2FF" 
          wireframe 
          transparent 
          opacity={0.3 * glitchFactor} 
          blending={THREE.AdditiveBlending}
        />
      </Icosahedron>

      {/* Internal Biometric Data Cloud */}
      <Points ref={particleRef} positions={positions} stride={3}>
        <PointMaterial
          transparent
          color="#FFB02E"
          size={0.04}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      {/* Core Glow */}
      <Icosahedron args={[0.5, 1]}>
        <MeshDistortMaterial
          color="#00D2FF"
          emissive="#00D2FF"
          emissiveIntensity={2}
          distort={0.4}
          speed={4}
          transparent
          opacity={0.1}
        />
      </Icosahedron>
    </group>
  );
};

const NeuralNetwork = () => {
  const count = 100;
  const { mouse, viewport } = useThree();
  const [nodes] = useState(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 25,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 10
        ),
        speed: Math.random() * 0.01
      });
    }
    return temp;
  });

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = new THREE.Object3D();
  const tempColor = new THREE.Color();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const mouseX = (mouse.x * viewport.width) / 2;
    const mouseY = (mouse.y * viewport.height) / 2;

    nodes.forEach((node, i) => {
      const { position, speed } = node;
      position.y += Math.sin(time + i) * speed;
      
      tempObject.position.copy(position);
      tempObject.updateMatrix();
      meshRef.current?.setMatrixAt(i, tempObject.matrix);

      // Mouse proximity color logic (Safety Amber activation)
      const dist = position.distanceTo(new THREE.Vector3(mouseX, mouseY, 0));
      const intensity = Math.max(0, 1 - dist / 5);
      tempColor.set(intensity > 0.4 ? '#FFB02E' : '#00D2FF');
      meshRef.current?.setColorAt(i, tempColor);
    });
    
    if (meshRef.current) {
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial(), count]} />
  );
};

export const HeroScene: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-[#0B1120]">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <fog attach="fog" args={['#0B1120', 10, 30]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} color="#00D2FF" intensity={2} />
        
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
        
        <NeuralNetwork />
        
        <group position={[3.5, 0, 0]} scale={1.2}>
          <AICore />
        </group>

        {/* Global HUD Scanning Line Simulation */}
        <Line 
            points={[[-20, 0, 0], [20, 0, 0]]} 
            color="#00D2FF" 
            lineWidth={0.5} 
            transparent 
            opacity={0.02} 
            position={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
};