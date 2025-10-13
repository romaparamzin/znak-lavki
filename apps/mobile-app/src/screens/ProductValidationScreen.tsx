import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  TextInput,
  Surface,
  Divider,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MainStackParamList } from '../navigation/types';
import { useValidateProduct, useReportIssue } from '../services/api/queries';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateProductInfo } from '../store/slices/scannerSlice';
import { feedbackService } from '../services/feedback/feedbackService';
import { pushNotificationService } from '../services/notifications/pushNotificationService';

type RouteProp = RouteProp<MainStackParamList, 'ProductValidation'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'ProductValidation'>;

const ProductValidationScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const { scanId, code, productInfo } = route.params;
  const settings = useAppSelector((state) => state.settings);

  const [notes, setNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportType, setReportType] = useState<'counterfeit' | 'damaged' | 'expired' | 'other'>(
    'other'
  );

  const validateMutation = useValidateProduct();
  const reportMutation = useReportIssue();

  const isExpiringSoon = () => {
    if (!productInfo?.expiryDate) return false;
    const expiryDate = new Date(productInfo.expiryDate);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const handleAccept = () => {
    validateMutation.mutate(
      {
        scanId,
        code,
        status: 'accepted',
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          feedbackService.provideFeedback('success', {
            sound: settings.soundEnabled,
            vibration: settings.vibrationEnabled,
          });

          pushNotificationService.showScanAlert(productInfo?.name || 'Product', 'valid');

          Alert.alert(t('common.success'), t('validation.acceptSuccess'), [
            { text: t('common.ok'), onPress: () => navigation.navigate('Home') },
          ]);
        },
        onError: (error: any) => {
          feedbackService.provideFeedback('error', {
            sound: settings.soundEnabled,
            vibration: settings.vibrationEnabled,
          });

          Alert.alert(t('common.error'), error.message || 'Failed to accept product');
        },
      }
    );
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      Alert.alert(t('common.error'), 'Please provide a reason for rejection');
      return;
    }

    validateMutation.mutate(
      {
        scanId,
        code,
        status: 'rejected',
        reason: rejectReason,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          feedbackService.provideFeedback('warning', {
            sound: settings.soundEnabled,
            vibration: settings.vibrationEnabled,
          });

          setShowRejectDialog(false);
          Alert.alert(t('common.success'), t('validation.rejectSuccess'), [
            { text: t('common.ok'), onPress: () => navigation.navigate('Home') },
          ]);
        },
        onError: (error: any) => {
          Alert.alert(t('common.error'), error.message || 'Failed to reject product');
        },
      }
    );
  };

  const handleReport = () => {
    if (!reportDescription.trim()) {
      Alert.alert(t('common.error'), 'Please provide a description');
      return;
    }

    reportMutation.mutate(
      {
        scanId,
        code,
        issueType: reportType,
        description: reportDescription,
      },
      {
        onSuccess: () => {
          feedbackService.provideFeedback('warning', {
            sound: settings.soundEnabled,
            vibration: settings.vibrationEnabled,
          });

          setShowReportDialog(false);
          Alert.alert(t('common.success'), t('validation.reportSuccess'), [
            { text: t('common.ok'), onPress: () => navigation.navigate('Home') },
          ]);
        },
        onError: (error: any) => {
          Alert.alert(t('common.error'), error.message || 'Failed to report issue');
        },
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return '#10B981';
      case 'expired':
        return '#EF4444';
      case 'blocked':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Product Image */}
      {productInfo?.imageUrl && (
        <Image
          source={{ uri: productInfo.imageUrl }}
          style={styles.productImage}
          resizeMode="cover"
        />
      )}

      {/* Status Banner */}
      {isExpiringSoon() && (
        <Surface style={[styles.banner, styles.warningBanner]}>
          <Text style={styles.bannerText}>⚠️ {t('validation.expiryWarning')}</Text>
        </Surface>
      )}

      <View style={styles.content}>
        {/* Product Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.titleRow}>
              <Text variant="headlineSmall" style={styles.productName}>
                {productInfo?.name || 'Unknown Product'}
              </Text>
              <Chip
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(productInfo?.status || 'unknown') },
                ]}
                textStyle={styles.statusChipText}
              >
                {t(`product.${productInfo?.status || 'unknown'}`)}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.label}>
                {t('product.sku')}:
              </Text>
              <Text variant="bodyMedium">{productInfo?.sku || 'N/A'}</Text>
            </View>

            {productInfo?.expiryDate && (
              <View style={styles.infoRow}>
                <Text variant="labelMedium" style={styles.label}>
                  {t('product.expiryDate')}:
                </Text>
                <Text variant="bodyMedium">
                  {new Date(productInfo.expiryDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {productInfo?.manufacturer && (
              <View style={styles.infoRow}>
                <Text variant="labelMedium" style={styles.label}>
                  {t('product.manufacturer')}:
                </Text>
                <Text variant="bodyMedium">{productInfo.manufacturer}</Text>
              </View>
            )}

            {productInfo?.category && (
              <View style={styles.infoRow}>
                <Text variant="labelMedium" style={styles.label}>
                  {t('product.category')}:
                </Text>
                <Text variant="bodyMedium">{productInfo.category}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.label}>
                {t('scanner.enterCode')}:
              </Text>
              <Text variant="bodyMedium" style={styles.code}>
                {code}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Notes Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('validation.notes')}
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Add any notes or observations..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={styles.notesInput}
            />
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleAccept}
            style={[styles.actionButton, styles.acceptButton]}
            loading={validateMutation.isPending}
            disabled={validateMutation.isPending || reportMutation.isPending}
            icon="check-circle"
          >
            {t('validation.accept')}
          </Button>

          <Button
            mode="contained"
            onPress={() => setShowRejectDialog(true)}
            style={[styles.actionButton, styles.rejectButton]}
            disabled={validateMutation.isPending || reportMutation.isPending}
            icon="close-circle"
          >
            {t('validation.reject')}
          </Button>

          <Button
            mode="outlined"
            onPress={() => setShowReportDialog(true)}
            style={styles.actionButton}
            disabled={validateMutation.isPending || reportMutation.isPending}
            icon="alert-circle"
          >
            {t('validation.report')}
          </Button>
        </View>
      </View>

      {/* Reject Dialog */}
      <Portal>
        <Dialog visible={showRejectDialog} onDismiss={() => setShowRejectDialog(false)}>
          <Dialog.Title>{t('validation.reject')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Please provide a reason for rejecting this product:
            </Text>
            <TextInput
              mode="outlined"
              label={t('validation.reason')}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRejectDialog(false)}>{t('common.cancel')}</Button>
            <Button onPress={handleReject} loading={validateMutation.isPending}>
              {t('validation.reject')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Report Dialog */}
        <Dialog visible={showReportDialog} onDismiss={() => setShowReportDialog(false)}>
          <Dialog.Title>{t('validation.report')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Select issue type:
            </Text>
            <View style={styles.reportTypes}>
              <Chip
                selected={reportType === 'counterfeit'}
                onPress={() => setReportType('counterfeit')}
                style={styles.reportTypeChip}
              >
                Counterfeit
              </Chip>
              <Chip
                selected={reportType === 'damaged'}
                onPress={() => setReportType('damaged')}
                style={styles.reportTypeChip}
              >
                Damaged
              </Chip>
              <Chip
                selected={reportType === 'expired'}
                onPress={() => setReportType('expired')}
                style={styles.reportTypeChip}
              >
                Expired
              </Chip>
              <Chip
                selected={reportType === 'other'}
                onPress={() => setReportType('other')}
                style={styles.reportTypeChip}
              >
                Other
              </Chip>
            </View>
            <TextInput
              mode="outlined"
              label="Description"
              value={reportDescription}
              onChangeText={setReportDescription}
              multiline
              numberOfLines={4}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowReportDialog(false)}>{t('common.cancel')}</Button>
            <Button onPress={handleReport} loading={reportMutation.isPending}>
              {t('common.save')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  banner: {
    padding: 12,
    elevation: 0,
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
  },
  bannerText: {
    textAlign: 'center',
    color: '#92400E',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    flex: 1,
    marginRight: 12,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#666',
  },
  code: {
    fontFamily: 'monospace',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  notesInput: {
    marginTop: 8,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 6,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  dialogText: {
    marginBottom: 12,
  },
  dialogInput: {
    marginTop: 8,
  },
  reportTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 12,
  },
  reportTypeChip: {
    marginRight: 4,
  },
});

export default ProductValidationScreen;
