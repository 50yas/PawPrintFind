import React from 'react';
import { PetProfile } from '../types';

/**
 * Virtual scrolling for pet lists
 *
 * Note: This is a placeholder for virtual scrolling using react-window.
 * The new react-window API has changed significantly. This component can be
 * implemented when needed for lists with >100 items.
 *
 * For now, we rely on:
 * - CSS-based optimizations (will-change, containment)
 * - React.memo for individual pet cards
 * - Lazy loading with IntersectionObserver
 *
 * Usage:
 * ```tsx
 * const shouldVirtualize = useVirtualization(pets.length);
 * if (shouldVirtualize) {
 *   return <VirtualPetList pets={pets} renderPet={(pet) => <PetCard pet={pet} />} />;
 * }
 * return pets.map(pet => <PetCard pet={pet} />);
 * ```
 */

interface VirtualPetListProps {
  pets: PetProfile[];
  renderPet: (pet: PetProfile) => React.ReactNode;
  className?: string;
}

/**
 * Virtual scrolling list (placeholder - use manual optimization for now)
 */
export const VirtualPetList: React.FC<VirtualPetListProps> = ({
  pets,
  renderPet,
  className = ''
}) => {
  return (
    <div className={className} style={{ contain: 'layout style paint' }}>
      {pets.map((pet) => (
        <div key={pet.id} style={{ willChange: 'transform' }}>
          {renderPet(pet)}
        </div>
      ))}
    </div>
  );
};

interface VirtualPetGridProps {
  pets: PetProfile[];
  renderPet: (pet: PetProfile) => React.ReactNode;
  columns?: number;
  className?: string;
}

/**
 * Virtual scrolling grid (placeholder - use manual optimization for now)
 */
export const VirtualPetGrid: React.FC<VirtualPetGridProps> = ({
  pets,
  renderPet,
  columns = 3,
  className = ''
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '2rem',
        contain: 'layout style paint'
      }}
    >
      {pets.map((pet) => (
        <div key={pet.id} style={{ willChange: 'transform' }}>
          {renderPet(pet)}
        </div>
      ))}
    </div>
  );
};

/**
 * Hook to determine if virtualization should be used
 * Returns true if pet count exceeds threshold
 */
export const useVirtualization = (itemCount: number, threshold: number = 50): boolean => {
  return itemCount > threshold;
};
