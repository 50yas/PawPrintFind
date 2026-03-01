
import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';

// --- Configuration ---
const BASE_PARTICLE_COUNT = 4000;
const GLOBE_RADIUS = 12;

// Node color categories: AI Teal, Lost Pet Red, Safe/Found Amber, Community Purple
const NODE_COLORS = [
    new THREE.Color("#00D2FF"), // AI network / active nodes
    new THREE.Color("#ef4444"), // Emergency / lost pets
    new THREE.Color("#f59e0b"), // Safe / found pets
    new THREE.Color("#8b5cf6"), // Community / karma
    new THREE.Color("#10b981"), // Verified / safe
];

function NeuralNetwork({ count }: { count: number }) {
    const ref = useRef<THREE.Points>(null);
    const { mouse, viewport } = useThree();

    // Create particle positions on a sphere
    const [positions, colors, sizes] = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Spherical distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            // Mix: 80% on sphere, 20% scattered in cloud around it
            const r = Math.random() < 0.8
                ? GLOBE_RADIUS + (Math.random() - 0.5) * 2
                : GLOBE_RADIUS * (0.6 + Math.random() * 0.8);

            positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            // Weighted color distribution: 55% teal, 15% red, 20% amber, 5% purple, 5% green
            const rnd = Math.random();
            let colorBase: THREE.Color;
            if (rnd < 0.55) colorBase = NODE_COLORS[0];
            else if (rnd < 0.70) colorBase = NODE_COLORS[2];
            else if (rnd < 0.85) colorBase = NODE_COLORS[1];
            else if (rnd < 0.93) colorBase = NODE_COLORS[3];
            else colorBase = NODE_COLORS[4];

            const jitter = (Math.random() - 0.5) * 0.15;
            const c = colorBase.clone().multiplyScalar(0.8 + Math.abs(jitter) * 3);
            colors[i * 3]     = Math.min(1, c.r + jitter);
            colors[i * 3 + 1] = Math.min(1, c.g + jitter);
            colors[i * 3 + 2] = Math.min(1, c.b + jitter);

            // Varied particle sizes: most small, some bright "nodes"
            sizes[i] = Math.random() < 0.05 ? 0.22 + Math.random() * 0.1 : 0.06 + Math.random() * 0.08;
        }
        return [positions, colors, sizes];
    }, [count]);

    useFrame((state) => {
        if (!ref.current) return;

        // Slow automatic rotation
        ref.current.rotation.y += 0.0004;
        ref.current.rotation.x += 0.00015;

        // Gentle oscillation
        ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.15) * 0.03;

        // Mouse Interaction
        const x = (mouse.x * viewport.width) / 2;
        const y = (mouse.y * viewport.height) / 2;

        // Scroll Parallax
        const scrollY = window.scrollY;
        const scrollOffset = scrollY * 0.0005;

        ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, (y * 0.05) + scrollOffset, 0.05);
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
    <>
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1120] via-transparent to-[#0B1120]/80 z-0 pointer-events-none" />
        {/* Ambient pulsing rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
            <div className="absolute w-[40vmax] h-[40vmax] rounded-full border border-cyan-500/5 animate-ping" style={{ animationDuration: '8s' }} />
            <div className="absolute w-[60vmax] h-[60vmax] rounded-full border border-cyan-500/3 animate-ping" style={{ animationDuration: '12s', animationDelay: '2s' }} />
            <div className="absolute w-[30vmax] h-[30vmax] rounded-full" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)' }} />
        </div>
        {/* Top-left glow (emergency/lost) */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full pointer-events-none z-0"
             style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 70%)' }} />
        {/* Bottom-right glow (karma/community) */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full pointer-events-none z-0"
             style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)' }} />
    </>
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
                <NeuralNetwork key={particleCount} count={particleCount} />
            </Canvas>
            <GradientOverlay />
        </div>
    );
};
