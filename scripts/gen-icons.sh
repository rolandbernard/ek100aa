#!/usr/bin/env bash
# This is a small script that generals all smaller icons from the main favicon.

SIZES=(16 32 48 64 128 180 256 1024)

for size in "${SIZES[@]}"; do
    magick -background none public/favicon.svg -resize "${size}x${size}" "public/appicon-${size}x${size}.png"
done

magick -background none public/favicon.svg -resize 32x32 public/favicon.png
magick -background none public/favicon.svg -define icon:auto-resize=16,32,48 public/favicon.ico

