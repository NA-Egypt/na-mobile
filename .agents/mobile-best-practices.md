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
- Isolate embedded English terms (*H&I, GSR, PDF, Newcomers*) inside Arabic text blocks to prevent punctuation reversals.

## 4. Git Large Payload Handling
- Set `git config http.postBuffer 524288000` (500MB) when pushing initial React Native repos with embedded asset bundles to avoid `RPC failed; HTTP 400`.
