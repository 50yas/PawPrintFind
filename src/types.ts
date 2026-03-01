import { z } from 'zod';

// Version Management Types
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
  changes: z.array(z.string()).optional().default([]),
  changelog: z.string().optional().default(''),
  createdBy: z.string().email().optional().default('system'),
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

export type UserRole = 'owner' | 'vet' | 'shelter' | 'volunteer' | 'super_admin';

export type View = 'home' | 'register' | 'find' | 'dashboard' | 'editPet' |
  'vetDashboard' | 'myClinic' | 'myPatients' | 'patientDetail' |
  'smartCalendar' | 'findVet' | 'linkVet' | 'community' |
  'shelterDashboard' | 'adoptionCenter' | 'lostPetsCenter' | 'registerForAdoption' |
  'donors' | 'adminDashboard' | 'pressKit' | 'volunteerDashboard' |
  'blog' | 'blogPost' | 'blogDetail' | 'paymentSuccess' | 'publicPetDetail' | 'notFound' | 'ecosystemHub' |
  'riderMissionCenter' | 'karmaStore' | 'leaderboard' | 'userProfile';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
  traceId?: string;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string; // e.g. 'VERIFY_USER', 'DELETE_PET'
  targetId?: string; // uid of user or id of pet
  details: string;
  timestamp: number;
}

export interface SearchConfig {
  id: string;
  breedMatchWeight: number;
  locationWeight: number;
  ageWeight: number;
  lastUpdated: number;
  isAutoOptimized: boolean;
}

export interface OptimizationTrial {
  id: string;
  params: {
    breedMatchWeight: number;
    locationWeight: number;
    ageWeight: number;
  };
  score: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface SavedSearch {
  id: string;
  userEmail: string;
  name: string;
  filters: any;
  timestamp: number;
}

export interface AdminKey {
  id?: string;
  keyHash: string;
  createdBy: string;
  createdAt: number;
  status: 'active' | 'revoked' | 'used';
  label?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  author: string;
  imageUrl?: string;
  tags: string[];
  publishedAt: number;
  seoTitle: string;
  seoDescription: string;
  views: number;
  translations?: {
    [lang: string]: {
      title: string;
      summary: string;
      content: string;
    }
  };
}

export interface VetVerificationRequest {
  id: string;
  vetUid: string;
  vetEmail: string;
  clinicName: string;
  licenseNumber: string;
  specialization: string[];
  documentUrls: string[];           // URLs to uploaded docs in Firebase Storage
  documentTypes?: Record<string, string>; // Mapping of doc URL to type (e.g. 'Medical License')
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;              // Admin email
  rejectionReason?: string;
  grantedProOnApproval?: boolean;   // Whether admin granted Pro tier on approval
}


export const VetVerificationRequestSchema = z.object({
  id: z.string().optional(),
  vetUid: z.string(),
  vetEmail: z.string().email(),
  clinicName: z.string().min(1),
  licenseNumber: z.string().min(1),
  specialization: z.array(z.string()).min(1),
  documentUrls: z.array(z.string().url()).min(1),
  documentTypes: z.record(z.string(), z.string()).optional(),
  status: z.enum(['pending', 'approved', 'rejected']),
  submittedAt: z.number(),
  reviewedAt: z.number().optional(),
  reviewedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
  grantedProOnApproval: z.boolean().optional(),
});


export interface User {
  uid: string;
  email: string;
  phoneNumber?: string;
  roles: UserRole[];
  activeRole: UserRole;
  friends: string[];
  friendRequests: { from: string, timestamp: number }[];
  points: number;
  badges: string[];
  isVerified?: boolean;
  verificationData?: {
    docUrl: string;
    timestamp: number;
  };
  joinedAt?: number;
  lastLoginAt?: number;
  createdAt?: number;
  status?: 'active' | 'suspended' | 'banned';
  stats?: {
    sightingsReported: number;
    reunionsSupported: number;
  };

