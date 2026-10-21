#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
web_output_dir="$project_dir/public"
android_output_dir="$project_dir/android/app/src/main/res/raw"
temporary_dir="$(mktemp -d)"
trap 'rm -rf -- "$temporary_dir"' EXIT
mkdir -p "$web_output_dir" "$android_output_dir"

make_sound() {
  local name="$1"
  local volume="$2"
  shift 2
  local inputs=()
  local filters=""
  local labels=""
  local index=0

  for frequency in "$@"; do
    inputs+=( -f lavfi -i "aevalsrc=0.48*sin(2*PI*$frequency*t)+0.14*sin(2*PI*$((frequency * 2))*t)+0.04*sin(2*PI*$((frequency * 3))*t):s=44100:d=0.58" )
    filters+="[$index:a]afade=t=in:st=0:d=0.035,afade=t=out:st=0.43:d=0.15,apad=pad_dur=0.08,atrim=0:0.66[n$index];"
    labels+="[n$index]"
    index=$((index + 1))
  done

  ffmpeg -y -loglevel error "${inputs[@]}" \
    -filter_complex "${filters}${labels}concat=n=$index:v=0:a=1,aecho=0.8:0.45:90|180:0.16|0.07,volume=$volume,alimiter=limit=0.92[melody]" \
    -map '[melody]' -c:a pcm_s16le "$temporary_dir/$name.wav"

  ffmpeg -y -loglevel error -stream_loop 3 -i "$temporary_dir/$name.wav" \
    -t 16 -ar 44100 -ac 1 -c:a libmp3lame -b:a 96k "$web_output_dir/$name.mp3"
  cp "$web_output_dir/$name.mp3" "$android_output_dir/$name.mp3"
}

make_sound alarm_dawn_v3    0.64 262 330 392 523 392 330 294 392
make_sound alarm_classic_v3 0.88 880 988 880 988 784 988 880 988
make_sound alarm_digital_v3 0.78 659 659 880 659 988 988 880 659
make_sound alarm_gentle_v3  0.55 330 392 494 587 494 392 330 294
make_sound alarm_pulse_v3   0.94 988 740 988 740 1175 880 1175 880
