
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

  it('saveBlogPost calls setDoc and includes translations', async () => {
    const post: any = { id: 'b1', title: 'Title', summary: 'Summary', content: 'Content' };
    await contentService.saveBlogPost(post);
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
});
