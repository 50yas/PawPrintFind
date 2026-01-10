
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentService } from './contentService';
import { db, auth } from './firebase';
import { setDoc, updateDoc, deleteDoc, getDocs, addDoc } from 'firebase/firestore';

vi.mock('./firebase', () => ({
  db: { _isDb: true },
  auth: { currentUser: { uid: 'user123' } }
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
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

describe('contentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saveChatSession calls setDoc', async () => {
    const session: any = { id: 's1', messages: [] };
    await contentService.saveChatSession(session);
    expect(setDoc).toHaveBeenCalled();
  });

  it('sendChatMessage calls updateDoc', async () => {
    const msg: any = { text: 'hi' };
    await contentService.sendChatMessage('s1', msg);
    expect(updateDoc).toHaveBeenCalled();
  });

  it('recordDonation calls setDoc', async () => {
    const donation: any = { id: 'd1', amount: '€10' };
    await contentService.recordDonation(donation);
    expect(setDoc).toHaveBeenCalled();
  });

  it('saveBlogPost calls setDoc', async () => {
    const post: any = { id: 'b1', title: 'Title' };
    await contentService.saveBlogPost(post);
    expect(setDoc).toHaveBeenCalled();
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
});
