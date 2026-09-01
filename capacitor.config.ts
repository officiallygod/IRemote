import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iremote.app',
  appName: 'IRemote',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    backgroundColor: '#121214',
    allowMixedContent: true,
  },
};

export default config;
