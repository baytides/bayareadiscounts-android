import { Alert, Linking } from 'react-native';

export async function openExternalUrl(url: string, errorMessage = 'Cannot open this link') {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Error', errorMessage);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Error', errorMessage);
  }
}
