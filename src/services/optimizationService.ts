import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  setDoc, 
  getDoc,
  where
} from 'firebase/firestore';
import { OptimizationTrial, SearchConfig } from '../types';

class OptimizationService {
  private static instance: OptimizationService;
  private trialsCollection = collection(db, 'optimization_trials');
  private configCollection = collection(db, 'search_config');
  private DEFAULT_CONFIG_ID = 'global_search_config';

  private constructor() {}

  public static getInstance(): OptimizationService {
    if (!OptimizationService.instance) {
      OptimizationService.instance = new OptimizationService();
    }
    return OptimizationService.instance;
  }

  /**
   * Samples new parameters using a simplified TPE-like approach.
   * If there are enough trials, it explores around the best one.
   * Otherwise, it returns random values.
   */
  public async sampleParameters(): Promise<OptimizationTrial['params']> {
    const trials = await this.getCompletedTrials();
    
    const clamp = (val: number) => Number(Math.max(0, Math.min(1, val)).toFixed(2));

    if (trials.length < 5) {
      // Warm-up phase: random sampling
      return {
        breedMatchWeight: Number(Math.random().toFixed(2)),
        locationWeight: Number(Math.random().toFixed(2)),
        ageWeight: Number(Math.random().toFixed(2))
      };
    }

    // Sort by score (descending)
    const bestTrial = trials.sort((a, b) => b.score - a.score)[0];
    
    // Add some noise to the best parameters (exploration)
    const noise = () => (Math.random() - 0.5) * 0.2;
    
    return {
      breedMatchWeight: clamp(bestTrial.params.breedMatchWeight + noise()),
      locationWeight: clamp(bestTrial.params.locationWeight + noise()),
      ageWeight: clamp(bestTrial.params.ageWeight + noise())
    };
  }

  public async createTrial(params: OptimizationTrial['params']): Promise<string> {
    const trialData = {
      params,
      score: 0,
      status: 'pending',
      timestamp: Date.now()
    };
    const docRef = await addDoc(this.trialsCollection, trialData);
    return docRef.id;
  }

  public async completeTrial(trialId: string, score: number): Promise<void> {
    const trialRef = doc(this.trialsCollection, trialId);
    await updateDoc(trialRef, {
      score,
      status: 'completed'
    });
    
    // Check if this new trial improves our global config
    await this.updateGlobalConfigIfBest();
  }

  private async updateGlobalConfigIfBest(): Promise<void> {
    const trials = await this.getCompletedTrials();
    if (trials.length === 0) return;

    const bestTrial = trials.sort((a, b) => b.score - a.score)[0];
    
    await this.setSearchConfig({
        breedMatchWeight: bestTrial.params.breedMatchWeight,
        locationWeight: bestTrial.params.locationWeight,
        ageWeight: bestTrial.params.ageWeight,
        isAutoOptimized: true
    });
  }

  public async getSearchConfig(): Promise<SearchConfig | null> {
    const configRef = doc(this.configCollection, this.DEFAULT_CONFIG_ID);
    try {
        const configSnap = await getDoc(configRef);
        if (configSnap && typeof configSnap.exists === 'function' && configSnap.exists()) {
          return { id: configSnap.id, ...configSnap.data() } as SearchConfig;
        }
    } catch (e) {
        console.error("Error fetching search config:", e);
    }
    return null;
  }

  public async setSearchConfig(params: Partial<SearchConfig>): Promise<void> {
    const configRef = doc(this.configCollection, this.DEFAULT_CONFIG_ID);
    await setDoc(configRef, {
      ...params,
      lastUpdated: Date.now()
    }, { merge: true });
  }

  public async getAllTrials(max = 100): Promise<OptimizationTrial[]> {
    const q = query(this.trialsCollection, orderBy('timestamp', 'desc'), limit(max));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OptimizationTrial));
  }

  /**
   * Records a user interaction with a search result.
   * This is used to calculate the reward for the current search configuration.
   */
  public async recordSearchInteraction(petId: string, type: 'view' | 'click' | 'inquiry'): Promise<void> {
    const config = await this.getSearchConfig();
    if (!config) return;

    // Log the interaction with the current configuration ID
    const interactionCollection = collection(db, 'search_interactions');
    await addDoc(interactionCollection, {
        petId,
        type,
        configId: config.id,
        weights: {
            breedMatchWeight: config.breedMatchWeight,
            locationWeight: config.locationWeight,
            ageWeight: config.ageWeight
        },
        timestamp: Date.now()
    });
  }

  /**
   * Finalizes a trial by calculating a score based on interactions.
   * In a real system, this might be triggered periodically by a Cloud Function.
   */
  public async evaluateCurrentConfig(): Promise<void> {
    const config = await this.getSearchConfig();
    if (!config) return;

    const interactionsQ = query(
        collection(db, 'search_interactions'),
        where('configId', '==', config.id),
        limit(1000)
    );
    const snap = await getDocs(interactionsQ);
    const interactions = snap.docs.map(d => d.data());

    if (interactions.length === 0) return;

    // Simple scoring: inquiry = 10 points, click = 2 points, view = 1 point
    const score = interactions.reduce((acc, curr) => {
        if (curr.type === 'inquiry') return acc + 10;
        if (curr.type === 'click') return acc + 2;
        return acc + 1;
    }, 0) / interactions.length;

    // Create a new trial based on this configuration's performance
    const trialId = await this.createTrial({
        breedMatchWeight: config.breedMatchWeight,
        locationWeight: config.locationWeight,
        ageWeight: config.ageWeight
    });
    await this.completeTrial(trialId, score);
  }

  private async getCompletedTrials(): Promise<OptimizationTrial[]> {
    const q = query(this.trialsCollection, orderBy('timestamp', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as OptimizationTrial))
      .filter(t => t.status === 'completed');
  }
}

export const optimizationService = OptimizationService.getInstance();
