import { Vibration, Platform } from 'react-native';
import Sound from 'react-native-sound';

class FeedbackService {
  private successSound: Sound | null = null;
  private errorSound: Sound | null = null;
  private warningSound: Sound | null = null;

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds() {
    Sound.setCategory('Playback');

    // Load sound files
    this.successSound = new Sound('success.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load success sound:', error);
      }
    });

    this.errorSound = new Sound('error.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load error sound:', error);
      }
    });

    this.warningSound = new Sound('warning.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load warning sound:', error);
      }
    });
  }

  playSound(type: 'success' | 'error' | 'warning' | 'scan') {
    let sound: Sound | null = null;

    switch (type) {
      case 'success':
        sound = this.successSound;
        break;
      case 'error':
        sound = this.errorSound;
        break;
      case 'warning':
        sound = this.warningSound;
        break;
      case 'scan':
        sound = this.successSound; // Use success sound for scan
        break;
    }

    if (sound) {
      sound.play((success) => {
        if (!success) {
          console.warn('Sound playback failed');
        }
      });
    }
  }

  vibrate(pattern: 'success' | 'error' | 'warning' | 'scan') {
    const patterns = {
      success: [0, 100],
      error: [0, 100, 100, 100],
      warning: [0, 200, 100, 200],
      scan: [0, 50],
    };

    if (Platform.OS === 'android') {
      Vibration.vibrate(patterns[pattern]);
    } else {
      // iOS only supports single vibration or pattern array
      if (pattern === 'success' || pattern === 'scan') {
        Vibration.vibrate();
      } else {
        Vibration.vibrate(patterns[pattern]);
      }
    }
  }

  provideFeedback(
    type: 'success' | 'error' | 'warning' | 'scan',
    options: { sound?: boolean; vibration?: boolean } = {}
  ) {
    const { sound = true, vibration = true } = options;

    if (sound) {
      this.playSound(type);
    }

    if (vibration) {
      this.vibrate(type);
    }
  }

  release() {
    this.successSound?.release();
    this.errorSound?.release();
    this.warningSound?.release();
  }
}

export const feedbackService = new FeedbackService();
