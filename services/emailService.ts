
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { PetProfile, Appointment, UserRole } from '../types';

/**
 * EMAIL SERVICE
 * 
 * Uses the "Trigger Email from Firestore" Firebase Extension.
 * Docs: https://firebase.google.com/products/extensions/firebase-firestore-send-email
 * 
 * This service writes documents to the 'mail' collection.
 * The extension listens to this collection and processes the email sending.
 */

const MAIL_COLLECTION = 'mail';

const PRIMARY_COLOR = '#0d9488';
const ALERT_COLOR = '#ef4444';
const BG_COLOR = '#f8fafc';

const BaseTemplate = (content: string) => `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${BG_COLOR}; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Paw<span style="color: ${PRIMARY_COLOR};">Print</span></h1>
            </div>
            <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
                ${content}
            </div>
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                <p>&copy; ${new Date().getFullYear()} Paw Print Open Source Project.</p>
                <p>Building a safer world for pets with AI.</p>
            </div>
        </div>
    </div>
`;

export const emailService = {
    
    /**
     * Core function to trigger an email via Firestore
     */
    async sendEmail(to: string | string[], subject: string, html: string, text?: string, bcc?: string[]) {
        try {
            await addDoc(collection(db, MAIL_COLLECTION), {
                to: Array.isArray(to) ? to : [to],
                bcc: bcc,
                message: {
                    subject: subject,
                    html: BaseTemplate(html),
                    text: text || html.replace(/<[^>]*>?/gm, '') // Fallback plain text
                },
                createdAt: new Date()
            });
            console.log(`📧 Email trigger created for: ${to}`);
            return { success: true };
        } catch (error) {
            console.error("Failed to queue email in Firestore:", error);
            return { success: false, error };
        }
    },

    async sendWelcomeEmail(userEmail: string, role: UserRole) {
        const isVet = role === 'vet';
        const subject = isVet ? 'Welcome Partner! 🏥' : 'Welcome to Paw Print! 🐾';
        
        const ownerContent = `
            <h2 style="color: ${PRIMARY_COLOR}; margin-top: 0;">Welcome to the Family</h2>
            <p>Thank you for joining <strong>Paw Print</strong>. You've taken the first step in securing your pet's safety using our advanced AI biometric system.</p>
            <h3>Next Steps:</h3>
            <ol>
                <li><strong>Create an Impronta:</strong> Upload photos of your pet to create their digital ID.</li>
                <li><strong>Tag Unique Marks:</strong> Help our AI by identifying scars or patterns.</li>
                <li><strong>Sleep Soundly:</strong> Know that our community is ready to help if the unthinkable happens.</li>
            </ol>
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://pawprint.ai/dashboard" style="background-color: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
            </div>
        `;

        const vetContent = `
            <h2 style="color: ${PRIMARY_COLOR}; margin-top: 0;">Welcome Partner Clinic</h2>
            <p>Thank you for joining the <strong>Paw Print Vet Network</strong>. You are now part of a technology-first approach to pet recovery and care.</p>
            <h3>Capabilities Unlocked:</h3>
            <ul>
                <li><strong>Digital Records:</strong> Manage patient history securely.</li>
                <li><strong>AI Assistant:</strong> Use our Gemini-powered tools for scheduling and triage.</li>
                <li><strong>Community Visibility:</strong> Local pet owners can now find you on our map.</li>
            </ul>
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://pawprint.ai/vetDashboard" style="background-color: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Vet Console</a>
            </div>
        `;

        return this.sendEmail(userEmail, subject, isVet ? vetContent : ownerContent);
    },

    async sendLostPetAlert(pet: PetProfile, recipients: string[]) {
        if (recipients.length === 0) return { success: true }; // No recipients, no error

        const subject = `🚨 URGENT: ${pet.name} is missing nearby!`;
        const html = `
            <div style="border-left: 4px solid ${ALERT_COLOR}; padding-left: 20px;">
                <h1 style="color: ${ALERT_COLOR}; margin-top: 0;">Missing Pet Alert</h1>
                <p>A pet has been reported lost in your area (${pet.lastSeenLocation?.latitude.toFixed(4)}, ${pet.lastSeenLocation?.longitude.toFixed(4)}). Please keep an eye out.</p>
                
                <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 0; border-radius: 12px; margin: 20px 0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <img src="${pet.photos[0]?.url}" alt="${pet.name}" style="width: 100%; height: 200px; object-fit: cover;" />
                    <div style="padding: 20px;">
                        <h2 style="margin:0 0 10px 0; color: #0f172a;">${pet.name}</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 5px 0; color: #64748b;">Breed:</td>
                                <td style="padding: 5px 0; font-weight: bold;">${pet.breed}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; color: #64748b;">Color/Marks:</td>
                                <td style="padding: 5px 0; font-weight: bold;">${pet.color || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; color: #64748b;">Last Seen:</td>
                                <td style="padding: 5px 0; font-weight: bold;">${new Date().toLocaleTimeString()}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <p>If you see this pet, please report it immediately via the Paw Print app. Use the AI Scanner to confirm identity.</p>
                <br/>
                <div style="text-align: center;">
                    <a href="https://pawprint.ai/find" style="background-color: ${ALERT_COLOR}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">I Found This Pet</a>
                </div>
            </div>
        `;
        
        // Use BCC for broadcast to protect privacy
        return this.sendEmail("alerts@pawprint.ai", subject, html, undefined, recipients);
    },

    async sendAppointmentConfirmation(appt: Appointment, ownerEmail: string) {
        const subject = `Appointment Confirmed: ${appt.petName}`;
        const html = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 10px 20px; border-radius: 50px; font-weight: bold;">
                    Confirmed ✅
                </div>
            </div>
            <h2 style="text-align: center; color: #0f172a;">Appointment Details</h2>
            <p style="text-align: center; color: #64748b;">Your appointment has been successfully scheduled.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #64748b;">Pet</td>
                        <td style="padding: 10px 0; font-weight: bold; text-align: right;">${appt.petName}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #64748b;">Date</td>
                        <td style="padding: 10px 0; font-weight: bold; text-align: right;">${appt.date}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #64748b;">Time</td>
                        <td style="padding: 10px 0; font-weight: bold; text-align: right;">${appt.time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #64748b;">Notes</td>
                        <td style="padding: 10px 0; text-align: right;">${appt.notes || 'None'}</td>
                    </tr>
                </table>
            </div>

            <p style="text-align: center;">See you soon!</p>
        `;
        return this.sendEmail(ownerEmail, subject, html);
    },
    
    // Generic send kept for compatibility
    async send(params: Record<string, any>) {
        const to = params.to_email;
        const subject = params.subject || "Paw Print Notification";
        const message = params.message || "";
        
        const html = `
            <h3>${params.to_name ? `Hello ${params.to_name},` : 'Hello,'}</h3>
            <p>${message}</p>
        `;
        
        if (to) {
            return this.sendEmail(to, subject, html);
        }
        return { success: false };
    }
};
