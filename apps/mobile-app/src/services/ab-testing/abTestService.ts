import AsyncStorage from '@react-native-async-storage/async-storage';

interface Experiment {
  id: string;
  name: string;
  variants: string[];
  assignedVariant?: string;
}

class ABTestService {
  private experiments: Map<string, Experiment> = new Map();
  private userId: string | null = null;
  private initialized: boolean = false;

  async initialize(userId: string) {
    this.userId = userId;
    await this.loadExperiments();
    this.initialized = true;
  }

  private async loadExperiments() {
    try {
      const stored = await AsyncStorage.getItem('ab_experiments');
      if (stored) {
        const experiments = JSON.parse(stored) as Experiment[];
        experiments.forEach((exp) => {
          this.experiments.set(exp.id, exp);
        });
      }
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  }

  private async saveExperiments() {
    try {
      const experiments = Array.from(this.experiments.values());
      await AsyncStorage.setItem('ab_experiments', JSON.stringify(experiments));
    } catch (error) {
      console.error('Failed to save experiments:', error);
    }
  }

  // Register an experiment
  registerExperiment(id: string, name: string, variants: string[]) {
    if (!this.experiments.has(id)) {
      this.experiments.set(id, {
        id,
        name,
        variants,
      });
    }
  }

  // Get variant for an experiment
  getVariant(experimentId: string): string | null {
    if (!this.initialized) {
      console.warn('AB Test Service not initialized');
      return null;
    }

    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      console.warn(`Experiment ${experimentId} not found`);
      return null;
    }

    // If already assigned, return the variant
    if (experiment.assignedVariant) {
      return experiment.assignedVariant;
    }

    // Assign a variant based on user ID hash
    const variant = this.assignVariant(experiment);
    experiment.assignedVariant = variant;

    this.saveExperiments();

    // Track the assignment
    console.log(
      `[AB Test] User assigned to variant "${variant}" for experiment "${experiment.name}"`
    );

    return variant;
  }

  private assignVariant(experiment: Experiment): string {
    if (!this.userId) {
      // Random assignment if no user ID
      return experiment.variants[Math.floor(Math.random() * experiment.variants.length)];
    }

    // Consistent assignment based on user ID
    const hash = this.hashString(this.userId + experiment.id);
    const index = hash % experiment.variants.length;
    return experiment.variants[index];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Check if user is in a specific variant
  isVariant(experimentId: string, variantName: string): boolean {
    const variant = this.getVariant(experimentId);
    return variant === variantName;
  }

  // Force a variant (for testing)
  forceVariant(experimentId: string, variantName: string) {
    const experiment = this.experiments.get(experimentId);
    if (experiment && experiment.variants.includes(variantName)) {
      experiment.assignedVariant = variantName;
      this.saveExperiments();
    }
  }

  // Track conversion
  trackConversion(experimentId: string, eventName: string, value?: number) {
    const variant = this.getVariant(experimentId);
    if (variant) {
      console.log(`[AB Test] Conversion tracked:`, {
        experiment: experimentId,
        variant,
        event: eventName,
        value,
      });

      // Here you would send this data to your analytics service
    }
  }
}

// Example experiments
export const EXPERIMENTS = {
  SCAN_BUTTON_COLOR: 'scan_button_color',
  VALIDATION_FLOW: 'validation_flow',
  FEEDBACK_TIMING: 'feedback_timing',
};

export const abTestService = new ABTestService();

// Register experiments
abTestService.registerExperiment(EXPERIMENTS.SCAN_BUTTON_COLOR, 'Scan Button Color', [
  'blue',
  'green',
  'purple',
]);

abTestService.registerExperiment(EXPERIMENTS.VALIDATION_FLOW, 'Validation Flow', [
  'standard',
  'simplified',
  'detailed',
]);

abTestService.registerExperiment(EXPERIMENTS.FEEDBACK_TIMING, 'Feedback Timing', [
  'immediate',
  'delayed',
]);
