import { z } from 'zod';

export type UserRole = 'owner' | 'vet' | 'shelter' | 'volunteer' | 'super_admin';

export type View = 'home' | 'register' | 'find' | 'dashboard' | 'editPet' |
  'vetDashboard' | 'myClinic' | 'myPatients' | 'patientDetail' |
  'smartCalendar' | 'findVet' | 'linkVet' | 'community' |
  'shelterDashboard' | 'adoptionCenter' | 'registerForAdoption' |
  'donors' | 'adminDashboard' | 'pressKit' | 'volunteerDashboard' |
  'blog' | 'blogPost' | 'blogDetail' | 'paymentSuccess';

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
}

export interface User {
  uid: string;
  email: string;
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

export interface Vaccination {
  name: string;
  date: string;
}

export interface MedicalRecord {
  allergies: string;
  chronicConditions: string;
  medications: string;
  vaccinations: Vaccination[];
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
  breed: string;
  color?: string;
  size?: 'Small' | 'Medium' | 'Large';
  age: string;
  weight: string;
  behavior: string;
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
  roles: z.array(UserRoleSchema),
  activeRole: UserRoleSchema,
  friends: z.array(z.string()),
  friendRequests: z.array(z.object({
    from: z.string(),
    timestamp: z.number(),
  })),
  points: z.number(),
  badges: z.array(z.string()),
  isVerified: z.boolean().optional(),
  verificationData: z.object({
    docUrl: z.string().url(),
    timestamp: z.number(),
  }).optional(),
  joinedAt: z.number().optional(),
  lastLoginAt: z.number().optional(),
  createdAt: z.number().optional(),
  status: z.enum(['active', 'suspended', 'banned']).optional(),
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

export const VaccinationSchema = z.object({
  name: z.string(),
  date: z.string(),
});

export const MedicalRecordSchema = z.object({
  allergies: z.string(),
  chronicConditions: z.string(),
  medications: z.string(),
  vaccinations: z.array(VaccinationSchema),
});

export const PetProfileSchema = z.object({
  id: z.string(),
  ownerEmail: z.string().email().nullable(),
  guardianEmails: z.array(z.string().email()),
  status: z.enum(['owned', 'stray', 'forAdoption']),
  vetEmail: z.string().email().optional(),
  vetLinkStatus: z.enum(['unlinked', 'pending', 'linked']),
  isLost: z.boolean(),
  name: z.string(),
  breed: z.string(),
  color: z.string().optional(),
  size: z.enum(['Small', 'Medium', 'Large']).optional(),
  age: z.string(),
  weight: z.string(),
  behavior: z.string(),
  photos: z.array(PhotoWithMarksSchema),
  homeLocations: z.array(GeolocationSchema),
  lastSeenLocation: GeolocationSchema.nullable(),
  searchRadius: z.number().nullable(),
  sightings: z.array(SightingSchema),
  videoAnalysis: z.string(),
  audioNotes: z.string(),
  healthChecks: z.array(HealthCheckSchema),
  medicalRecord: MedicalRecordSchema.optional(),
  aiIdentityCode: z.string().optional(),
  aiPhysicalDescription: z.string().optional(),
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
});

export const AdminAuditLogSchema = z.object({
  id: z.string(),
  adminEmail: z.string().email(),
  action: z.string(),
  targetId: z.string().optional(),
  details: z.string(),
  timestamp: z.number(),
});