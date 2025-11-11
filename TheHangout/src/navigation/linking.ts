import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

export const linking = {
  prefixes: ['thehangout://'],
  config: {
    screens: {
      Main: {
        screens: {
          Discover: 'discover',
          Map: 'map',
          Create: 'create',
          Messages: 'messages',
          Profile: 'profile',
        },
      },
      PartyDetail: 'party/:partyId',
      PhotoDetail: 'photo/:photoId',
      FriendList: 'friends',
      Profile: 'profile/:userId',
      Messages: 'messages/:partyId',
    },
  },
  async getInitialURL() {
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }
  },
  subscribe(listener: (url: string) => void) {
    // Listen to incoming links from deep linking
    const onReceiveURL = ({ url }: { url: string }) => {
      listener(url);
    };

    // Listen to URL events
    const subscription = Linking.addEventListener('url', onReceiveURL);

    return () => {
      subscription.remove();
    };
  },
};

