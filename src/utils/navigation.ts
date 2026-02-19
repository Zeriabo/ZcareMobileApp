export const goBackOrHome = (navigation: any, fallbackRoute: string = 'MainTabs') => {
  if (navigation?.canGoBack?.()) {
    navigation.goBack();
    return;
  }

  if (navigation?.reset) {
    navigation.reset({
      index: 0,
      routes: [{ name: fallbackRoute }],
    });
  }
};
