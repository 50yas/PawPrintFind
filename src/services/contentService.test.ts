
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentService } from './contentService';
import { db, auth } from './firebase';
import { setDoc, updateDoc, deleteDoc, getDocs, addDoc } from 'firebase/firestore';
import { ChatSessionSchema, ChatMessageSchema, DonationSchema, BlogPostSchema } from '../types';

vi.mock('./firebase', () => ({
  db: { _isDb: true },
  auth: { currentUser: { uid: 'user123' } }
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn().mockReturnValue({ id: 'mock-doc' }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  query: vi.fn(),
  where: vi.fn(),
  or: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  arrayUnion: vi.fn(),
  increment: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'doc123' })
}));

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn().mockResolvedValue({ user: { uid: 'anon123' } })
}));

vi.mock('./geminiService', () => ({
  translateContent: vi.fn().mockImplementation(async (text, langs) => {
    const res: any = {};
    langs.forEach((l: string) => res[l] = `Translated ${text} to ${l}`);
    return res;
  })
}));

describe('contentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validChatSession = {
    id: 's1',
    petId: 'p1',
    petName: 'Buddy',
    petPhotoUrl: 'http://photo.url',
    ownerEmail: 'owner@test.com',
    finderEmail: 'finder@test.com',
    messages: []
  };

  const validChatMessage = {
    senderEmail: 'owner@test.com',
    text: 'Hello',
    timestamp: Date.now()
  };

  const validDonation = {
    id: 'd1',
    donorName: 'John',
    amount: '€10',
    message: 'Good luck',
    timestamp: Date.now(),
    status: 'paid',
    approved: true,
    isPublic: true
  };

  const validBlogPost = {
    id: 'b1',
    title: 'Title',
    slug: 'title',
    summary: 'Summary of the post',
    content: 'Full content',
    author: 'Admin',
    tags: ['pet'],
    publishedAt: Date.now(),
    seoTitle: 'SEO Title',
    seoDescription: 'SEO Desc',
    views: 0
  };

  it('saveChatSession calls setDoc', async () => {
    await contentService.saveChatSession(validChatSession as any);
    expect(setDoc).toHaveBeenCalled();
  });

  it('sendChatMessage calls updateDoc', async () => {
    await contentService.sendChatMessage('s1', validChatMessage as any);
    expect(updateDoc).toHaveBeenCalled();
  });

  it('recordDonation calls setDoc', async () => {
    await contentService.recordDonation(validDonation as any);
    expect(setDoc).toHaveBeenCalled();
  });

  it('saveBlogPost calls setDoc and includes translations', async () => {
    await contentService.saveBlogPost(validBlogPost as any);
    expect(setDoc).toHaveBeenCalled();
    const saveCall = vi.mocked(setDoc).mock.calls[0];
    const savedData = saveCall[1] as any;
    expect(savedData.translations).toBeDefined();
    expect(savedData.translations.es.title).toBe('Translated Title to es');
  });

  it('deleteBlogPost calls deleteDoc', async () => {
    await contentService.deleteBlogPost('b1');
    expect(deleteDoc).toHaveBeenCalled();
  });

  it('incrementBlogPostView calls updateDoc', async () => {
    await contentService.incrementBlogPostView('b1');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('getDonations calls getDocs', async () => {
    await contentService.getDonations();
    expect(getDocs).toHaveBeenCalled();
  });

  it('getBlogPosts calls getDocs', async () => {
    await contentService.getBlogPosts();
    expect(getDocs).toHaveBeenCalled();
  });

  it('confirmDonation calls updateDoc with isConfirmed true', async () => {
    await contentService.confirmDonation('d1');
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { isConfirmed: true, approved: true });
  });
});