  // Vet Subscription Status
  subscription?: {
    status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing';
    planId: 'vet_free' | 'vet_pro';
    currentPeriodEnd: number;
    stripeSubscriptionId?: string;
  };

  // Vet Freemium Fields
  vetTier?: 'free' | 'pro';                    // Current subscription tier
  vetProExpiry?: number;                       // Timestamp when Pro expires
  vetMonthlyPatientsLimit?: number;            // Free: 5, Pro: unlimited
  vetCurrentMonthPatients?: number;            // Current month patient count
  vetDocumentsSubmitted?: boolean;             // Has submitted verification docs
  vetLicenseNumber?: string;                   // Professional license number
  vetSpecialization?: string[];                // Specializations
  isVetVerified?: boolean;                     // Admin approved verification

  // Hardened Verification Lifecycle
  verificationStatus?: 'none' | 'pending' | 'approved' | 'declined';
  verificationSubmittedAt?: number;
  rejectionReason?: string;

  // Karma & Rider System
  karmaBalance?: number;
  karmaTier?: 'scout' | 'tracker' | 'ranger' | 'guardian' | 'legend';
  streakDays?: number;
  lastActiveDate?: string;

  // Profile customization
  displayName?: string;
  bio?: string;
  photoURL?: string;
  notificationsEnabled?: boolean;
}

export interface MatchResult {
  pet: PetProfile;
  score: number;
  keyMatches: string[];
  discrepancies: string[];
  reasoning: string;
}

export interface VetClinic {
  id?: string;
  vetEmail: string;
  name: string;
  address: string;
  phone: string;
  location?: Geolocation;
  isVerified?: boolean;
}

export interface UniqueMark {
  x: number;
  y: number;
  description: string;
}

export interface PhotoWithMarks {
  id: string;
  url: string;
  file?: File;
  marks: UniqueMark[];
  description: string;
  timestamp?: number;
  isAIValidated?: boolean;
}

export interface Sighting {
  id: string;
  location: Geolocation;
  timestamp: number;
  notes: string;
  photo?: PhotoWithMarks;
}

export interface HealthCheck {
  timestamp: number;
  symptoms: string;
  advice: string;
}

export interface AIInsight {
  id: string;
  title: string;
  content: string;
  type: 'health' | 'behavior' | 'safety';
  timestamp: number;
}

export interface Vaccination {
  name: string;
  date: string;
}

export interface MedicalRecord {
  allergies: string;
  chronicConditions: string;
  medications: string;
  vaccinations: Vaccination[];
  healthScore?: number;
  lastCheckup?: number;
  notes?: string;
}

export interface PetProfile {
  id: string;
  ownerEmail: string | null;
  guardianEmails: string[];
  status: 'owned' | 'stray' | 'forAdoption';
  vetEmail?: string;
  vetLinkStatus: 'unlinked' | 'pending' | 'linked';
  isLost: boolean;
  name: string;
  type?: string;
  breed: string;
  color?: string;
  gender?: string;
  size?: 'Small' | 'Medium' | 'Large';
  age: string;
  weight: string;
  behavior: string;
  description?: string;
  photos: PhotoWithMarks[];
  homeLocations: Geolocation[];
  lastSeenLocation: Geolocation | null;
  searchRadius: number | null;
  sightings: Sighting[];
  videoAnalysis: string;
  audioNotes: string;
  healthChecks: HealthCheck[];
  medicalRecord?: MedicalRecord;
  aiIdentityCode?: string;
  aiPhysicalDescription?: string;
  aiInsights?: AIInsight[];
}

export interface Geolocation {
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  address?: string;
}

export interface Appointment {
  id: string;
  vetEmail: string;
  petId: string;
  petName: string;
  date: string;
  time: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  requestedBy: 'owner' | 'vet';
}

export interface ChatMessage {
  senderEmail: string;
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  petId: string;
  petName: string;
  petPhotoUrl: string;
  ownerEmail: string;
  finderEmail: string;
  messages: ChatMessage[];
}

export interface Donation {
  id: string;
  donorName: string;
  realName?: string;
  email?: string;
  amount: string;
  numericValue?: number;
  message: string;
  timestamp: number;
  avatarUrl?: string;
  status: 'pending_payment' | 'paid' | 'failed';
  approved: boolean;
  isConfirmed?: boolean; // Admin manually confirms the donation
  isPublic: boolean;
  stripeSessionId?: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: number;
}

// Zod Schemas
export const UserRoleSchema = z.enum(['owner', 'vet', 'shelter', 'volunteer', 'super_admin']);

export const GeolocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  address: z.string().optional(),
});

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  phoneNumber: z.string().optional(),
  roles: z.array(UserRoleSchema).default(['owner']),
  activeRole: UserRoleSchema.default('owner'),
  friends: z.array(z.string()).default([]),
  friendRequests: z.array(z.object({
    from: z.string(),
    timestamp: z.number(),
  })).default([]),
  points: z.number().default(0),
  badges: z.array(z.string()).default([]),
  isVerified: z.boolean().optional().default(false),
  verificationData: z.object({
    docUrl: z.string().url(),
    timestamp: z.number(),
  }).optional(),
  joinedAt: z.number().optional(),
  lastLoginAt: z.number().optional(),
  createdAt: z.number().optional(),
  status: z.enum(['active', 'suspended', 'banned']).optional().default('active'),
  stats: z.object({
    sightingsReported: z.number().default(0),
    reunionsSupported: z.number().default(0),
  }).optional(),
  verificationStatus: z.enum(['none', 'pending', 'approved', 'declined']).optional().default('none'),
  verificationSubmittedAt: z.number().optional(),
  rejectionReason: z.string().optional(),
});

