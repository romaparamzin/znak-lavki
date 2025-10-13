import { NavigatorScreenParams } from '@react-navigation/native';
import { ProductInfo } from '../store/slices/scannerSlice';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Scan: undefined;
  ProductValidation: {
    scanId: string;
    code: string;
    productInfo?: ProductInfo;
  };
  ExpiredProduct: {
    productInfo: ProductInfo;
  };
  BlockedProduct: {
    productInfo: ProductInfo;
  };
  NetworkError: {
    onRetry?: () => void;
  };
  ScanHistory: undefined;
  Settings: undefined;
};
