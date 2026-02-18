import { SocialScheduledPost, SocialAnalytics, SocialPlatform, SocialPlatformCredential } from '../../types';

/**
 * Abstract base class for social media platform connectors
 *
 * Each platform connector must implement:
 * - authenticate(): OAuth flow and token management
 * - publishPost(): Publish a post immediately
 * - schedulePost(): Schedule a post for future publication (if supported)
 * - getAnalytics(): Fetch post performance metrics
 * - refreshToken(): Refresh expired access tokens
 *
 * Security: All credentials must be encrypted before storing in Firestore
 */
export abstract class SocialMediaConnector {
  abstract readonly platform: SocialPlatform;
  abstract readonly displayName: string;
  abstract readonly supportsScheduling: boolean;
  abstract readonly maxCaptionLength: number;
  abstract readonly supportedImageFormats: string[];
  abstract readonly recommendedImageDimensions: { width: number; height: number };

  /**
   * Authenticate with the social media platform
   * @param credentials Platform credentials with access token
   * @throws Error if authentication fails
   */
  abstract authenticate(credentials: SocialPlatformCredential): Promise<void>;

  /**
   * Publish a post immediately to the platform
   * @param post Scheduled post with captions and images
   * @param credentials Platform credentials
   * @returns Success status, platform post ID, or error message
   */
  abstract publishPost(
    post: SocialScheduledPost,
    credentials: SocialPlatformCredential
  ): Promise<{ success: boolean; postId?: string; error?: string }>;

  /**
   * Schedule a post for future publication (if supported by platform)
   * @param post Scheduled post with scheduledTime
   * @param credentials Platform credentials
   * @throws Error if platform doesn't support scheduling
   */
  abstract schedulePost(
    post: SocialScheduledPost,
    credentials: SocialPlatformCredential
  ): Promise<void>;

  /**
   * Fetch analytics/metrics for a published post
   * @param postId Platform-specific post ID
   * @param credentials Platform credentials
   * @returns Analytics data with impressions, clicks, shares, reach
   */
  abstract getAnalytics(
    postId: string,
    credentials: SocialPlatformCredential
  ): Promise<SocialAnalytics>;

  /**
   * Refresh expired access token
   * @param credentials Current credentials with refresh token
   * @returns New access token
   * @throws Error if refresh fails
   */
  abstract refreshToken(credentials: SocialPlatformCredential): Promise<string>;

  /**
   * Validate credentials before using them
   * @param credentials Platform credentials to validate
   * @returns True if credentials are valid and not expired
   */
  protected isCredentialsValid(credentials: SocialPlatformCredential): boolean {
    if (!credentials.accessToken) return false;
    if (!credentials.isActive) return false;

    const now = new Date();
    const expiresAt = new Date(credentials.expiresAt);

    // Check if token expires in next 5 minutes
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    return expiresAt > fiveMinutesFromNow;
  }

  /**
   * Truncate caption to platform's max length
   * @param caption Original caption text
   * @returns Truncated caption with ellipsis if needed
   */
  protected truncateCaption(caption: string): string {
    if (caption.length <= this.maxCaptionLength) {
      return caption;
    }
    return caption.substring(0, this.maxCaptionLength - 3) + '...';
  }

  /**
   * Extract caption and image for this platform from post
   * @param post Scheduled post
   * @returns Caption and image for this specific platform
   */
  protected getPostContent(post: SocialScheduledPost): {
    caption: string;
    image?: { url: string; dimensions: { width: number; height: number } };
  } {
    const caption = post.captions[this.platform] || '';
    const image = post.images[this.platform];

    return {
      caption: this.truncateCaption(caption),
      image
    };
  }

  /**
   * Handle API errors consistently across platforms
   * @param error Error object from API call
   * @param context Context about what operation failed
   * @returns Formatted error message
   */
  protected handleError(error: any, context: string): string {
    console.error(`[${this.platform}] ${context}:`, error);

    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }
}
