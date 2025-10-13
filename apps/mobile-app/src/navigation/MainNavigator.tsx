import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import ProductValidationScreen from '../screens/ProductValidationScreen';
import ExpiredProductScreen from '../screens/ErrorScreens/ExpiredProductScreen';
import BlockedProductScreen from '../screens/ErrorScreens/BlockedProductScreen';
import NetworkErrorScreen from '../screens/ErrorScreens/NetworkErrorScreen';
import ScanHistoryScreen from '../screens/ScanHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Znak Lavki' }} />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{ title: 'Scan Product', headerShown: false }}
      />
      <Stack.Screen
        name="ProductValidation"
        component={ProductValidationScreen}
        options={{ title: 'Product Validation' }}
      />
      <Stack.Screen
        name="ExpiredProduct"
        component={ExpiredProductScreen}
        options={{ title: 'Expired Product' }}
      />
      <Stack.Screen
        name="BlockedProduct"
        component={BlockedProductScreen}
        options={{ title: 'Blocked Product' }}
      />
      <Stack.Screen
        name="NetworkError"
        component={NetworkErrorScreen}
        options={{ title: 'Network Error', presentation: 'modal' }}
      />
      <Stack.Screen
        name="ScanHistory"
        component={ScanHistoryScreen}
        options={{ title: 'Scan History' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