export const UniqueMarkSchema = z.object({
  x: z.number(),
  y: z.number(),
  description: z.string(),
});

export const PhotoWithMarksSchema = z.object({
  id: z.string(),
  url: z.string(),
  marks: z.array(UniqueMarkSchema),
  description: z.string(),
  timestamp: z.number().optional(),
  isAIValidated: z.boolean().optional(),
});

export const SightingSchema = z.object({
  id: z.string(),
  location: GeolocationSchema,
  timestamp: z.number(),
  notes: z.string(),
  photo: PhotoWithMarksSchema.optional(),
});

export const HealthCheckSchema = z.object({
  timestamp: z.number(),
  symptoms: z.string(),
  advice: z.string(),
});

export const AIInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.enum(['health', 'behavior', 'safety']),
  timestamp: z.number(),
});

export const VaccinationSchema = z.object({
  name: z.string(),
  date: z.string(),
});

export const MedicalRecordSchema = z.object({
  allergies: z.string(),
  chronicConditions: z.string(),
  medications: z.string(),
  vaccinations: z.array(VaccinationSchema),
  healthScore: z.number().optional(),
  lastCheckup: z.number().optional(),
  notes: z.string().optional(),
});

export const PetProfileSchema = z.object({
  id: z.string(),
  ownerEmail: z.string().email().nullable(),
  guardianEmails: z.array(z.string().email()).default([]),
  status: z.enum(['owned', 'stray', 'forAdoption']),
  vetEmail: z.string().email().optional(),
  vetLinkStatus: z.enum(['unlinked', 'pending', 'linked']).default('unlinked'),
  isLost: z.boolean().default(false),
  name: z.string(),
  type: z.string().optional().default(''),
  breed: z.string(),
  color: z.string().optional().default(''),
  gender: z.string().optional().default(''),
  size: z.enum(['Small', 'Medium', 'Large']).optional(),
  age: z.string(),
  weight: z.string(),
  behavior: z.string().default(''),
  description: z.string().optional().default(''),
  photos: z.array(PhotoWithMarksSchema).default([]),
  homeLocations: z.array(GeolocationSchema).default([]),
  lastSeenLocation: GeolocationSchema.nullable().default(null),
  searchRadius: z.number().nullable().default(null),
  sightings: z.array(SightingSchema).default([]),
  videoAnalysis: z.string().default(''),
  audioNotes: z.string().default(''),
  healthChecks: z.array(HealthCheckSchema).default([]),
  medicalRecord: MedicalRecordSchema.optional(),
  aiIdentityCode: z.string().optional(),
  aiPhysicalDescription: z.string().optional(),
  aiInsights: z.array(AIInsightSchema).optional().default([]),
});

