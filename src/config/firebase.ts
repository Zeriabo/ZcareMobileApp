import { getApp, getApps, initializeApp, ReactNativeFirebase } from "@react-native-firebase/app";

const firebaseConfig = {
  apiKey: 'AIzaSyACD-MAJqLPXvYMhBCexy6fSRzvv2Nk77g',
  authDomain: 'zwash-385807.firebaseapp.com',
  projectId: 'zwash-385807',
  storageBucket: 'zwash-385807.firebasestorage.app',
  messagingSenderId: '932522221050',
  databaseURL:'https://zwash-385807-default-rtdb.europe-west1.firebasedatabase.app',
  appId: '1:932522221050:ios:4c2639c1754e65687dd843',
};
let app: ReactNativeFirebase.FirebaseApp;
if (getApps().length === 0) {
 app =  initializeApp(firebaseConfig) as unknown as ReactNativeFirebase.FirebaseApp;
}else {
    app = getApp();
}

// 2. Export the synchronous getter. 
// This satisfies TypeScript and ensures services get the actual App object.


export default app;