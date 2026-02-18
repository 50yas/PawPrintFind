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
    expect(validated).toMatchObject(validUser);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should throw an error for invalid data', () => {
    const invalidUser = { ...validUser, email: 'not-an-email' };
    expect(() => validationService.validate(UserSchema, invalidUser, 'test')).toThrow(
      /Data integrity failure/
    );
    
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle missing required fields by throwing', () => {
    const incompleteUser = { uid: '123' };
    expect(() => validationService.validate(UserSchema, incompleteUser, 'test-incomplete')).toThrow();
  });
});
