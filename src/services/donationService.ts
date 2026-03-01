
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
        // Always start as pending — only the Stripe webhook trigger marks it paid
        status: 'pending_payment',
        approved: false,
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

// New synchronous helper — only counts confirmed, approved donations
export const calculateTotalFromList = (donations: Donation[]): string => {
    let total = 0;
    donations
        .filter((d: Donation) => d.status === 'paid' && d.approved === true)
        .forEach((d: Donation) => {
            // Try to parse if numericValue is missing (legacy data)
            const val = d.numericValue || parseFloat(d.amount.replace(/[^0-9.]/g, '')) || 0;
            total += val;
        });

    return new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR' }).format(total);
};