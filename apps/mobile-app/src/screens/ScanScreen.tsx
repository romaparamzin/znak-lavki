import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, Surface, IconButton } from 'react-native-paper';
import { Camera, useCameraDevices, useCodeScanner } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addScanResult, toggleTorch, ScanResult } from '../store/slices/scannerSlice';
import { MainStackParamList } from '../navigation/types';
import { feedbackService } from '../services/feedback/feedbackService';
import { useProductQuery } from '../services/api/queries';
import { addToQueue } from '../store/slices/offlineSyncSlice';
import * as Sentry from '@sentry/react-native';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'Scan'>;

const ScanScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const devices = useCameraDevices();
  const device = devices.back;

  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const lastScannedCode = useRef<string | null>(null);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);

  const torchEnabled = useAppSelector((state) => state.scanner.torchEnabled);
  const settings = useAppSelector((state) => state.settings);
  const isOnline = useAppSelector((state) => state.offlineSync.isOnline);

  const { data: productData, isLoading: isLoadingProduct } = useProductQuery(
    scannedCode || '',
    !!scannedCode
  );

  useEffect(() => {
    checkCameraPermission();
    return () => {
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (productData && scannedCode) {
      handleProductData(scannedCode, productData);
    }
  }, [productData, scannedCode]);

  const checkCameraPermission = async () => {
    try {
      const permission = await Camera.getCameraPermissionStatus();

      if (permission === 'authorized') {
        setHasPermission(true);
      } else {
        const newPermission = await Camera.requestCameraPermission();
        setHasPermission(newPermission === 'authorized');

        if (newPermission === 'denied') {
          Alert.alert(t('scanner.cameraPermissionDenied'), t('scanner.cameraPermissionMessage'));
        }
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      Sentry.captureException(error);
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && isActive) {
        const code = codes[0];
        handleCodeScanned(code.value || '');
      }
    },
  });

  const handleCodeScanned = (code: string) => {
    // Prevent duplicate scans
    if (lastScannedCode.current === code) {
      return;
    }

    // Clear previous timeout
    if (scanTimeout.current) {
      clearTimeout(scanTimeout.current);
    }

    lastScannedCode.current = code;
    setIsActive(false);
    setScannedCode(code);

    // Provide feedback
    feedbackService.provideFeedback('scan', {
      sound: settings.soundEnabled,
      vibration: settings.vibrationEnabled,
    });

    // Reset after delay
    scanTimeout.current = setTimeout(() => {
      lastScannedCode.current = null;
      setIsActive(true);
    }, settings.scannerDelay);
  };

  const handleProductData = (code: string, data: any) => {
    const scanResult: ScanResult = {
      id: `scan-${Date.now()}`,
      code,
      type: 'qr',
      productInfo: data.product,
      timestamp: new Date().toISOString(),
      synced: isOnline,
    };

    dispatch(addScanResult(scanResult));

    // Add to offline queue if offline
    if (!isOnline) {
      dispatch(
        addToQueue({
          id: `scan-${scanResult.id}`,
          type: 'scan',
          data: scanResult,
          timestamp: scanResult.timestamp,
        })
      );
    }

    // Navigate based on product status
    const { product, validation } = data;

    if (product.status === 'expired') {
      navigation.replace('ExpiredProduct', { productInfo: product });
    } else if (product.status === 'blocked') {
      navigation.replace('BlockedProduct', { productInfo: product });
    } else {
      navigation.replace('ProductValidation', {
        scanId: scanResult.id,
        code,
        productInfo: product,
      });
    }
  };

  const handleManualEntry = () => {
    if (!manualCode.trim()) {
      Alert.alert(t('common.error'), t('scanner.invalidCode'));
      return;
    }

    handleCodeScanned(manualCode.trim());
    setManualCode('');
    setShowManualEntry(false);
  };

  const handleTorchToggle = () => {
    dispatch(toggleTorch());
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>{t('scanner.cameraPermissionDenied')}</Text>
        <Button mode="contained" onPress={checkCameraPermission}>
          {t('common.retry')}
        </Button>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>{t('errors.cameraError')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && !showManualEntry}
        codeScanner={codeScanner}
        torch={torchEnabled ? 'on' : 'off'}
      />

      {/* Header Controls */}
      <View style={styles.header}>
        <IconButton icon="close" iconColor="white" size={24} onPress={handleClose} />
        <View style={styles.headerActions}>
          <IconButton
            icon={torchEnabled ? 'flashlight' : 'flashlight-off'}
            iconColor="white"
            size={24}
            onPress={handleTorchToggle}
          />
          <IconButton
            icon="keyboard"
            iconColor="white"
            size={24}
            onPress={() => setShowManualEntry(!showManualEntry)}
          />
        </View>
      </View>

      {/* Scan Frame */}
      <View style={styles.scanFrame}>
        <View style={styles.frameCorner} />
        <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
        <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
        <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Surface style={styles.instructionSurface}>
          <Text style={styles.instructionText}>
            {isLoadingProduct ? t('common.loading') : t('scanner.scanning')}
          </Text>
        </Surface>
      </View>

      {/* Manual Entry */}
      {showManualEntry && (
        <View style={styles.manualEntry}>
          <Surface style={styles.manualEntrySurface}>
            <Text variant="titleMedium" style={styles.manualEntryTitle}>
              {t('scanner.manualEntry')}
            </Text>
            <TextInput
              mode="outlined"
              label={t('scanner.enterCode')}
              value={manualCode}
              onChangeText={setManualCode}
              style={styles.manualInput}
              autoFocus
              onSubmitEditing={handleManualEntry}
            />
            <View style={styles.manualButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowManualEntry(false)}
                style={styles.manualButton}
              >
                {t('common.cancel')}
              </Button>
              <Button mode="contained" onPress={handleManualEntry} style={styles.manualButton}>
                {t('common.done')}
              </Button>
            </View>
          </Surface>
        </View>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>🔴 {t('sync.offline')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  scanFrame: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: '70%',
    height: '30%',
    zIndex: 1,
  },
  frameCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: 0,
    left: 0,
  },
  frameCornerTopRight: {
    left: undefined,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  frameCornerBottomLeft: {
    top: undefined,
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  frameCornerBottomRight: {
    top: undefined,
    bottom: 0,
    left: undefined,
    right: 0,
    borderTopWidth: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  instructionSurface: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  manualEntry: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  manualEntrySurface: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  manualEntryTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  manualInput: {
    marginBottom: 16,
  },
  manualButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  manualButton: {
    flex: 1,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: 'white',
  },
  offlineIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 1,
  },
  offlineText: {
    color: 'white',
    fontSize: 12,
  },
});

export default ScanScreen;
