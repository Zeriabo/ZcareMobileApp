# Internationalization (i18n) Implementation

## Overview
Zcare now supports **English**, **Finnish** (Suomi), and **Arabic** (العربية) languages with a complete internationalization system using `i18next` and `react-i18next`.

## Features Implemented

### 1. **Translation Files**
- **Location**: `/src/locales/`
- **Files**: 
  - `en.json` - English translations
  - `fi.json` - Finnish translations (Suomi)
  - `ar.json` - Arabic translations (العربية)

### 2. **Language Context**
- **File**: `/src/contexts/LanguageContext.tsx`
- Provides language state management across the app
- Persists user's language preference in AsyncStorage
- Exports `useLanguage` hook for easy access

### 3. **Configuration**
- **File**: `/src/i18n.ts`
- Configures i18next with language resources
- Handles language persistence
- Default language: English

## How to Use

### In Components

```tsx
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <View>
      <Text>{t('common.welcome')}</Text>
      <Button onPress={() => setLanguage('fi')}>
        Switch to Finnish
      </Button>
      <Button onPress={() => setLanguage('ar')}>
        Switch to Arabic
      </Button>
    </View>
  );
}
```

### Translation Keys Structure

The translations are organized by domain:

- `common.*` - Common UI elements (buttons, actions)
- `auth.*` - Authentication related text
- `home.*` - Home screen content
- `profile.*` - Profile screen content
- `cars.*` - Car management
- `bookings.*` - Booking related text
- `payment.*` - Payment flow
- `repair.*` - Repair services
- `washes.*` - Wash services
- `ai.*` - AI assistant
- `navigation.*` - Navigation labels
- `errors.*` - Error messages

### Examples

```tsx
// Simple translation
{t('auth.signIn')}

// With parameters
{t('home.distance', { distance: '5.2 km' })}

// Nested keys
{t('bookings.statuses.completed')}
{t('auth.errors.usernameRequired')}
```

## Language Switcher

Users can change the language from:
1. **Profile Screen** - Tap the language button to switch between English, Finnish, and Arabic
2. The selected language is automatically saved and persists across app restarts

## Updated Screens

The following screens have been fully translated:
- ✅ Sign In Screen
- ✅ Profile Screen
- ✅ Bottom Navigation Tabs

## Adding New Translations

To add translations for additional screens:

1. **Add keys to translation files**:
   ```json
   // en.json
   {
     "myScreen": {
       "title": "My Screen Title",
       "description": "Screen description"
     }
   }
   
   // fi.json
   {
     "myScreen": {
       "title": "Näyttöni otsikko",
       "description": "Näytön kuvaus"
     }
   }
   ```

2. **Use in component**:
   ```tsx
   import { useLanguage } from '../contexts/LanguageContext';
   
   function MyScreen() {
     const { t } = useLanguage();
     
     return <Text>{t('myScreen.title')}</Text>;
   }
   ```

## Adding More Languages

To add support for additional languages:

1. Create a new translation file in `/src/locales/` (e.g., `sv.json` for Swedish)
2. Add the language to `/src/i18n.ts`:
   ```typescript
   import sv from './locales/sv.json';
   
   i18n.init({
     resources: {
       en: { translation: en },
       fi: { translation: fi },
       sv: { translation: sv }, // New language
     },
     // ...
   });
   ```
3. Update the `Language` type in `/src/contexts/LanguageContext.tsx`:
   ```typescript
   export type Language = 'en' | 'fi' | 'sv';
   ```
4. Update the `getLanguageName` function

## Technical Details

### Dependencies
- `i18next` - Core i18n framework
- `react-i18next` - React bindings for i18next

### Storage
- Language preference is stored in AsyncStorage with key `@zcare_language`
- Automatically loaded on app startup
- Changed across app restarts

### Performance
- Translations are loaded synchronously at app startup
- No network requests required (bundled with app)
- Minimal performance impact

## Testing

To test the language switching:
1. Run the app: `npm start`
2. Navigate to the Profile screen
3. Tap the language button
4. Select "English", "Suomi", or "العربية"
5. Observe all translated screens update immediately
6. Restart the app to verify persistence

## Future Enhancements

Consider implementing:
- Add more screens with translations
- System language detection and automatic switching
- Language-specific date/time formatting
- RTL (Right-to-Left) language support
- Remote translation updates
- Translation management dashboard

## Notes

- All user-facing text should use the `t()` function
- Avoid hardcoded strings in UI components
- Keep translation keys descriptive and organized
- Test with both languages before releasing updates
