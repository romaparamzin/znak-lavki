import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Card, Surface, Chip } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MainStackParamList } from '../../navigation/types';

type RouteType = RouteProp<MainStackParamList, 'BlockedProduct'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'BlockedProduct'>;

const BlockedProductScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationProp>();
  const { productInfo } = route.params;

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const handleScanAnother = () => {
    navigation.navigate('Scan');
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🚫</Text>
        </View>

        <Text variant="headlineMedium" style={styles.title}>
          {t('errors.blockedProduct')}
        </Text>

        <Text variant="bodyLarge" style={styles.message}>
          {t('errors.blockedProductMessage')}
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            {productInfo.imageUrl && (
              <Image
                source={{ uri: productInfo.imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.titleRow}>
              <Text variant="titleLarge" style={styles.productName}>
                {productInfo.name}
              </Text>
              <Chip
                style={styles.blockedChip}
                textStyle={styles.blockedChipText}
                icon="alert-octagon"
              >
                BLOCKED
              </Chip>
            </View>

            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.label}>
                SKU:
              </Text>
              <Text variant="bodyMedium">{productInfo.sku}</Text>
            </View>

            {productInfo.manufacturer && (
              <View style={styles.infoRow}>
                <Text variant="labelMedium" style={styles.label}>
                  Manufacturer:
                </Text>
                <Text variant="bodyMedium">{productInfo.manufacturer}</Text>
              </View>
            )}

            {productInfo.category && (
              <View style={styles.infoRow}>
                <Text variant="labelMedium" style={styles.label}>
                  Category:
                </Text>
                <Text variant="bodyMedium">{productInfo.category}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Surface style={styles.warningBox}>
          <Text variant="bodyMedium" style={styles.warningText}>
            ⚠️ This product has been flagged and blocked from processing. Please contact your
            supervisor for more information.
          </Text>
        </Surface>

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleScanAnother}
            style={styles.button}
            icon="barcode-scan"
          >
            Scan Another Product
          </Button>
          <Button mode="outlined" onPress={handleGoHome} style={styles.button}>
            Go to Home
          </Button>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3C7',
  },
  surface: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    color: '#D97706',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    flex: 1,
  },
  blockedChip: {
    backgroundColor: '#DC2626',
  },
  blockedChipText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#666',
  },
  warningBox: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  warningText: {
    color: '#92400E',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 6,
  },
});

export default BlockedProductScreen;
