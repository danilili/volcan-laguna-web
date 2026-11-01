#!/usr/bin/env bash
# Compresses Bea's Casa Santuario walkthrough (4K, ~56 s, with audio and
# on-screen captions) for the house page player.
# Usage: scripts/santuario-video.sh "<path to CASA SANTUARIO.mp4>"
# Needs ffmpeg (brew install ffmpeg). Output goes to public/video/ (gitignored):
# the mp4 is uploaded to Vercel Blob by hand, never committed.
#
# 1080p H.264 at CRF 24 capped at 3.8 Mbps (target 20–30 MB), AAC 128k,
# faststart so the browser can start playing before the whole file arrives.
# The source has letterbox bars baked in (54 px top/bottom at 1080p, found
# with cropdetect), so the output is 1920x972 (~1.98:1) with no black bars;
# the player uses the same aspect ratio.
# Poster: the lake view at ~21 s.
set -euo pipefail

SRC="${1:?path to the source video}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/video"
mkdir -p "$OUT"

VF="scale=1920:1080:flags=lanczos,crop=1920:972:0:54"

echo "→ santuario-1080 1920x972 mp4 + aac"
ffmpeg -v error -stats -i "$SRC" \
  -vf "$VF" \
  -c:v libx264 -preset slow -crf 24 -maxrate 3800k -bufsize 7600k \
  -profile:v high -level 4.1 -pix_fmt yuv420p -tune film \
  -g 48 -keyint_min 48 \
  -c:a aac -b:a 128k -ac 2 \
  -movflags +faststart -y "$OUT/santuario-1080.mp4"

echo "→ poster (lake view, 21 s)"
ffmpeg -v error -ss 21 -i "$SRC" -frames:v 1 -vf "$VF" -q:v 4 -y "$OUT/santuario-poster.jpg"

ls -la "$OUT"/santuario-*
