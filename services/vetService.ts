
import {
    collection, getDocs, setDoc, doc, deleteDoc, addDoc, query, where, orderBy, getDoc, onSnapshot, or
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './firebase';
import {
    VetClinic, Appointment, VetClinicSchema, AppointmentSchema,
    VetVerificationRequest, VetVerificationRequestSchema, User
} from '../types';
import { logger } from './loggerService';
import { validationService } from './validationService';
import { notificationService } from './notificationService';
import { sanitizationPipeline } from './sanitizationPipeline';

export const vetService = {
    async getVetClinics(): Promise<VetClinic[]> {
        try {
            const snap = await getDocs(collection(db, 'vet_clinics'));
            return snap.docs.map(d => {
                const data = { ...d.data(), id: d.id };
                return validationService.validate(VetClinicSchema, data, `getVetClinics:${d.id}`);
            });
        } catch (error) {
            logger.error('Error fetching vet clinics:', error);
            throw error;
        }
    },

    async saveClinic(clinic: VetClinic): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to save clinic.");
            }
            const id = clinic.id || `clinic_${Date.now()}`;
            const clinicWithId = { ...clinic, id };

            // SECURITY: Sanitize → Validate → Store pipeline
            const sanitized = sanitizationPipeline.vetClinic(clinicWithId);
            validationService.validate(VetClinicSchema, sanitized, 'saveClinic');
            await setDoc(doc(db, 'vet_clinics', id), sanitized, { merge: true });
        } catch (error) {
            logger.error('Error saving vet clinic:', error);
            throw error;
        }
    },

    async deleteClinic(id: string): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to delete clinic.");
            }
            await deleteDoc(doc(db, 'vet_clinics', id));
        } catch (error) {
            logger.error('Error deleting vet clinic:', error);
            throw error;
        }
    },

    subscribeToClinics(callback: (clinics: VetClinic[]) => void, onError?: (error: any) => void) {
        return onSnapshot(collection(db, 'vet_clinics'),
            (s) => callback(s.docs.map(d => d.data() as VetClinic)),
            (error) => { if (onError) onError(error); else console.error("Clinics subscription error:", error); }
        );
    },

    async getAppointments(): Promise<Appointment[]> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to fetch appointments.");
            }
            const snap = await getDocs(collection(db, 'appointments'));
            return snap.docs.map(d => {
                const data = { ...d.data(), id: d.id };
                return validationService.validate(AppointmentSchema, data, `getAppointments:${d.id}`);
            });
        } catch (error) {
            logger.error('Error fetching appointments:', error);
            throw error;
        }
    },

    async saveAppointment(app: Appointment): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to save appointment.");
            }
            const id = app.id || `app_${Date.now()}`;
            const appWithId = { ...app, id };
            validationService.validate(AppointmentSchema, appWithId, 'saveAppointment');
            await setDoc(doc(db, 'appointments', id), appWithId, { merge: true });
        } catch (error) {
            logger.error('Error saving appointment:', error);
            throw error;
        }
    },

    async deleteAppointment(id: string): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new Error("Authentication required to delete appointment.");
            }
            await deleteDoc(doc(db, 'appointments', id));
        } catch (error) {
            logger.error('Error deleting appointment:', error);
            throw error;
        }
    },

    subscribeToAppointments(email: string, callback: (appts: Appointment[]) => void) {
        const q = query(collection(db, 'appointments'), or(where('vetEmail', '==', email), where('ownerEmail', '==', email)));
        return onSnapshot(q, (s) => callback(s.docs.map(d => d.data() as Appointment)));
    },

    // --- VET VERIFICATION & PRO SUBSCRIPTION ---
    async submitVetVerification(request: Omit<VetVerificationRequest, 'id'>): Promise<string> {
        try {
            const fullRequest = { 
                ...request, 
                submittedAt: Date.now(),
                status: 'pending' as const
            };
            
            validationService.validate(VetVerificationRequestSchema, fullRequest, 'submitVetVerification');
            
            console.log('[submitVetVerification] Sending request to Firestore:', fullRequest);

            const requestsRef = collection(db, 'vet_verification_requests');
            const docRef = await addDoc(requestsRef, fullRequest);

            // Update user to mark documents as submitted
            await setDoc(doc(db, 'users', request.vetUid), {
                vetDocumentsSubmitted: true,
                vetLicenseNumber: request.licenseNumber,
                vetSpecialization: request.specialization
            }, { merge: true });

            logger.info('Vet verification submitted', { vetUid: request.vetUid, requestId: docRef.id });
            
            // Trigger Admin Notification
            await notificationService.sendNotification('vetVerification', { 
                email: request.vetEmail, 
                clinicName: request.clinicName, 
                licenseNumber: request.licenseNumber 
            });

            return docRef.id;
        } catch (error: any) {
            logger.error('Submit vet verification failed', error);
            throw new Error('Failed to submit verification request: ' + error.message);
        }
    },

    async uploadVerificationDoc(file: File, vetUid: string): Promise<string> {
        try {
            const fileExtension = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
            const storageRef = ref(storage, `verifications/${vetUid}/${fileName}`);

            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            logger.info('Verification document uploaded', { vetUid, fileName });
            return url;
        } catch (error: any) {
            logger.error('Upload verification doc failed', error);
            throw new Error(`Failed to upload document: ${error.message || 'Permission denied'}`);
        }
    },

    async getVerificationStatus(vetUid: string): Promise<VetVerificationRequest | null> {
        try {
            const requestsRef = collection(db, 'vet_verification_requests');
            const q = query(requestsRef, where('vetUid', '==', vetUid), orderBy('submittedAt', 'desc'));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as VetVerificationRequest;
        } catch (error: any) {
            logger.error('Get verification status failed', error);
            return null;
        }
    },

    async approveVetVerification(requestId: string, grantPro: boolean = false): Promise<void> {
        try {
            const requestRef = doc(db, 'vet_verification_requests', requestId);
            const requestSnap = await getDoc(requestRef);

            if (!requestSnap.exists()) throw new Error('Verification request not found');

            const request = requestSnap.data() as VetVerificationRequest;
            const currentUser = auth.currentUser;

            // Update verification request
            await setDoc(requestRef, {
                status: 'approved',
                reviewedAt: Date.now(),
                reviewedBy: currentUser?.email || 'admin',
                grantedProOnApproval: grantPro
            }, { merge: true });

            // Update user
            const userUpdate: Partial<User> = {
                isVetVerified: true
            };

            if (grantPro) {
                userUpdate.vetTier = 'pro';
                userUpdate.vetProExpiry = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year
                userUpdate.vetMonthlyPatientsLimit = 999999; // Unlimited
            } else {
                userUpdate.vetTier = 'free';
                userUpdate.vetMonthlyPatientsLimit = 5;
            }

            await setDoc(doc(db, 'users', request.vetUid), userUpdate, { merge: true });

            logger.info('Vet verification approved', { vetUid: request.vetUid, grantedPro: grantPro });
        } catch (error: any) {
            logger.error('Approve vet verification failed', error);
            throw new Error('Failed to approve verification');
        }
    },

    async rejectVetVerification(requestId: string, reason: string): Promise<void> {
        try {
            const requestRef = doc(db, 'vet_verification_requests', requestId);
            const currentUser = auth.currentUser;

            await setDoc(requestRef, {
                status: 'rejected',
                reviewedAt: Date.now(),
                reviewedBy: currentUser?.email || 'admin',
                rejectionReason: reason
            }, { merge: true });

            logger.info('Vet verification rejected', { requestId, reason });
        } catch (error: any) {
            logger.error('Reject vet verification failed', error);
            throw new Error('Failed to reject verification');
        }
    },

    async checkPatientLimit(vetUid: string): Promise<{ reached: boolean; current: number; limit: number }> {
        try {
            const userDoc = await getDoc(doc(db, 'users', vetUid));
            if (!userDoc.exists()) throw new Error('User not found');

            const user = userDoc.data() as User;
            const current = user.vetCurrentMonthPatients || 0;
            const limit = user.vetMonthlyPatientsLimit || 5;

            return {
                reached: current >= limit,
                current,
                limit
            };
        } catch (error: any) {
            logger.error('Check patient limit failed', error);
            return { reached: false, current: 0, limit: 5 };
        }
    },

    async createVetProCheckout(vetUid: string, plan: 'monthly' | 'yearly'): Promise<{ url: string }> {
        try {
            const amount = plan === 'monthly' ? 4900 : 49000; // in cents
            logger.info('Vet Pro checkout created', { vetUid, plan, amount });

            return {
                url: `https://checkout.stripe.com/pay/vet_pro_${plan}_${vetUid}`
            };
        } catch (error: any) {
            logger.error('Create vet pro checkout failed', error);
            throw new Error('Failed to create checkout session');
        }
    },

    async getPendingVerifications(): Promise<VetVerificationRequest[]> {
        try {
            const requestsRef = collection(db, 'vet_verification_requests');
            const q = query(requestsRef, where('status', '==', 'pending'), orderBy('submittedAt', 'desc'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VetVerificationRequest));
        } catch (error: any) {
            logger.error('Get pending verifications failed', error);
            return [];
        }
    }
};
