
import { Donation } from '../types';
import { dbService } from './firebase';

export const recordInteractionAsDonation = async (tierId: string, amount: string, donorName: string = 'Anonymous') => {
    const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    
    const donation: Donation = {
        id: Date.now().toString(),
        donorName,
        amount, // Stored as string for display "€50.00"
        message: "Contribution via Stripe Interaction",
        timestamp: Date.now(),
        // Hidden field for calculation
        numericValue: numericAmount,
        status: 'paid',
        approved: true,
        isPublic: true
    };

    await dbService.recordDonation(donation);
    return donation;
};

// Original async fetch (kept for real usage)
export const calculateTotalDonations = async (): Promise<string> => {
    const donations = await dbService.getDonations();
    return calculateTotalFromList(donations);
};

// New synchronous helper
export const calculateTotalFromList = (donations: Donation[]): string => {
    let total = 0;
    donations.forEach((d: Donation) => {
        // Try to parse if numericValue is missing (legacy data)
        const val = d.numericValue || parseFloat(d.amount.replace(/[^0-9.]/g, '')) || 0;
        total += val;
    });
    
    return new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR' }).format(total);
};