# Mobile & React Native Engineering Guidelines (NA Egypt)

## 1. Safe Area Insets & Edge-to-Edge Navigation
- In Android 15+ / SDK 36 edge-to-edge mode, calculate tab bar height dynamically using `useSafeAreaInsets()` from `react-native-safe-area-context` to prevent navigation pills from obscuring tab icons:
  ```ts
  const insets = useSafeAreaInsets();
  tabBarStyle: {
    height: 56 + (insets.bottom > 0 ? insets.bottom : 8),
    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
  }
  ```
- Set `headerShown: false` in `(tabs)/_layout.tsx` when screens provide custom branded headers to prevent duplicate header bars and white gaps.

## 2. Laravel API Resource Data Extraction
- Laravel API Resource endpoints wrap collections in `{ data: [...] }`. Always unwrap using:
  ```ts
  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data)) return res.data;
    return [];
  };
  ```

## 3. Bi-Directional Arabic (RTL) & English (LTR) Text Alignment
- Explicitly apply `writingDirection` and `textAlign` on text elements:
  ```ts
  style={{
    textAlign: isAr ? 'right' : 'left',
    writingDirection: isAr ? 'rtl' : 'ltr',
  }}
  ```
- Enforce Unicode Left-to-Right (`\u200E`) isolation on time ranges and acronyms (*H&I, GSR, PDF, Newcomers*) inside Arabic text blocks to prevent inverted punctuation or swapped start/end times:
  ```ts
  <Text style={{ writingDirection: 'ltr' }}>{`\u200E${startTime} \u2013 ${endTime}`}</Text>
  ```

## 4. Native C++ Storage Management & Build Optimizations
- **Target CPU Architectures**: In `android/gradle.properties`, target modern 64-bit architectures (`reactNativeArchitectures=arm64-v8a,x86_64`) to cut compilation time from 10+ minutes to ~1m 45s and avoid 4x duplicate object binaries.
- **Node Modules & Build Output Purging**: React Native C++ libraries compile intermediate object files into `node_modules/**/android/build` and `.cxx`. Use `npm run clean` to stop Gradle daemons and purge all intermediate C++ compilation outputs across `android/`, `ios/Pods`, and `node_modules/`.
- **C++ Header Patching**: In React Native 0.86+, `std::format("{}%", dimension.value)` in `graphicsConversions.h` must be patched to `return std::to_string(dimension.value) + "%";` across both `node_modules/` and `.gradle/caches/transforms/*/transformed/react-android-*/`.

## 5. Physical iOS Device Deployment
- When testing on connected physical iPhones via Xcode/ADB, skip the optional 8+ GB "iOS Simulator Runtime" download. Physical iPhone builds only require personal Apple ID team signing (`open ios/NAEgypt.xcworkspace` ➔ Signing & Capabilities ➔ Team).
