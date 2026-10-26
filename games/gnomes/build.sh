#!/bin/sh
# Собирает архив для загрузки в консоль Яндекс Игр / Playgama / CrazyGames.
set -e
cd "$(dirname "$0")"
node tests/engine.test.js > /dev/null
mkdir -p dist
rm -f dist/gnomes.zip
python3 -c "
import zipfile
files = ['index.html', 'style.css', 'pictures.js', 'engine.js', 'platform.js', 'game.js']
with zipfile.ZipFile('dist/gnomes.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files: z.write(f)
"
echo "dist/gnomes.zip"
