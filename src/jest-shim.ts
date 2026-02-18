import { vi } from 'vitest';

// Stub for jest-canvas-mock
declare global {
    var jest: any;
}

globalThis.jest = {
    fn: vi.fn,
    spyOn: vi.spyOn,
    mock: vi.mock,
    isMockFunction: vi.isMockFunction,
    requireActual: vi.importActual,
} as any;
