# Bay Area Discounts - Android

Android version of the Bay Area Discounts mobile application, connecting Bay Area residents to public benefits and community resources.

## Prerequisites

- Node.js 18+
- npm or yarn
- Android Studio (latest version)
- Android SDK (API 34+)
- Java JDK 17+

## Getting Started

### Installation

```bash
npm install
```

### Running on Android Emulator

```bash
npm start
# Then press 'a' in the terminal to open Android emulator
```

Or use:

```bash
npm run android
```

### Running on Android Device

1. Enable USB debugging on your Android device
2. Connect via USB or wireless debugging
3. Run:

```bash
npm run run:device
```

### Building for Production

```bash
npm run prebuild
```

This will generate the native Android project in the `android/` directory.

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   ├── navigation/     # Navigation setup
│   ├── services/       # API and data services
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── assets/             # Images, fonts, and other assets
└── app.json           # Expo/React Native configuration
```

## Scripts

- `npm start` - Start the development server (Android mode)
- `npm run android` - Run on Android emulator
- `npm run run:device` - Run on physical Android device
- `npm run run:emulator` - Run on Android emulator
- `npm run prebuild` - Generate native Android project
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Contributing

This is the Android-specific repository. For cross-platform issues or features, please coordinate with the iOS repository.

### Android-Specific Considerations

- Follow Material Design guidelines
- Test on multiple Android versions and device sizes
- Ensure proper handling of back button navigation
- Test with TalkBack for accessibility
- Handle different screen densities and orientations

## Related Repositories

- [iOS Repository](https://github.com/baytides/bayareadiscounts-ios)
- [Main Organization](https://github.com/baytides)

## Support

- Report Android-specific issues: [GitHub Issues](https://github.com/baytides/bayareadiscounts-android/issues)
- Website: [baytides.org](https://baytides.org)

## License

[Your License Here]
