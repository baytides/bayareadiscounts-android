#!/bin/bash
# Run this after `npx expo prebuild` to configure release signing

BUILD_GRADLE="android/app/build.gradle"

if [ ! -f "$BUILD_GRADLE" ]; then
    echo "Error: $BUILD_GRADLE not found. Run 'npx expo prebuild' first."
    exit 1
fi

# Check if already patched
if grep -q "signingConfigs.release" "$BUILD_GRADLE"; then
    echo "Signing config already applied."
    exit 0
fi

# Add release signing config
sed -i '' '/signingConfigs {/,/^    }$/ {
    /keyPassword .android./a\
\        }\
\        release {\
\            // Use env vars for CI, fallback to local keystore\
\            if (System.getenv("ANDROID_KEYSTORE_FILE")) {\
\                storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))\
\                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")\
\                keyAlias System.getenv("ANDROID_KEY_ALIAS")\
\                keyPassword System.getenv("ANDROID_KEY_PASSWORD")\
\            } else {\
\                storeFile file(System.getProperty("user.home") + "/.android-keystores/bayareadiscounts.jks")\
\                storePassword "bbd136510d51f905313f9350972e8680"\
\                keyAlias "1899dc231e5253147f2fd2f0aa76fb1f"\
\                keyPassword "9cb2a3662657f67dba130136db027d7d"\
\            }
}' "$BUILD_GRADLE"

# Change release buildType to use release signing
sed -i '' 's/signingConfig signingConfigs.debug/signingConfig signingConfigs.release/' "$BUILD_GRADLE"

# Remove the caution comment
sed -i '' '/Caution! In production/d' "$BUILD_GRADLE"
sed -i '' '/see https:\/\/reactnative.dev\/docs\/signed-apk-android/d' "$BUILD_GRADLE"

echo "Release signing configured successfully!"
