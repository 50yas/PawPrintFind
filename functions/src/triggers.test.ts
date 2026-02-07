import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';
import fft from 'firebase-functions-test';

// Create persistent mocks for Firestore
const mockUpdate = vi.fn().mockResolvedValue({});
const mockSet = vi.fn().mockResolvedValue({});
const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => ({}) });
const mockDoc = vi.fn().mockReturnValue({
    update: mockUpdate,
    set: mockSet,
    get: mockGet
});
const mockAdd = vi.fn().mockResolvedValue({});
const mockCollection = vi.fn().mockReturnValue({
    doc: mockDoc,
    add: mockAdd
});

// Mock firebase-admin
vi.mock('firebase-admin', () => {
  return {
    initializeApp: vi.fn(),
    firestore: Object.assign(vi.fn(() => ({
        collection: mockCollection,
        doc: mockDoc,
    })), {
      FieldValue: {
        increment: vi.fn((n) => ({ type: 'increment', value: n })),
        serverTimestamp: vi.fn(() => 'mock-timestamp'),
      },
    }),
  };
});

import { onUserCreated, onStripePaymentSuccess, onSubscriptionChange } from './triggers';

const testEnv = fft();

describe('Firestore Triggers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('onUserCreated', () => {
        it('should queue a welcome email for a new user', async () => {
            const snapshot = {
                data: () => ({
                    email: 'test@example.com',
                    activeRole: 'owner'
                })
            } as any;
            
            const wrapped = testEnv.wrap(onUserCreated);
            await wrapped(snapshot, { params: { userId: 'user1' } });
            
            expect(mockCollection).toHaveBeenCalledWith('mail');
            expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
                to: ['test@example.com'],
                message: expect.objectContaining({
                    subject: expect.stringContaining('Welcome')
                })
            }));
        });

        it('should skip email if no email provided', async () => {
            const snapshot = { data: () => ({}) } as any;
            const wrapped = testEnv.wrap(onUserCreated);
            await wrapped(snapshot, { params: { userId: 'user1' } });
            expect(mockCollection).not.toHaveBeenCalledWith('mail');
        });
    });

    describe('onStripePaymentSuccess', () => {
        it('should update donation status on successful payment', async () => {
            const change = {
                after: {
                    data: () => ({
                        status: 'succeeded',
                        metadata: { donationId: 'don1' }
                    })
                }
            } as any;
            
            mockGet.mockResolvedValue({ exists: true, data: () => ({ status: 'pending' }) });
            
            const wrapped = testEnv.wrap(onStripePaymentSuccess);
            await wrapped(change, { params: { uid: 'u1', paymentId: 'pay1' } });
            
            expect(mockCollection).toHaveBeenCalledWith('donations');
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                status: 'paid',
                approved: true
            }));
        });
    });

    describe('onSubscriptionChange', () => {
        it('should sync subscription status to user document', async () => {
            const change = {
                after: {
                    data: () => ({
                        status: 'active',
                        items: [{ price: { id: 'price1' } }],
                        current_period_end: { seconds: 123456789 }
                    })
                }
            } as any;
            
            const wrapped = testEnv.wrap(onSubscriptionChange);
            await wrapped(change, { params: { uid: 'user123', subscriptionId: 'sub1' } });
            
            expect(mockCollection).toHaveBeenCalledWith('users');
            expect(mockDoc).toHaveBeenCalledWith('user123');
            expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
                subscription: expect.objectContaining({
                    status: 'active',
                    planId: 'vet_pro'
                })
            }), { merge: true });
        });

        it('should revoke subscription if document deleted', async () => {
            const change = {
                after: { data: () => null }
            } as any;
            
            const wrapped = testEnv.wrap(onSubscriptionChange);
            await wrapped(change, { params: { uid: 'user123', subscriptionId: 'sub1' } });
            
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                "subscription.status": "canceled"
            }));
        });
    });
});
