import { z } from 'zod';

export interface VersionInfo {
  version: string;
  buildNumber: number;
  buildTimestamp: string;
  commitHash: string;
  commitMessage: string;
  commitDate: string;
  isProduction: boolean;
  environment: string;
}

export interface VersionHistory {
  id: string;
  version: string;
  buildNumber: number;
  timestamp: number;
  changes: string[];
  changelog: string;
  createdBy: string;
  isMajor: boolean;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  minVersion?: string;
  maxVersion?: string;
  rolloutPercentage?: number;
  createdAt: number;
  updatedAt: number;
}

export interface VersionFeature {
  id: string;
  version: string;
  featureId: string;
  enabled: boolean;
  rolloutPercentage: number;
  rolloutStartTime?: number;
  rolloutEndTime?: number;
  feedbackCollected: boolean;
  userFeedback?: Record<string, any>;
}

export interface VersionStats {
  id: string;
  version: string;
  activeUsers: number;
  featureUsage: Record<string, number>;
  crashReports: number;
  performanceMetrics: {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
  feedbackScore: number;
  createdAt: number;
}

export const VersionInfoSchema = z.object({
  version: z.string().min(1),
  buildNumber: z.number().min(0),
  buildTimestamp: z.string().min(1),
  commitHash: z.string().min(1),
  commitMessage: z.string().min(1),
  commitDate: z.string().min(1),
  isProduction: z.boolean().default(false),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
});

export const VersionHistorySchema = z.object({
  id: z.string(),
  version: z.string().min(1),
  buildNumber: z.number().min(0),
  timestamp: z.number(),
  changes: z.array(z.string()).default([]),
  changelog: z.string().default(''),
  createdBy: z.string().email().default('system'),
  isMajor: z.boolean().default(false),
});

export const FeatureFlagSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional().default(''),
  enabled: z.boolean().default(false),
  minVersion: z.string().optional(),
  maxVersion: z.string().optional(),
  rolloutPercentage: z.number().min(0).max(100).default(100),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});

export const VersionFeatureSchema = z.object({
  id: z.string(),
  version: z.string().min(1),
  featureId: z.string().min(1),
  enabled: z.boolean().default(true),
  rolloutPercentage: z.number().min(0).max(100).default(100),
  rolloutStartTime: z.number().optional(),
  rolloutEndTime: z.number().optional(),
  feedbackCollected: z.boolean().default(false),
  userFeedback: z.record(z.string(), z.unknown()).default({}),
});

export const VersionStatsSchema = z.object({
  id: z.string(),
  version: z.string().min(1),
  activeUsers: z.number().min(0).default(0),
  featureUsage: z.record(z.string(), z.number()).default({}),
  crashReports: z.number().min(0).default(0),
  performanceMetrics: z.object({
    loadTime: z.number().min(0),
    firstContentfulPaint: z.number().min(0),
    largestContentfulPaint: z.number().min(0),
  }),
  feedbackScore: z.number().min(0).max(5).default(0),
  createdAt: z.number(),
});