import { describe, it, expect, vi } from 'vitest';
import { validationService } from './validationService';
import { UserSchema, User } from '../types';
import { logger } from './loggerService';

vi.mock('./loggerService', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('ValidationService', () => {
  const validUser: User = {
    uid: '123',
    email: 'test@example.com',
    roles: ['owner'],
    activeRole: 'owner',
    friends: [],
    friendRequests: [],
    points: 100,
    badges: [],
    createdAt: Date.now()
  };

  it('should validate valid data successfully', () => {
    const validated = validationService.validate(UserSchema, validUser, 'test');
    expect(validated).toEqual(validUser);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should log a warning and return data for invalid data', () => {
    const invalidUser = { ...validUser, email: 'not-an-email' };
    const validated = validationService.validate(UserSchema, invalidUser, 'test');
    
    expect(validated).toEqual(invalidUser);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('[Validation] [test] Data integrity issue detected:'),
      expect.any(Object)
    );
  });

  it('should handle missing required fields', () => {
    const incompleteUser = { uid: '123' };
    validationService.validate(UserSchema, incompleteUser, 'test-incomplete');
    
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('[Validation] [test-incomplete] Data integrity issue detected:'),
      expect.any(Object)
    );
  });
});
