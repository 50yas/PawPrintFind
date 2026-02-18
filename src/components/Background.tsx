
import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';

// --- Configuration ---
const BASE_PARTICLE_COUNT = 4000;
const GLOBE_RADIUS = 12;

function NeuralNetwork({ count }: { count: number }) {
    const ref = useRef<THREE.Points>(null);
    const { mouse, viewport } = useThree();

    // Create particle positions on a sphere
    const [positions, colors] = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorInside = new THREE.Color("#00D2FF"); // Gemini Teal
        const colorOutside = new THREE.Color("#FFB02E"); // Safety Amber

        for (let i = 0; i < count; i++) {
            // Spherical distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = GLOBE_RADIUS + (Math.random() - 0.5) * 2;

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const mixedColor = colorInside.clone().lerp(colorOutside, Math.random() * 0.3);
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }
        return [positions, colors];
    }, [count]);

    useFrame((state) => {
        if (!ref.current) return;

        // Slow automatic rotation
        ref.current.rotation.y += 0.0005;
        ref.current.rotation.x += 0.0002;

        // Mouse Interaction
        const x = (mouse.x * viewport.width) / 2;
        const y = (mouse.y * viewport.height) / 2;

        ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, y * 0.05, 0.05);
        ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, x * 0.05, 0.05);
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    vertexColors
                    size={0.12}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
}

const GradientOverlay = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-[#0B1120] via-transparent to-[#0B1120]/80 z-0 pointer-events-none" />
);

export const Background = () => {
    const [dpr, setDpr] = useState(1);
    const [particleCount, setParticleCount] = useState(BASE_PARTICLE_COUNT);

    return (
        <div className="fixed inset-0 z-0 bg-[#0B1120]">
            <Canvas 
                camera={{ position: [0, 0, 20], fov: 60 }} 
                dpr={dpr} 
                gl={{ powerPreference: "high-performance", antialias: false }}
            >
                <PerformanceMonitor 
                    onIncline={() => setDpr(2)} 
                    onDecline={() => {
                        setDpr(1);
                        setParticleCount(prev => Math.max(1000, prev - 500));
                    }} 
                />
                <fog attach="fog" args={['#0B1120', 10, 40]} />
                <NeuralNetwork count={particleCount} />
            </Canvas>
            <GradientOverlay />
        </div>
    );
};
