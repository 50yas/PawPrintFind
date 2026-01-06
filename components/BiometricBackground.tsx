import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { Float, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../contexts/ThemeContext';
import { generateSphere, generateHelix, generatePaw } from '../src/utils/particleGenerators';

// Custom Shader Material for Morphing
const MorphMaterial = shaderMaterial(
  {
    uTime: 0,
    uMorph: 0,
    uColor: new THREE.Color('#22d3ee'),
    uSize: 0.003,
    uMouse: new THREE.Vector2(0, 0),
  },
  // Vertex Shader
  `
  varying vec3 vColor;
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform vec3 uColor;
  uniform vec2 uMouse;
  attribute vec3 targetPosition;
  attribute vec3 sourcePosition;

  void main() {
    vColor = uColor;
    
    // Smooth interpolation
    vec3 pos = mix(sourcePosition, targetPosition, uMorph);
    
    // Add some subtle waving animation
    pos.x += sin(uTime * 0.4 + pos.y * 2.0) * 0.08;
    pos.y += cos(uTime * 0.3 + pos.x * 2.0) * 0.08;
    pos.z += sin(uTime * 0.5 + pos.z * 2.0) * 0.08;

    // Subtle particle repulsion from mouse
    float distToMouse = distance(pos.xy, uMouse * 2.0);
    float repulsion = smoothstep(0.5, 0.0, distToMouse);
    pos.xy += (pos.xy - uMouse * 2.0) * repulsion * 0.2;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (400.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  // Fragment Shader
  `
  varying vec3 vColor;
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
    gl_FragColor = vec4(vColor, alpha * 0.9);
  }
  `
);

extend({ MorphMaterial });

// Particle Component
const Particles = ({ color, scrollProgress }: { color: string, scrollProgress: number }) => {
  const ref = useRef<any>();
  const materialRef = useRef<any>();
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const { mouse, viewport } = useThree();
  
  // Adaptive particle count
  const count = typeof window !== 'undefined' && window.innerWidth < 768 ? 3000 : 8000;
  
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
    const t = (time % 15) / 15;
    
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
      materialRef.current.uMouse.set(mouse.x, mouse.y);
    }

    if (ref.current) {
      // Rotation based on mouse + scroll
      const targetRotationX = (mouse.y * viewport.height) / 10 + scrollProgress * 2;
      const targetRotationY = (mouse.x * viewport.width) / 10 + scrollProgress * Math.PI;
      
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, targetRotationX + time / 20, 0.05);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetRotationY + time / 25, 0.05);
      
      // Scale based on scroll
      const targetScale = 1 + scrollProgress * 0.5;
      ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, targetScale, 0.05));

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
  const { colors, isDark } = useTheme();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      setScrollProgress(window.scrollY / maxScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] transition-colors duration-1000 w-full h-full" style={{ backgroundColor: colors.background }}>
      <Canvas camera={{ position: [0, 0, 1.8] }}>
        <fog attach="fog" args={[colors.background, 1, 4.5]} />
        <Float speed={2} rotationIntensity={0.8} floatIntensity={0.8}>
           <Particles color={colors.primary} scrollProgress={scrollProgress} />
        </Float>
      </Canvas>
      
      {/* Cinematic Overlay Gradients: Nebula Depth */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000" 
        style={{ 
          background: `linear-gradient(to top, ${colors.background}, ${colors.background}cc, transparent)`,
          opacity: isDark ? 0.8 : 0.4
        }} 
      />
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: `radial-gradient(ellipse at top, ${colors.primary}44, transparent, transparent)`,
          mixBlendingMode: 'screen'
        } as any} 
      />
      
      {/* Scroll-Reactive Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: `radial-gradient(circle, transparent 40%, ${colors.background} ${100 - scrollProgress * 20}%)`,
          opacity: 0.6 + scrollProgress * 0.4
        }} 
      />
      
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
  );
};