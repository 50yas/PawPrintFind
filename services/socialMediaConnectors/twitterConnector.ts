import { SocialMediaConnector } from './base';
import {
  SocialScheduledPost,
  SocialAnalytics,
  SocialPlatform,
  SocialPlatformCredential
} from '../../types';
import { logger } from '../loggerService';

/**
 * Twitter (X) API v2 Connector
 *
 * Documentation: https://developer.twitter.com/en/docs/twitter-api
 * Authentication: OAuth 2.0 with PKCE
 * Rate Limits: 50 tweets per 24 hours (Free tier)
 *
 * Features:
 * - Post tweets with text and images
 * - Schedule tweets (via third-party or manual scheduling)
 * - Fetch tweet analytics (impressions, engagement)
 *
 * Setup:
 * 1. Create app at https://developer.twitter.com/en/portal/dashboard
 * 2. Enable OAuth 2.0
 * 3. Add callback URL to Firebase Hosting
 * 4. Store Client ID and Client Secret in Firebase config
 */
export class TwitterConnector extends SocialMediaConnector {
  readonly platform: SocialPlatform = 'twitter';
  readonly displayName = 'Twitter (X)';
  readonly supportsScheduling = false; // Twitter API v2 doesn't support native scheduling
  readonly maxCaptionLength = 280; // Character limit
  readonly supportedImageFormats = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  readonly recommendedImageDimensions = { width: 1200, height: 675 }; // 16:9 aspect ratio

  private readonly baseUrl = 'https://api.twitter.com/2';
  private readonly uploadUrl = 'https://upload.twitter.com/1.1';

  /**
   * Authenticate with Twitter OAuth 2.0
   * Note: This should be called from a Cloud Function after OAuth callback
   */
  async authenticate(credentials: SocialPlatformCredential): Promise<void> {
    try {
      // Verify credentials by making a test API call
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info(`[Twitter] Authenticated successfully: ${data.data.username}`);
    } catch (error) {
      const errorMessage = this.handleError(error, 'Authentication');
      logger.error('[Twitter] Authentication failed:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Publish a tweet with optional image
   */
  async publishPost(
    post: SocialScheduledPost,
    credentials: SocialPlatformCredential
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      // Validate credentials
      if (!this.isCredentialsValid(credentials)) {
        return { success: false, error: 'Invalid or expired credentials' };
      }

      // Get content for Twitter
      const { caption, image } = this.getPostContent(post);

      if (!caption) {
        return { success: false, error: 'Caption is required for Twitter posts' };
      }

      // Upload image if present
      let mediaId: string | undefined;
      if (image) {
        mediaId = await this.uploadImage(image.url, credentials);
      }

      // Create tweet
      const tweetPayload: any = {
        text: caption
      };

      if (mediaId) {
        tweetPayload.media = {
          media_ids: [mediaId]
        };
      }

      const response = await fetch(`${this.baseUrl}/tweets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tweetPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to publish tweet');
      }

      const data = await response.json();
      const tweetId = data.data.id;

      logger.info(`[Twitter] Tweet published successfully: ${tweetId}`);

      return {
        success: true,
        postId: tweetId
      };
    } catch (error) {
      const errorMessage = this.handleError(error, 'Publish post');
      logger.error('[Twitter] Failed to publish tweet:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Twitter API v2 doesn't support native scheduling
   * Scheduling must be handled by our Cloud Function scheduler
   */
  async schedulePost(
    post: SocialScheduledPost,
    credentials: SocialPlatformCredential
  ): Promise<void> {
    throw new Error('Twitter does not support native scheduling. Use Cloud Scheduler instead.');
  }

  /**
   * Fetch analytics for a published tweet
   * Requires elevated access (Basic tier or higher)
   */
  async getAnalytics(
    postId: string,
    credentials: SocialPlatformCredential
  ): Promise<SocialAnalytics> {
    try {
      // Get tweet metrics (requires elevated access)
      const response = await fetch(
        `${this.baseUrl}/tweets/${postId}?tweet.fields=public_metrics,non_public_metrics`,
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      const metrics = data.data.public_metrics;
      const nonPublicMetrics = data.data.non_public_metrics || {};

      return {
        impressions: nonPublicMetrics.impression_count || metrics.impression_count || 0,
        clicks: nonPublicMetrics.url_link_clicks || 0,
        shares: metrics.retweet_count || 0,
        reach: metrics.impression_count || 0,
        engagement: metrics.like_count + metrics.reply_count + metrics.retweet_count,
        lastUpdated: new Date()
      };
    } catch (error) {
      const errorMessage = this.handleError(error, 'Get analytics');
      logger.error('[Twitter] Failed to fetch analytics:', errorMessage);

      // Return zero metrics if analytics fetch fails
      return {
        impressions: 0,
        clicks: 0,
        shares: 0,
        reach: 0,
        engagement: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Refresh access token using refresh token
   * Twitter OAuth 2.0 tokens expire after 2 hours
   */
  async refreshToken(credentials: SocialPlatformCredential): Promise<string> {
    try {
      if (!credentials.refreshToken) {
        throw new Error('Refresh token not available');
      }

      // Note: This requires Client ID and Client Secret from Firebase config
      // Should be called from a Cloud Function to keep secrets secure
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credentials.refreshToken,
          client_id: process.env.TWITTER_CLIENT_ID || '',
          client_secret: process.env.TWITTER_CLIENT_SECRET || ''
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('[Twitter] Access token refreshed successfully');

      return data.access_token;
    } catch (error) {
      const errorMessage = this.handleError(error, 'Refresh token');
      logger.error('[Twitter] Token refresh failed:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Upload image to Twitter and return media ID
   * Uses Twitter Upload API (v1.1)
   */
  private async uploadImage(imageUrl: string, credentials: SocialPlatformCredential): Promise<string> {
    try {
      // Fetch image from URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image');
      }

      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      // Upload to Twitter
      const response = await fetch(`${this.uploadUrl}/media/upload.json`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          media_data: base64Image
        })
      });

      if (!response.ok) {
        throw new Error(`Image upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info(`[Twitter] Image uploaded successfully: ${data.media_id_string}`);

      return data.media_id_string;
    } catch (error) {
      const errorMessage = this.handleError(error, 'Upload image');
      logger.error('[Twitter] Image upload failed:', errorMessage);
      throw new Error(errorMessage);
    }
  }
}

// Export singleton instance
export const twitterConnector = new TwitterConnector();
