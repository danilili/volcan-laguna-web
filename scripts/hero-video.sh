#!/usr/bin/env bash
# Builds the Home hero loop from Bea's "This is Volcán Laguna 2025" reel.
# Usage: scripts/hero-video.sh "<path to reel .mp4>"
# Needs ffmpeg (brew install ffmpeg). Output goes to public/video/.
#
# Seven wide, calm shots (shot boundaries found with ffmpeg's scene filter),
# slowed to 80 % with motion interpolation, 0.3 s crossfades, no audio.
# H.264 only: VP9 came out larger than x264 on this footage, so no WebM.
set -euo pipefail

SRC="${1:?path to the source reel}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/video"
TMP="$(mktemp -d)"
mkdir -p "$OUT"

SPEED=0.8   # playback speed (0.8 = 20 % slower)
FADE=0.3    # crossfade seconds
# start:end in the source, in order of appearance.
SEGMENTS=(
  "0.000:1.126"     # lake panorama
  "1.126:1.877"     # group jumping off the dock
  "2.586:4.755"     # swimmer, sun on the water
  "6.089:7.007"     # aerial, the house and its terrace
  "14.723:15.807"   # the lagoon from above
  "17.476:18.393"   # group on the round terrace (the town plaza follows at 18.393)
  "21.313:22.272"   # the crater from the air
)

# Build the filter graph: trim → slow down → 1080p → interpolate, then xfade chain.
FILTER=$(python3 -I - "$SPEED" "$FADE" "${SEGMENTS[@]}" <<'PY'
import sys
speed = float(sys.argv[1]); fade = float(sys.argv[2]); segs = sys.argv[3:]
parts, durs = [], []
for i, s in enumerate(segs):
    a, b = map(float, s.split(":"))
    durs.append((b - a) / speed)
    parts.append(
        f"[0:v]trim=start={a}:end={b},setpts=(PTS-STARTPTS)/{speed},"
        f"hqdn3d=2:1.5:4:4,scale=1920:1080:flags=lanczos,"
        f"minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1[s{i}]"
    )
prev = "s0"; offset = 0.0
for i in range(1, len(segs)):
    offset += durs[i - 1] - fade
    out = "v" if i == len(segs) - 1 else f"x{i}"
    parts.append(f"[{prev}][s{i}]xfade=transition=fade:duration={fade}:offset={offset:.3f}[{out}]")
    prev = out
print(";".join(parts))
print(f"total {offset + durs[-1]:.2f}s", file=sys.stderr)
PY
)

echo "→ master (1080p, near-lossless)"
ffmpeg -v error -stats -i "$SRC" -filter_complex "$FILTER" -map "[v]" -an \
  -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 24 -y "$TMP/master.mp4"

encode() { # name width maxrate_kbps
  local name=$1 w=$2 h=$(( $2 * 9 / 16 )) rate=$3
  echo "→ $name ${w}x${h} mp4 (≤ ${rate}k)"
  ffmpeg -v error -i "$TMP/master.mp4" -vf "scale=${w}:${h}" -an \
    -c:v libx264 -preset slow -crf 27 -maxrate "${rate}k" -bufsize "$(( rate * 2 ))k" \
    -profile:v high -level 4.1 -pix_fmt yuv420p -tune film \
    -g 48 -keyint_min 48 -movflags +faststart -y "$OUT/$name.mp4"
}
encode hero-1080 1920 2800
encode hero-720 1280 1400

echo "→ poster"
ffmpeg -v error -ss 0.4 -i "$TMP/master.mp4" -frames:v 1 -q:v 4 -y "$OUT/hero-poster.jpg"

rm -rf "$TMP"
ls -la "$OUT"
