import os
import zipfile

def make_android_zip():
    base_dir = '/app/applet'
    android_dir = os.path.join(base_dir, 'android')
    out_zip = os.path.join(base_dir, 'public', 'FilterTap-Android-APK-Package.zip')

    if not os.path.exists(android_dir):
        print("android directory not found!")
        return

    print(f"Creating zip at {out_zip}...")
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(android_dir):
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, base_dir)
                z.write(full_path, rel_path)
    
    # Also add scripts/build-apk.sh into the zip
    readme_content = """# FilterTap Native Android APK Project
This is the complete, self-contained Android Studio project for FilterTap.

## How to Build the APK:

### Option 1: Android Studio (Recommended)
1. Open Android Studio.
2. Select "Open Project" and select the `android/` folder inside this zip.
3. Click "Build" > "Build Bundle(s) / APK(s)" > "Build APK(s)".
4. Your release/debug APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`!

### Option 2: Command Line (Linux/macOS/WSL)
```bash
cd android
./gradlew assembleDebug
# or with signed key:
./gradlew assembleRelease
```

### Option 3: Android Phone direct build (Termux)
In Termux on Android:
```bash
pkg install openjdk-17 gradle
cd android
gradle assembleDebug
```
"""
    with zipfile.ZipFile(out_zip, 'a', zipfile.ZIP_DEFLATED) as z:
        z.writestr('README-APK-BUILD.md', readme_content)

    print("Zip created successfully! Size:", os.path.getsize(out_zip), "bytes")

if __name__ == '__main__':
    make_android_zip()
