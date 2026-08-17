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

## 6. Splash Screen Sizing & Load Synchronization
- **Fullscreen Container Bounds**: Custom React Native splash screens must use explicit full-screen absolute bounds rather than `StyleSheet.absoluteFill` alone to prevent viewport cutoff on various device aspect ratios:
  ```ts
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    zIndex: 999999,
  }
  ```
- **Data-Ready Synchronization**: Always gate splash screen dismissal on an `isReady` state (verifying initial database seeding and initial API pull) rather than a fixed arbitrary timer, preventing flash-of-empty-content.

## 7. RTL Flexbox Row & Chip Alignment
- React Native flexbox containers do not automatically mirror child order for `flexDirection: 'row'`. Always explicitly apply:
  ```ts
  style={{
    flexDirection: isAr ? 'row-reverse' : 'row',
  }}
  ```
  to all filter chip groups, modal tag lists, and horizontal button clusters.

## 8. Dynamic Theme Architecture & Light Mode Invariants
- Avoid hardcoding fixed dark hex colors (e.g. `#11253e`) on screen wrappers, cards, or tab navigation.
- Always consume semantic palette tokens via `useAppTheme()` (`colors.bgPrimary`, `colors.cardBg`, `colors.textPrimary`, `colors.borderSolid`) and expose a header `ThemeToggle` component to ensure clean Light and Dark mode rendering.

## 9. Live API & WatermelonDB Sync Fallbacks
- To support live backend models without mock data, use defensive fallback chains in `sync.ts` for URL and nested object fields:
  ```ts
  m.locationUrl = item.location || item.location_url || item.map_url || item.google_maps_url || '';
  m.topicName = typeof item.topic === 'object' 
    ? (item.topic?.ar_name || item.topic?.en_name || item.topic?.name) 
    : (item.topic || item.topic_name || '');
  ```

## 10. Azure AD / MSAL Authentication & Broker Integration
- **Platform-Specific Redirect URIs**:
  - Android broker/browser redirect must follow `msauth://<package_name>/<signature_hash_url_encoded>` (e.g., `msauth://org.naegypt.app/Xo8WBi6jzSxKDVR4drqm84yr9iU%3D`), matching the Android signature hash in Azure App Registration.
  - iOS redirect must follow `msauth.<bundle_id>://auth` registered under `CFBundleURLSchemes`.
  - Expo custom scheme fallback: `naegypt://auth-callback`.
- **PKCE Authorization & Account Chooser**:
  - When initiating interactive login via `AuthSession.AuthRequest`, specify `prompt: AuthSession.Prompt.SelectAccount` and `domain_hint: 'egyptna.org'` to allow servants to easily switch accounts or pick from cached identities without session lock-in.
  - Required Scopes: `openid`, `profile`, `email`, `offline_access`, `User.Read`.
- **Hybrid Token Exchange & Fallback**:
  - Direct exchange: Exchange authorization code for Azure access token using `AuthSession.exchangeCodeAsync` with `code_verifier`, then exchange Azure token with backend `POST /api/v1/auth/azure/login`.
  - Server redirect fallback: If client PKCE is restricted, fall back to `WebBrowser.openAuthSessionAsync('https://egyptna.org/auth/azure/redirect?redirect_uri=naegypt://auth-callback', 'naegypt://auth-callback')`.
- **Silent Auth & Two-Stage Sign-Out**:
  - App startup runs silent auth checking `SecureStore` for Sanctum token and verifies against `GET /api/v1/user`, auto-clearing tokens on 401 response.
  - Default logout deletes local Sanctum token and cached user. For a full device sign-out, trigger Azure logout URL `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/logout?post_logout_redirect_uri=naegypt://auth-callback`.