export const VetClinicSchema = z.object({
  id: z.string().optional(),
  vetEmail: z.string().email(),
  name: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(5),
  location: GeolocationSchema.optional(),
  isVerified: z.boolean().optional(),
});

export const AppointmentSchema = z.object({
  id: z.string(),
  vetEmail: z.string().email(),
  petId: z.string(),
  petName: z.string(),
  date: z.string(),
  time: z.string(),
  notes: z.string(),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  requestedBy: z.enum(['owner', 'vet']),
});

export const ChatMessageSchema = z.object({
  senderEmail: z.string().email(),
  text: z.string().min(1),
  timestamp: z.number(),
});

export const ChatSessionSchema = z.object({
  id: z.string(),
  petId: z.string(),
  petName: z.string(),
  petPhotoUrl: z.string().url(),
  ownerEmail: z.string().email(),
  finderEmail: z.string().email(),
  messages: z.array(ChatMessageSchema),
});

export const DonationSchema = z.object({
  id: z.string(),
  donorName: z.string(),
  realName: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  amount: z.string(),
  numericValue: z.number().optional().default(0),
  message: z.string().default(''),
  timestamp: z.number(),
  avatarUrl: z.string().url().optional().or(z.literal('')).default(''),
  status: z.enum(['pending_payment', 'paid', 'failed']).default('paid'),
  approved: z.boolean().default(true),
  isConfirmed: z.boolean().optional(),
  isPublic: z.boolean().default(true),
  stripeSessionId: z.string().optional(),
});

export const BlogPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  content: z.string(),
  author: z.string(),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()),
  publishedAt: z.number(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  views: z.number(),
  translations: z.record(z.string(), z.object({
    title: z.string(),
    summary: z.string(),
    content: z.string(),
  })).optional(),
});

export const AdminAuditLogSchema = z.object({

  id: z.string(),

  adminEmail: z.string().email(),

  action: z.string(),

  targetId: z.string().optional(),

  details: z.string(),

  timestamp: z.number(),

});



export const SearchConfigSchema = z.object({

  id: z.string(),

  breedMatchWeight: z.number().min(0).max(1),

  locationWeight: z.number().min(0).max(1),

  ageWeight: z.number().min(0).max(1),

  lastUpdated: z.number(),

  isAutoOptimized: z.boolean().default(true),

});



export const OptimizationTrialSchema = z.object({

  id: z.string(),

  params: z.object({

    breedMatchWeight: z.number(),

    locationWeight: z.number(),

    ageWeight: z.number(),

  }),

  score: z.number(),

  status: z.enum(['pending', 'completed', 'failed']),

  timestamp: z.number(),

  metadata: z.record(z.string(), z.unknown()).optional(),

});



export const SavedSearchSchema = z.object({

  id: z.string(),

  userEmail: z.string().email(),

  name: z.string().min(1),

  filters: z.any(),

  timestamp: z.number(),

});





export const ContactMessageSchema = z.object({

  id: z.string().optional(),

  name: z.string().min(2),

  email: z.string().email(),

  subject: z.string().min(3),

  message: z.string().min(10),

  timestamp: z.number().optional(),

});

export interface PromoCode {
  id: string;
  code: string;
  type: 'badge' | 'subscription' | 'points';
  value: string; // e.g., 'EARLY_ACCESS', 'vet_pro', '500'
  maxUses: number;
  currentUses: number;
  expiresAt?: number;
  status: 'active' | 'expired' | 'revoked';
  createdBy: string;
}

