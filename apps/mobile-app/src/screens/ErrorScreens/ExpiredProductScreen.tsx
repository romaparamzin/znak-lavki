import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Card, Surface } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MainStackParamList } from '../../navigation/types';

type RouteType = RouteProp<MainStackParamList, 'ExpiredProduct'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'ExpiredProduct'>;

const ExpiredProductScreen = () => {
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
          <Text style={styles.icon}>⚠️</Text>
        </View>

        <Text variant="headlineMedium" style={styles.title}>
          {t('errors.expiredProduct')}
        </Text>

        <Text variant="bodyLarge" style={styles.message}>
          {t('errors.expiredProductMessage')}
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

            <Text variant="titleLarge" style={styles.productName}>
              {productInfo.name}
            </Text>

            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.label}>
                SKU:
              </Text>
              <Text variant="bodyMedium">{productInfo.sku}</Text>
            </View>

            {productInfo.expiryDate && (
              <View style={styles.infoRow}>
                <Text variant="labelMedium" style={styles.label}>
                  Expired On:
                </Text>
                <Text variant="bodyMedium" style={styles.expiredDate}>
                  {new Date(productInfo.expiryDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {productInfo.manufacturer && (
              <View style={styles.infoRow}>
                <Text variant="labelMedium" style={styles.label}>
                  Manufacturer:
                </Text>
                <Text variant="bodyMedium">{productInfo.manufacturer}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

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
    backgroundColor: '#FEF2F2',
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
    color: '#DC2626',
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
    marginBottom: 24,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  productName: {
    marginBottom: 12,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#666',
  },
  expiredDate: {
    color: '#DC2626',
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 6,
  },
});

export default ExpiredProductScreen;
