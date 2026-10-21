#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="$project_dir/public"
temporary_dir="$(mktemp -d)"
trap 'rm -rf -- "$temporary_dir"' EXIT
mkdir -p "$output_dir"

make_sound() {
  local name="$1"
  local wave="$2"
  shift 2
  local filters=""
  local inputs=()
  local labels=""
  local index=0
  for frequency in "$@"; do
    inputs+=( -f lavfi -i "sine=frequency=$frequency:duration=0.38:sample_rate=22050" )
    filters+="[$index:a]afade=t=in:st=0:d=0.03,afade=t=out:st=0.31:d=0.07[a$index];"
    labels+="[a$index]"
    index=$((index + 1))
  done
  ffmpeg -y -loglevel error "${inputs[@]}" \
    -filter_complex "${filters}${labels}concat=n=$index:v=0:a=1,volume=0.7[melody]" \
    -map '[melody]' -c:a pcm_s16le "$temporary_dir/$name.wav"
  ffmpeg -y -loglevel error -stream_loop 5 -i "$temporary_dir/$name.wav" \
    -t 8 -af "$wave" -ar 22050 -ac 1 -c:a pcm_s16le "$output_dir/$name.wav"
}

make_sound adhan   'volume=0.8' 392 440 523 440
make_sound dawn    'volume=0.65' 330 392 494 587
make_sound classic 'volume=0.9' 880 660 880 660
make_sound digital 'volume=0.75' 784 988 784 988
make_sound gentle  'volume=0.55' 262 330 392 523
make_sound pulse   'volume=0.95' 988 988 740 988
