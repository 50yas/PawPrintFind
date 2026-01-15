
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks to ensure they are available before imports
const { fetchAndActivateMock, getStringMock } = vi.hoisted(() => {
    return { 
        fetchAndActivateMock: vi.fn(), 
        getStringMock: vi.fn() 
    };
});

vi.mock('firebase/remote-config', () => ({
    fetchAndActivate: fetchAndActivateMock,
    getString: getStringMock
}));

vi.mock('./firebase', () => ({
    remoteConfig: { settings: {} }
}));

// Import after mocks
import { configService } from './configService';

describe('configService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    it('should return Gemini API key from Remote Config if available', async () => {
        getStringMock.mockReturnValue('remote-key-123');
        
        const key = await configService.getGeminiKey();
        
        expect(fetchAndActivateMock).toHaveBeenCalled();
        expect(getStringMock).toHaveBeenCalledWith(expect.anything(), 'gemini_api_key');
        expect(key).toBe('remote-key-123');
    });

    it('should fallback to environment variable if Remote Config key is empty', async () => {
        getStringMock.mockReturnValue(''); // Empty string from remote config
        vi.stubEnv('VITE_GEMINI_API_KEY', 'env-key-456');
        
        const key = await configService.getGeminiKey();
        
        expect(key).toBe('env-key-456');
    });

    it('should fallback to environment variable if Remote Config fetch fails', async () => {
        fetchAndActivateMock.mockRejectedValue(new Error('Fetch failed'));
        vi.stubEnv('VITE_GEMINI_API_KEY', 'env-key-789');
        
        // configService swallows the error
        const key = await configService.getGeminiKey();
        
        expect(key).toBe('env-key-789');
    });
});