export const PromoCodeSchema = z.object({
  id: z.string(),
  code: z.string().min(3),
  type: z.enum(['badge', 'subscription', 'points']),
  value: z.string(),
  maxUses: z.number().min(1),
  currentUses: z.number().default(0),
  expiresAt: z.number().optional(),
  status: z.enum(['active', 'expired', 'revoked']).default('active'),
  createdBy: z.string().email()
});

export interface AIUsageStats {
  id: string; // date YYYY-MM-DD
  userId: string;
  visionIdentification?: number;
  smartSearch?: number;
  healthAssessment?: number;
  blogGeneration?: number;
  totalAIRequests: number;
  lastUsed: number;
  lastProvider?: string;
}

export const AIUsageStatsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  visionIdentification: z.number().optional(),
  smartSearch: z.number().optional(),
  healthAssessment: z.number().optional(),
  blogGeneration: z.number().optional(),
  totalAIRequests: z.number(),
  lastUsed: z.number(),
  lastProvider: z.string().optional()
});

export interface NotificationChannelConfig {
  enabled: boolean;
  target?: string; // Email or Phone
  apiKey?: string; // For WhatsApp/Telegram
  chatId?: string; // For Telegram
}

export interface NotificationConfig {
  email: NotificationChannelConfig;
  whatsapp: NotificationChannelConfig;
  telegram: NotificationChannelConfig;
  events: {
    newUser: boolean;
    vetVerification: boolean;
  };
}

export const NotificationConfigSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    target: z.string().email().optional().or(z.literal(''))
  }),
  whatsapp: z.object({
    enabled: z.boolean(),
    target: z.string().optional(),
    apiKey: z.string().optional()
  }),
  telegram: z.object({
    enabled: z.boolean(),
    apiKey: z.string().optional(), // Bot Token
    chatId: z.string().optional()
  }),
  events: z.object({
    newUser: z.boolean(),
    vetVerification: z.boolean()
  })
});

export type AIProvider = 'google' | 'openrouter';
export type AIModelTask = 'vision' | 'triage' | 'chat' | 'matching';

export interface AISecrets {
  google?: string;
  openrouter?: string;
}

export interface AISettings {
  provider: AIProvider;
  publicLiveAssistantKey?: string; // Client-side key for Realtime Voice/Video Assistant
  modelMapping: Record<AIModelTask, string>;
  lastUpdated: number;
  updatedBy: string;
  apiKeys?: Record<string, string>;
}

export const AISecretsSchema = z.object({
  google: z.string().optional(),
  openrouter: z.string().optional()
});

export const AISettingsSchema = z.object({
  provider: z.enum(['google', 'openrouter']),
  publicLiveAssistantKey: z.string().optional(),
  modelMapping: z.object({
    vision: z.string(),
    triage: z.string(),
    chat: z.string(),
    matching: z.string()
  }),
  lastUpdated: z.number(),
  updatedBy: z.string().email()
});

// =============================================================================
// SOCIAL MEDIA MANAGEMENT TYPES
// =============================================================================

export type SocialPlatform = 'facebook' | 'twitter' | 'instagram' | 'linkedin';

export interface SocialImage {
  url: string;
  dimensions: { width: number; height: number };
  storageRef?: string; // Firebase Storage reference
}

export interface SocialAnalytics {
  impressions: number;
  clicks: number;
  shares: number;
  reach?: number;
  engagement?: number;
  lastUpdated?: Date;
}

export interface SocialScheduledPost {
  id: string;
  blogPostId: string; // Reference to blog post that triggered this
  platforms: SocialPlatform[];
  scheduledTime: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  captions: Partial<Record<SocialPlatform, string>>;
  images: Partial<Record<SocialPlatform, SocialImage>>;
  analytics?: Partial<Record<SocialPlatform, SocialAnalytics>>;
  createdBy: string; // userId
  createdAt: Date;
  updatedAt?: Date;
  publishedAt?: Date;
  errorMessage?: string; // If status is 'failed'
}

export interface SocialPlatformCredential {
  id: string;
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  accessToken: string; // Will be encrypted in Firestore
  refreshToken?: string;
  expiresAt: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  lastUsed?: Date;
}

