#!/bin/sh
# Собирает архив для загрузки в консоль Яндекс Игр / Playgama / CrazyGames.
set -e
cd "$(dirname "$0")"
node tests/puzzle.test.js > /dev/null
mkdir -p dist
rm -f dist/snowmen.zip
python3 -c "
import zipfile
files = ['index.html', 'style.css', 'levels.js', 'puzzle.js', 'platform.js', 'game.js']
with zipfile.ZipFile('dist/snowmen.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files: z.write(f)
"
echo "dist/snowmen.zip"
