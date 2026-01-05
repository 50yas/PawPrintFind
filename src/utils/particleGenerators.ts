
import * as random from 'maath/random/dist/maath-random.esm';

export const generateSphere = (count: number) => {
  return random.inSphere(new Float32Array(count * 3), { radius: 1.5 });
};

export const generateHelix = (count: number) => {
  const helix = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 10;
    const r = 0.5;
    const side = i % 2 === 0 ? 1 : -1;
    helix[i * 3] = Math.cos(t) * r * side;
    helix[i * 3 + 1] = (i / count - 0.5) * 3;
    helix[i * 3 + 2] = Math.sin(t) * r * side;
  }
  return helix;
};

export const generatePaw = (count: number) => {
  const paw = new Float32Array(count * 3);
  const clusters = [
    { center: [0, -0.2, 0], radius: 0.5, weight: 0.6 }, // Main pad
    { center: [-0.4, 0.4, 0], radius: 0.2, weight: 0.1 }, // Toe 1
    { center: [-0.15, 0.6, 0], radius: 0.2, weight: 0.1 }, // Toe 2
    { center: [0.15, 0.6, 0], radius: 0.2, weight: 0.1 }, // Toe 3
    { center: [0.4, 0.4, 0], radius: 0.2, weight: 0.1 }, // Toe 4
  ];

  let currentParticle = 0;
  clusters.forEach(cluster => {
    const clusterCount = Math.floor(count * cluster.weight);
    const points = random.inSphere(new Float32Array(clusterCount * 3), { radius: cluster.radius });
    for (let i = 0; i < clusterCount; i++) {
      if (currentParticle < count) {
        paw[currentParticle * 3] = points[i * 3] + cluster.center[0];
        paw[currentParticle * 3 + 1] = points[i * 3 + 1] + cluster.center[1];
        paw[currentParticle * 3 + 2] = points[i * 3 + 2] + cluster.center[2];
        currentParticle++;
      }
    }
  });
  // Fill remaining
  for (let i = currentParticle; i < count; i++) {
    paw[i * 3] = (Math.random() - 0.5) * 0.1;
    paw[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    paw[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
  }
  return paw;
};
