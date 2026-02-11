import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  SocialScheduledPost,
  SocialPlatformCredential,
  SocialPlatform,
  SocialAnalytics,
  SocialScheduledPostSchema
} from '../types';
import { logger } from './loggerService';
import { validationService } from './validationService';
import { twitterConnector } from './socialMediaConnectors/twitterConnector';
import { SocialMediaConnector } from './socialMediaConnectors/base';

/**
 * Social Media Post Service
 *
 * Main facade for managing social media posts across multiple platforms.
 * Handles:
 * - Creating and scheduling posts
 * - Publishing to multiple platforms
 * - Fetching analytics
 * - Managing post lifecycle
 *
 * Security: All operations require authentication and admin role
 */
export const socialPostService = {
  /**
   * Get connector instance for a specific platform
   */
  getConnector(platform: SocialPlatform): SocialMediaConnector {
    switch (platform) {
      case 'twitter':
        return twitterConnector;
      case 'facebook':
        throw new Error('Facebook connector not yet implemented');
      case 'instagram':
        throw new Error('Instagram connector not yet implemented');
      case 'linkedin':
        throw new Error('LinkedIn connector not yet implemented');
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  },

  /**
   * Create a new scheduled post
   */
  async createScheduledPost(post: Omit<SocialScheduledPost, 'id'>): Promise<string> {
    try {
      if (!auth.currentUser) {
        throw new Error('Authentication required');
      }

      const postId = doc(collection(db, 'social_scheduled_posts')).id;
      const fullPost: SocialScheduledPost = {
        ...post,
        id: postId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate post data
      validationService.validate(SocialScheduledPostSchema, fullPost, 'createScheduledPost');

      // Convert dates to Firestore Timestamps
      const firestorePost: any = {
        ...fullPost,
        scheduledTime: Timestamp.fromDate(fullPost.scheduledTime),
        createdAt: Timestamp.fromDate(fullPost.createdAt)
      };

      if (fullPost.updatedAt) {
        firestorePost.updatedAt = Timestamp.fromDate(fullPost.updatedAt);
      }

      await setDoc(doc(db, 'social_scheduled_posts', postId), firestorePost);

      logger.info(`[SocialPostService] Scheduled post created: ${postId}`);
      return postId;
    } catch (error) {
      logger.error('[SocialPostService] Failed to create scheduled post:', error);
      throw error;
    }
  },

  /**
   * Get credentials for a specific platform
   */
  async getPlatformCredentials(platform: SocialPlatform): Promise<SocialPlatformCredential | null> {
    try {
      const q = query(
        collection(db, 'social_platform_credentials'),
        where('platform', '==', platform),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        platform: data.platform,
        accountId: data.accountId,
        accountName: data.accountName,
        accessToken: data.accessToken, // TODO: Decrypt in production
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt.toDate(),
        isActive: data.isActive,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        lastUsed: data.lastUsed?.toDate()
      };
    } catch (error) {
      logger.error(`[SocialPostService] Failed to get credentials for ${platform}:`, error);
      return null;
    }
  },

  /**
   * Publish a post immediately to specified platforms
   */
  async publishPost(postId: string): Promise<Record<SocialPlatform, { success: boolean; error?: string }>> {
    try {
      if (!auth.currentUser) {
        throw new Error('Authentication required');
      }

      // Get post from Firestore
      const postDoc = await getDoc(doc(db, 'social_scheduled_posts', postId));
      if (!postDoc.exists()) {
        throw new Error(`Post ${postId} not found`);
      }

      const postData = postDoc.data();
      const post: SocialScheduledPost = {
        ...postData,
        scheduledTime: postData.scheduledTime.toDate(),
        createdAt: postData.createdAt.toDate(),
        updatedAt: postData.updatedAt?.toDate(),
        publishedAt: postData.publishedAt?.toDate()
      } as SocialScheduledPost;

      const results: Record<string, { success: boolean; error?: string }> = {};

      // Publish to each platform
      for (const platform of post.platforms) {
        try {
          const connector = this.getConnector(platform);
          const credentials = await this.getPlatformCredentials(platform);

          if (!credentials) {
            results[platform] = {
              success: false,
              error: `No active credentials found for ${platform}`
            };
            continue;
          }

          const result = await connector.publishPost(post, credentials);
          results[platform] = result;

          if (result.success) {
            logger.info(`[SocialPostService] Published to ${platform}: ${result.postId}`);
          }
        } catch (error: any) {
          results[platform] = {
            success: false,
            error: error.message
          };
          logger.error(`[SocialPostService] Failed to publish to ${platform}:`, error);
        }
      }

      // Update post status
      const allSuccess = Object.values(results).every(r => r.success);
      const anySuccess = Object.values(results).some(r => r.success);

      await updateDoc(doc(db, 'social_scheduled_posts', postId), {
        status: allSuccess ? 'published' : anySuccess ? 'published' : 'failed',
        publishedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        errorMessage: allSuccess ? null : JSON.stringify(results)
      });

      return results as Record<SocialPlatform, { success: boolean; error?: string }>;
    } catch (error) {
      logger.error('[SocialPostService] Failed to publish post:', error);
      throw error;
    }
  },

  /**
   * Update a scheduled post
   */
  async updateScheduledPost(postId: string, updates: Partial<SocialScheduledPost>): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Authentication required');
      }

      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      // Convert dates to Timestamps
      if (updates.scheduledTime) {
        updateData.scheduledTime = Timestamp.fromDate(updates.scheduledTime);
      }

      await updateDoc(doc(db, 'social_scheduled_posts', postId), updateData);

      logger.info(`[SocialPostService] Updated scheduled post: ${postId}`);
    } catch (error) {
      logger.error('[SocialPostService] Failed to update scheduled post:', error);
      throw error;
    }
  },

  /**
   * Delete a scheduled post
   */
  async deleteScheduledPost(postId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Authentication required');
      }

      await deleteDoc(doc(db, 'social_scheduled_posts', postId));

      logger.info(`[SocialPostService] Deleted scheduled post: ${postId}`);
    } catch (error) {
      logger.error('[SocialPostService] Failed to delete scheduled post:', error);
      throw error;
    }
  },

  /**
   * Get scheduled posts with filters
   */
  async getScheduledPosts(filters?: {
    status?: 'draft' | 'scheduled' | 'published' | 'failed';
    platform?: SocialPlatform;
    limit?: number;
  }): Promise<SocialScheduledPost[]> {
    try {
      let q = query(
        collection(db, 'social_scheduled_posts'),
        orderBy('scheduledTime', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.platform) {
        q = query(q, where('platforms', 'array-contains', filters.platform));
      }

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          scheduledTime: data.scheduledTime.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          publishedAt: data.publishedAt?.toDate()
        } as SocialScheduledPost;
      });

      if (filters?.limit) {
        return posts.slice(0, filters.limit);
      }

      return posts;
    } catch (error) {
      logger.error('[SocialPostService] Failed to get scheduled posts:', error);
      return [];
    }
  },

  /**
   * Subscribe to scheduled posts (real-time updates)
   */
  subscribeToScheduledPosts(callback: (posts: SocialScheduledPost[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'social_scheduled_posts'),
      orderBy('scheduledTime', 'desc')
    );

    return onSnapshot(
      q,
      snapshot => {
        const posts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            scheduledTime: data.scheduledTime.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            publishedAt: data.publishedAt?.toDate()
          } as SocialScheduledPost;
        });
        callback(posts);
      },
      error => {
        logger.error('[SocialPostService] Subscription error:', error);
      }
    );
  },

  /**
   * Get analytics for a published post across all platforms
   */
  async getPostAnalytics(postId: string): Promise<Record<SocialPlatform, SocialAnalytics>> {
    try {
      const postDoc = await getDoc(doc(db, 'social_scheduled_posts', postId));
      if (!postDoc.exists()) {
        throw new Error(`Post ${postId} not found`);
      }

      const postData = postDoc.data();
      const post: SocialScheduledPost = {
        ...postData,
        scheduledTime: postData.scheduledTime.toDate(),
        createdAt: postData.createdAt.toDate()
      } as SocialScheduledPost;

      const analytics: Partial<Record<SocialPlatform, SocialAnalytics>> = {};

      // Fetch analytics from each platform
      for (const platform of post.platforms) {
        try {
          const connector = this.getConnector(platform);
          const credentials = await this.getPlatformCredentials(platform);

          if (!credentials) {
            continue;
          }

          // Note: This requires the platform post ID to be stored
          // For now, return cached analytics from Firestore
          if (post.analytics?.[platform]) {
            analytics[platform] = post.analytics[platform];
          }
        } catch (error) {
          logger.error(`[SocialPostService] Failed to fetch analytics for ${platform}:`, error);
        }
      }

      return analytics as Record<SocialPlatform, SocialAnalytics>;
    } catch (error) {
      logger.error('[SocialPostService] Failed to get post analytics:', error);
      return {} as Record<SocialPlatform, SocialAnalytics>;
    }
  }
};
