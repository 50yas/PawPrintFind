export type UserRole = 'owner' | 'vet' | 'shelter' | 'volunteer' | 'super_admin';

export type View = 'home' | 'register' | 'find' | 'dashboard' | 'editPet' |
  'vetDashboard' | 'myClinic' | 'myPatients' | 'patientDetail' |
  'smartCalendar' | 'findVet' | 'linkVet' | 'community' |
  'shelterDashboard' | 'adoptionCenter' | 'registerForAdoption' |
  'donors' | 'adminDashboard' | 'pressKit' | 'volunteerDashboard' |
  'blog' | 'blogPost' | 'paymentSuccess';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string; // e.g. 'VERIFY_USER', 'DELETE_PET'
  targetId: string; // uid of user or id of pet
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