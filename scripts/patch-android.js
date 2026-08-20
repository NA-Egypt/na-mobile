const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// 1. Patch iOS Podspecs
const rnsvg = 'node_modules/react-native-svg/RNSVG.podspec';
if (fs.existsSync(rnsvg)) {
  let c = fs.readFileSync(rnsvg, 'utf8');
  c = c.replace(/s\.visionos\.exclude_files =.*/g, "s.visionos.exclude_files = '**/*.macos.{h,m,mm}' if s.respond_to?(:visionos)")
       .replace(/:visionos => "1\.0",?/g, '');
  fs.writeFileSync(rnsvg, c);
}

const utilsRb = 'node_modules/react-native/scripts/cocoapods/utils.rb';
if (fs.existsSync(utilsRb)) {
  let c = fs.readFileSync(utilsRb, 'utf8');
  c = c.replace(/current_search_paths = \(optional_current_search_path != nil \? optional_current_search_path : ""\)\s*\.split\(" "\)/g,
    'if optional_current_search_path.is_a?(Array)\n            current_search_paths = optional_current_search_path\n        else\n            current_search_paths = (optional_current_search_path != nil ? optional_current_search_path : "").split(" ")\n        end');
  fs.writeFileSync(utilsRb, c);
}

['node_modules/expo-modules-jsi/apple/ExpoModulesJSI.podspec', 'node_modules/react-native/React/React-RCTFBReactNativeSpec.podspec'].forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/:always_out_of_date => [^,\n]+,?/g, '');
    fs.writeFileSync(f, c);
  }
});

// 2. Patch Gradle Kotlin Plugins with -Xskip-metadata-version-check
const ktsFiles = [
  'node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-max-sdk-override-plugin/build.gradle.kts',
  'node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin/build.gradle.kts',
  'node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/build.gradle.kts',
  'node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin-shared/build.gradle.kts',
  'node_modules/expo/node_modules/expo-modules-core/expo-module-gradle-plugin/build.gradle.kts',
  'node_modules/@react-native/gradle-plugin/settings-plugin/build.gradle.kts',
  'node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build.gradle.kts',
  'node_modules/@react-native/gradle-plugin/shared/build.gradle.kts',
  'node_modules/@react-native/gradle-plugin/build.gradle.kts'
];

ktsFiles.forEach(kts => {
  if (fs.existsSync(kts)) {
    let c = fs.readFileSync(kts, 'utf8');
    if (!c.includes('-Xskip-metadata-version-check')) {
      if (c.includes('compilerOptions {')) {
        c = c.replace('compilerOptions {', 'compilerOptions {\n    freeCompilerArgs.add("-Xskip-metadata-version-check")');
      } else if (c.includes('jvmTarget = JavaVersion.VERSION_11.toString()')) {
        c = c.replace('jvmTarget = JavaVersion.VERSION_11.toString()', 'jvmTarget = JavaVersion.VERSION_11.toString()\n    freeCompilerArgs += listOf("-Xskip-metadata-version-check")');
      }
      fs.writeFileSync(kts, c);
    }
  }
});

// 3. Patch library build.gradle files with duplicate kotlin-android plugin application
const gradleFiles = [
  'node_modules/@nozbe/watermelondb/native/android/build.gradle',
  'node_modules/react-native-safe-area-context/android/build.gradle',
  'node_modules/expo/node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle',
  'node_modules/expo-router/node_modules/react-native-screens/android/build.gradle',
  'node_modules/react-native-screens/android/build.gradle',
  'node_modules/react-native-gesture-handler/android/build.gradle'
];

gradleFiles.forEach(gf => {
  if (fs.existsSync(gf)) {
    let c = fs.readFileSync(gf, 'utf8');
    const safeKotlin = 'if (!plugins.hasPlugin("kotlin-android") && !plugins.hasPlugin("org.jetbrains.kotlin.android") && extensions.findByName("kotlin") == null) { apply plugin: \'kotlin-android\' }';
    if (c.includes("apply plugin: 'kotlin-android'")) {
      c = c.replace(/apply plugin:\s*'kotlin-android'/g, safeKotlin);
      fs.writeFileSync(gf, c);
    } else if (c.includes('apply plugin: "kotlin-android"')) {
      c = c.replace(/apply plugin:\s*"kotlin-android"/g, safeKotlin);
      fs.writeFileSync(gf, c);
    }
  }
});

// 4. Patch expo-module-gradle-plugin ProjectConfiguration.kt
const pc = 'node_modules/expo/node_modules/expo-modules-core/expo-module-gradle-plugin/src/main/kotlin/expo/modules/plugin/ProjectConfiguration.kt';
if (fs.existsSync(pc)) {
  let c = fs.readFileSync(pc, 'utf8');
  c = c.replace('if (!plugins.hasPlugin("kotlin-android")) {', 'if (!plugins.hasPlugin("kotlin-android") && !plugins.hasPlugin("org.jetbrains.kotlin.android") && extensions.findByName("kotlin") == null) {');
  fs.writeFileSync(pc, c);
}

// 5. Patch WatermelonDB Kotlin compatibility for RN 0.86+ / SDK 36
const wdb = 'node_modules/@nozbe/watermelondb/native/android/build.gradle';
if (fs.existsSync(wdb)) {
  let c = fs.readFileSync(wdb, 'utf8');
  c = c.replace("'com.facebook.react:react-native:+'", "'com.facebook.react:react-android'")
       .replace("'kotlin-stdlib-jdk7:", "'kotlin-stdlib:");
  fs.writeFileSync(wdb, c);
}

const wdbDb = 'node_modules/@nozbe/watermelondb/native/android/src/main/java/com/nozbe/watermelondb/Database.kt';
if (fs.existsSync(wdbDb)) {
  let c = fs.readFileSync(wdbDb, 'utf8');
  c = c.replace('rawArgs, null, null', 'rawArgs, "", null');
  fs.writeFileSync(wdbDb, c);
}

const wdbBridge = 'node_modules/@nozbe/watermelondb/native/android/src/main/java/com/nozbe/watermelondb/DatabaseBridge.kt';
if (fs.existsSync(wdbBridge)) {
  let c = fs.readFileSync(wdbBridge, 'utf8');
  c = c.replace('reactContext.catalystInstance.reactQueueConfiguration.jsQueueThread.runOnQueue', 'reactContext.runOnJSQueueThread');
  fs.writeFileSync(wdbBridge, c);
}

// 6. Recursively find and patch all graphicsConversions.h files
try {
  const searchDirs = [
    path.join(os.homedir(), '.gradle', 'caches'),
    path.join(process.cwd(), 'node_modules', 'react-native'),
    path.join(process.cwd(), 'android'),
  ];

  let results = [];
  searchDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        const findCmd = `find "${dir}" -name "graphicsConversions.h" 2>/dev/null`;
        const found = execSync(findCmd, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
        results.push(...found);
      } catch {}
    }
  });

  results = [...new Set(results)];

  results.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('format(') || content.includes('std::format')) {
          content = content.replace(/return\s+std::format\([^;]+\);/g, 'return std::to_string(dimension.value) + "%";')
                           .replace(/return\s+folly::format\([^;]+\);/g, 'return std::to_string(dimension.value) + "%";');
          fs.writeFileSync(filePath, content);
          console.log('Patched graphicsConversions.h at:', filePath);
        }
      } catch (err) {
        console.warn('Could not patch:', filePath, err.message);
      }
    }
  });
} catch (e) {
  console.warn('Warning during graphicsConversions patching:', e.message);
}

console.log('✅ Android and iOS compatibility patches applied successfully.');
