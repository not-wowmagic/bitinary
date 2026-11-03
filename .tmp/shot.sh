#!/bin/sh
W=${4:-390}; H=${5:-844}
case "$2" in *\?*) SEP='&';; *) SEP='?';; esac
D=/tmp/crd-$1-$$
timeout 40 chromium --user-data-dir=$D --headless=new --no-sandbox --disable-gpu --hide-scrollbars --window-size=$W,$H --virtual-time-budget=${VT:-4000} --screenshot=$D.png "http://localhost:3000$2${SEP}embed=1&theme=$3" >/dev/null 2>&1
[ -f $D.png ] && magick $D.png -resize ${MAXW:-800}x -quality 72 /workspaces/default/code/.tmp/$1.jpg
rm -rf $D $D.png
