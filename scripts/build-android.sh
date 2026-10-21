#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

java_major="$(java -version 2>&1 | sed -n '1s/.*version "\([0-9]*\).*/\1/p')"
if [[ "${java_major:-0}" -lt 21 ]]; then
  for candidate in \
    "/home/ubuntu/.local/share/islamona-android/jdk-21" \
    "/home/ubuntu/.cache/codex-android-build/jdk-21.0.12.1+1" \
    "/home/ubuntu/.local/opt/android-studio/jbr"; do
    if [[ -x "$candidate/bin/java" ]]; then
      export JAVA_HOME="$candidate"
      export PATH="$JAVA_HOME/bin:$PATH"
      break
    fi
  done
fi

if [[ "$(java -version 2>&1 | sed -n '1s/.*version "\([0-9]*\).*/\1/p')" -lt 21 ]]; then
  echo "Android build requires Java 21 or newer." >&2
  exit 1
fi

cd "$project_dir"
npm run android:sync
cd android
./gradlew assembleDebug

echo "APK: $project_dir/android/app/build/outputs/apk/debug/app-debug.apk"
