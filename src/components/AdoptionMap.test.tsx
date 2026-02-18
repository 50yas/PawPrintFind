
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdoptionMap } from './AdoptionMap';
import React from 'react';

// Mock Leaflet
const mockMap = {
    setView: vi.fn().mockReturnThis(),
    addLayer: vi.fn().mockReturnThis(),
    removeLayer: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn().mockReturnThis(),
};

const mockMarker = {
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
};

const mockGroup = {
    addLayer: vi.fn().mockReturnThis(),
    clearLayers: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
};

global.L = {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    control: { zoom: vi.fn(() => ({ addTo: vi.fn() })) },
    featureGroup: vi.fn(() => mockGroup),
    divIcon: vi.fn((config) => config),
    marker: vi.fn(() => mockMarker),
    circleMarker: vi.fn(() => ({ addTo: vi.fn(), remove: vi.fn() })),
} as any;

// Mock context/hooks
vi.mock('../contexts/ThemeContext', () => ({
    useTheme: () => ({ colors: { primary: '#000', surfaceContainer: '#000', surfaceContainerLow: '#000' } })
}));

vi.mock('../hooks/useTranslations', () => ({
    useTranslations: () => ({ t: (k: string) => k })
}));

vi.mock('../hooks/useGeolocation', () => ({
    useGeolocation: () => ({
        location: null,
        error: null,
        loading: false,
        getLocation: vi.fn()
    })
}));

describe('AdoptionMap', () => {
    const mockAdoptablePets = [
        {
            id: '1',
            name: 'Buddy',
            breed: 'Golden Retriever',
            status: 'forAdoption',
            photos: [{ url: 'test.jpg' }],
            homeLocations: [{ latitude: 40, longitude: 10 }]
        }
    ] as any;

    it('initializes the map and renders adoptable pets', () => {
        render(<AdoptionMap adoptablePets={mockAdoptablePets} onAdoptMe={vi.fn()} />);
        
        expect(global.L.map).toHaveBeenCalled();
        expect(global.L.marker).toHaveBeenCalledWith([40, 10], expect.any(Object));
    });

    it('shows loading state when isLoading is true', () => {
        const { container } = render(<AdoptionMap adoptablePets={[]} onAdoptMe={vi.fn()} isLoading={true} />);
        const loader = container.querySelector('.animate-spin');
        expect(loader).toBeInTheDocument();
    });
});
