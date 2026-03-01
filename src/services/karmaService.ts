import { db, auth } from './firebase';
import { collection, addDoc, doc, getDoc, getDocs, setDoc, query, where, orderBy, limit as firestoreLimit, updateDoc, increment } from 'firebase/firestore';
import { KarmaAction, KarmaTransaction, KarmaBalance, KarmaTier, RiderType, KarmaRedemption, LeaderboardEntry, PartnerStore, PatrolSession } from '../types';

class KarmaService {
  private static instance: KarmaService;

  private readonly KARMA_VALUES: Record<KarmaAction, number> = {
    sighting_report: 50,
    verified_sighting: 150,
    search_patrol: 10,        // per km
    patrol_time: 5,           // per 15 min
    successful_reunion: 500,
    mission_complete: 0,      // varies by mission
    daily_check_in: 10,
    referral: 100,
    waiting_mode_scan: 25,
    photo_verification: 30,
    community_alert: 20,
    first_sighting_bonus: 200,
    streak_bonus: 0,          // calculated dynamically
    donation_bonus: 50,
  };

  private readonly RIDER_MULTIPLIERS: Record<RiderType, number> = {
    bicycle: 1.2,
    ebike: 1.1,
    monowheel: 1.3,
    scooter: 1.1,
    motorcycle: 1.0,
    food_delivery: 1.5,
    walking: 1.0,
  };

  private readonly TIER_THRESHOLDS: [KarmaTier, number][] = [
    ['legend', 15000],
    ['guardian', 5000],
    ['ranger', 2000],
    ['tracker', 500],
    ['scout', 0],
  ];

  private constructor() {}

  public static getInstance(): KarmaService {
    if (!KarmaService.instance) {
      KarmaService.instance = new KarmaService();
    }
    return KarmaService.instance;
  }

  /** Award karma points to a user */
  async awardKarma(
    userId: string,
    action: KarmaAction,
    metadata?: KarmaTransaction['metadata']
  ): Promise<KarmaTransaction> {
    let basePoints = this.KARMA_VALUES[action];

    // For distance-based actions, multiply by distance
    if (action === 'search_patrol' && metadata?.distance) {
      basePoints = Math.round(basePoints * metadata.distance);
    }
    // For time-based actions, multiply by duration (in 15-min blocks)
    if (action === 'patrol_time' && metadata?.duration) {
      basePoints = Math.round(basePoints * (metadata.duration / 15));
    }

    // Get rider multiplier
    const balance = await this.getBalance(userId);
    const riderMultiplier = balance.riderType
      ? this.RIDER_MULTIPLIERS[balance.riderType]
      : 1.0;

    // Streak multiplier
    const streakMultiplier = this.calculateStreakMultiplier(balance.streakDays);
    const totalMultiplier = riderMultiplier * streakMultiplier;
    const finalPoints = Math.round(basePoints * totalMultiplier);

    // Create transaction
    const tx: Omit<KarmaTransaction, 'id'> = {
      userId,
      action,
      points: finalPoints,
      multiplier: totalMultiplier,
      metadata,
      timestamp: Date.now(),
    };

    const docRef = await addDoc(collection(db, 'karma_transactions'), tx);

    // Update balance
    await this.updateBalance(userId, finalPoints);

    // Update streak
    await this.updateStreak(userId);

    return { ...tx, id: docRef.id };
  }

  /** Get user's karma balance */
  async getBalance(userId: string): Promise<KarmaBalance> {
    const docRef = doc(db, 'karma_balances', userId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as KarmaBalance;
    }

    // Create default balance
    const defaultBalance: KarmaBalance = {
      userId,
      totalEarned: 0,
      totalRedeemed: 0,
      currentBalance: 0,
      currentTier: 'scout',
      streakDays: 0,
      lastActiveDate: '',
      riderBonusMultiplier: 1.0,
      monthlyStats: {
        sightings: 0,
        patrolKm: 0,
        patrolMinutes: 0,
        missionsCompleted: 0,
        reunions: 0,
      },
    };

    await setDoc(docRef, defaultBalance);
    return defaultBalance;
  }

  /** Update balance after karma award */
  private async updateBalance(userId: string, points: number): Promise<void> {
    const docRef = doc(db, 'karma_balances', userId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const current = snap.data() as KarmaBalance;
      const newTotal = current.totalEarned + points;
      await updateDoc(docRef, {
        totalEarned: increment(points),
        currentBalance: increment(points),
        currentTier: this.calculateTier(newTotal),
      });
    } else {
      await setDoc(docRef, {
        userId,
        totalEarned: points,
        totalRedeemed: 0,
        currentBalance: points,
        currentTier: this.calculateTier(points),
        streakDays: 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
        riderBonusMultiplier: 1.0,
        monthlyStats: { sightings: 0, patrolKm: 0, patrolMinutes: 0, missionsCompleted: 0, reunions: 0 },
      });
    }
  }

  /** Update daily streak */
  private async updateStreak(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'karma_balances', userId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return;
    const data = snap.data() as KarmaBalance;

    if (data.lastActiveDate === today) return; // Already active today

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = data.lastActiveDate === yesterday ? data.streakDays + 1 : 1;

    await updateDoc(docRef, {
      streakDays: newStreak,
      lastActiveDate: today,
    });
  }