export interface SocialPostTemplate {
  id: string;
  name: string;
  type: 'quote' | 'announcement' | 'statistic' | 'story' | 'custom';
  description: string;
  captionTemplate: string; // Template with {{variables}}
  imageTemplate?: string; // Reference to Remotion composition
  platforms: SocialPlatform[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}

// Zod Schemas for validation
export const SocialImageSchema = z.object({
  url: z.string().url(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive()
  }),
  storageRef: z.string().optional()
});

export const SocialAnalyticsSchema = z.object({
  impressions: z.number().nonnegative(),
  clicks: z.number().nonnegative(),
  shares: z.number().nonnegative(),
  reach: z.number().nonnegative().optional(),
  engagement: z.number().nonnegative().optional(),
  lastUpdated: z.date().optional()
});

export const SocialScheduledPostSchema = z.object({
  id: z.string(),
  blogPostId: z.string(),
  platforms: z.array(z.enum(['facebook', 'twitter', 'instagram', 'linkedin'])),
  scheduledTime: z.date(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']),
  captions: z.record(z.enum(['facebook', 'twitter', 'instagram', 'linkedin']), z.string()).optional(),
  images: z.record(z.enum(['facebook', 'twitter', 'instagram', 'linkedin']), SocialImageSchema).optional(),
  analytics: z.record(z.enum(['facebook', 'twitter', 'instagram', 'linkedin']), SocialAnalyticsSchema).optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  publishedAt: z.date().optional(),
  errorMessage: z.string().optional()
});

export const SocialPlatformCredentialSchema = z.object({
  id: z.string(),
  platform: z.enum(['facebook', 'twitter', 'instagram', 'linkedin']),
  accountId: z.string(),
  accountName: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.date(),
  isActive: z.boolean(),
  createdBy: z.string(),
  createdAt: z.date(),
  lastUsed: z.date().optional()
});

// ====== KARMA & RIDER SYSTEM TYPES ======

export type RiderType = 'bicycle' | 'ebike' | 'monowheel' | 'scooter' | 'motorcycle' | 'food_delivery' | 'walking';

export type KarmaAction =
  | 'sighting_report'
  | 'verified_sighting'
  | 'search_patrol'
  | 'patrol_time'
  | 'successful_reunion'
  | 'mission_complete'
  | 'daily_check_in'
  | 'referral'
  | 'waiting_mode_scan'
  | 'photo_verification'
  | 'community_alert'
  | 'first_sighting_bonus'
  | 'streak_bonus'
  | 'donation_bonus';

export type KarmaTier = 'scout' | 'tracker' | 'ranger' | 'guardian' | 'legend';

export type MissionType = 'patrol_zone' | 'sighting_verify' | 'search_party' | 'delivery_scan' | 'area_sweep';
export type MissionStatus = 'open' | 'accepted' | 'in_progress' | 'completed' | 'expired' | 'failed';
export type MissionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface KarmaTransaction {
  id: string;
  userId: string;
  action: KarmaAction;
  points: number;
  multiplier: number;
  metadata?: {
    petId?: string;
    missionId?: string;
    patrolSessionId?: string;
    distance?: number;
    duration?: number;
  };
  timestamp: number;
}

export interface KarmaBalance {
  userId: string;
  totalEarned: number;
  totalRedeemed: number;
  currentBalance: number;
  currentTier: KarmaTier;
  streakDays: number;
  lastActiveDate: string;
  riderType?: RiderType;
  riderBonusMultiplier: number;
  monthlyStats: {
    sightings: number;
    patrolKm: number;
    patrolMinutes: number;
    missionsCompleted: number;
    reunions: number;
  };
}

export interface RiderProfile {
  userId: string;
  riderType: RiderType;
  vehicleName?: string;
  deliveryPlatform?: string;
  coverageAreaCenter?: Geolocation;
  coverageRadiusKm: number;
  isOnDuty: boolean;
  lastKnownLocation?: Geolocation;
  totalPatrolKm: number;
  totalPatrolMinutes: number;
  registeredAt: number;
}

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  petId?: string;
  petName?: string;
  petPhotoUrl?: string;
  zoneCenter: Geolocation;
  zoneRadiusKm: number;
  priority: MissionPriority;
  karmaReward: number;
  bonusReward?: number;
  status: MissionStatus;
  createdAt: number;
  expiresAt?: number;
  acceptedBy?: string;
  acceptedAt?: number;
  completedAt?: number;
  maxParticipants: number;
  currentParticipants: string[];
  requiredRiderTypes?: RiderType[];
  completionCriteria?: {
    photosRequired?: number;
    minPatrolKm?: number;
    minPatrolMinutes?: number;
    verificationRequired?: boolean;
  };
}

export interface PatrolSession {
  id: string;
  userId: string;
  missionId?: string;
  startTime: number;
  endTime?: number;
  durationMinutes: number;
  distanceKm: number;
  route: Geolocation[];
  sightingsReported: number;
  karmaEarned: number;
  riderType: RiderType;
}

export interface PartnerStore {
  id: string;
  name: string;
  type: 'vet_clinic' | 'pet_shop' | 'pet_food' | 'grooming' | 'accessories' | 'cafe';
  address: string;
  location: Geolocation;
  karmaDiscountPercent: number;
  karmaPointsAccepted: number;
  rewardDescription: string;
  isActive: boolean;
  logoUrl?: string;
  website?: string;
  partnerSince: number;
}

export interface KarmaRedemption {
  id: string;
  userId: string;
  partnerId: string;
  partnerName: string;
  pointsRedeemed: number;
  rewardDescription: string;
  status: 'pending' | 'confirmed' | 'used' | 'expired';
  redemptionCode: string;
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
}

export interface KarmaAdminStats {
  totalKarmaAwarded: number;
  activeRiders: number;
  totalPatrolKm: number;
  tierDistribution: Record<KarmaTier, number>;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarInitial: string;
  totalKarma: number;
  tier: KarmaTier;
  riderType?: RiderType;
  sightingsCount: number;
  reunionsCount: number;
  patrolKm: number;
  rank: number;
}

// Karma Zod Schemas
export const KarmaTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.string(),
  points: z.number(),
  multiplier: z.number().default(1),
  metadata: z.object({
    petId: z.string().optional(),
    missionId: z.string().optional(),
    patrolSessionId: z.string().optional(),
    distance: z.number().optional(),
    duration: z.number().optional(),
  }).optional(),
  timestamp: z.number(),
});

export const PatrolSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  missionId: z.string().optional(),
  startTime: z.number(),
  endTime: z.number().optional(),
  durationMinutes: z.number().default(0),
  distanceKm: z.number().default(0),
  route: z.array(GeolocationSchema).default([]),
  sightingsReported: z.number().default(0),
  karmaEarned: z.number().default(0),
  riderType: z.string().default('walking'),
});

// Coupon / Promo Code System
export interface PromoCode {
  id: string;
  code: string;
  type: 'badge' | 'subscription' | 'points';
  value: string; // badge name, plan ID, or point amount
  description: string;
  maxUses: number; // 0 = unlimited
  currentUses: number;
  status: 'active' | 'revoked' | 'expired';
  expiresAt?: number; // unix ms, optional
  createdAt: number;
  createdBy: string;
}

export const MissionSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  petId: z.string().optional(),
  petName: z.string().optional(),
  petPhotoUrl: z.string().optional(),
  zoneCenter: GeolocationSchema,
  zoneRadiusKm: z.number(),
  priority: z.string().default('medium'),
  karmaReward: z.number(),
  bonusReward: z.number().optional(),
  status: z.string().default('open'),
  createdAt: z.number(),
  expiresAt: z.number().optional(),
  acceptedBy: z.string().optional(),
  acceptedAt: z.number().optional(),
  completedAt: z.number().optional(),
  maxParticipants: z.number().default(1),
  currentParticipants: z.array(z.string()).default([]),
});