  /** Get transaction history */
  async getTransactionHistory(userId: string, maxResults: number = 50): Promise<KarmaTransaction[]> {
    const q = query(
      collection(db, 'karma_transactions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(maxResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as KarmaTransaction));
  }

  /** Redeem karma at a partner store */
  async redeemKarma(userId: string, partnerId: string, points: number): Promise<KarmaRedemption> {
    const balance = await this.getBalance(userId);
    if (balance.currentBalance < points) {
      throw new Error('Insufficient karma points');
    }

    // Get partner info
    const partnerSnap = await getDoc(doc(db, 'partner_stores', partnerId));
    if (!partnerSnap.exists()) throw new Error('Partner store not found');
    const partner = partnerSnap.data() as PartnerStore;

    if (points < partner.karmaPointsAccepted) {
      throw new Error(`Minimum ${partner.karmaPointsAccepted} points required`);
    }

    // Generate redemption code
    const code = `PF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const redemption: Omit<KarmaRedemption, 'id'> = {
      userId,
      partnerId,
      partnerName: partner.name,
      pointsRedeemed: points,
      rewardDescription: partner.rewardDescription,
      status: 'pending',
      redemptionCode: code,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    const docRef = await addDoc(collection(db, 'karma_redemptions'), redemption);

    // Deduct from balance
    await updateDoc(doc(db, 'karma_balances', userId), {
      currentBalance: increment(-points),
      totalRedeemed: increment(points),
    });

    return { ...redemption, id: docRef.id };
  }

  /** Get leaderboard */
  async getLeaderboard(
    timeframe: 'weekly' | 'monthly' | 'allTime',
    maxResults: number = 20
  ): Promise<LeaderboardEntry[]> {
    const q = query(
      collection(db, 'karma_balances'),
      orderBy('totalEarned', 'desc'),
      firestoreLimit(maxResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d, index) => {
      const data = d.data() as KarmaBalance;
      return {
        userId: data.userId,
        displayName: data.userId.substring(0, 8),
        avatarInitial: (data.userId.charAt(0) || 'U').toUpperCase(),
        totalKarma: data.totalEarned,
        tier: data.currentTier,
        riderType: data.riderType,
        sightingsCount: data.monthlyStats.sightings,
        reunionsCount: data.monthlyStats.reunions,
        patrolKm: data.monthlyStats.patrolKm,
        rank: index + 1,
      };
    });
  }

  /** Get partner stores */
  async getPartnerStores(): Promise<PartnerStore[]> {
    const q = query(collection(db, 'partner_stores'), where('isActive', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerStore));
  }

  /** Set rider profile */
  async setRiderType(userId: string, riderType: RiderType, vehicleName?: string, deliveryPlatform?: string): Promise<void> {
    const docRef = doc(db, 'karma_balances', userId);
    await updateDoc(docRef, {
      riderType,
      riderBonusMultiplier: this.RIDER_MULTIPLIERS[riderType],
    });

    // Also save rider profile
    await setDoc(doc(db, 'rider_profiles', userId), {
      userId,
      riderType,
      vehicleName: vehicleName || '',
      deliveryPlatform: deliveryPlatform || '',
      coverageRadiusKm: 10,
      isOnDuty: false,
      totalPatrolKm: 0,
      totalPatrolMinutes: 0,
      registeredAt: Date.now(),
    }, { merge: true });
  }

  /** Save patrol session */
  async savePatrolSession(session: Omit<PatrolSession, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'patrol_sessions'), session);

    // Update rider profile totals
    const profileRef = doc(db, 'rider_profiles', session.userId);
    await updateDoc(profileRef, {
      totalPatrolKm: increment(session.distanceKm),
      totalPatrolMinutes: increment(session.durationMinutes),
    }).catch(() => {
      // Profile may not exist yet, create it
      setDoc(profileRef, {
        userId: session.userId,
        riderType: session.riderType,
        totalPatrolKm: session.distanceKm,
        totalPatrolMinutes: session.durationMinutes,
        registeredAt: Date.now(),
        isOnDuty: false,
        coverageRadiusKm: 10,
      }, { merge: true });
    });

    return docRef.id;
  }

  /** Calculate tier from total karma */
  calculateTier(totalKarma: number): KarmaTier {
    for (const [tier, threshold] of this.TIER_THRESHOLDS) {
      if (totalKarma >= threshold) return tier;
    }
    return 'scout';
  }

  /** Calculate streak multiplier (max 2x at 30-day streak) */
  calculateStreakMultiplier(streakDays: number): number {
    if (streakDays <= 1) return 1.0;
    return Math.min(2.0, 1.0 + (streakDays * 0.033));
  }

  /** Get rider multiplier for a given rider type */
  getRiderMultiplier(riderType: RiderType): number {
    return this.RIDER_MULTIPLIERS[riderType] || 1.0;
  }

  /** Get karma values reference */
  getKarmaValues(): Record<KarmaAction, number> {
    return { ...this.KARMA_VALUES };
  }

  /** Get tier thresholds reference */
  getTierThresholds(): Record<KarmaTier, number> {
    return Object.fromEntries(this.TIER_THRESHOLDS.map(([tier, threshold]) => [tier, threshold])) as Record<KarmaTier, number>;
  }
}

export const karmaService = KarmaService.getInstance();
