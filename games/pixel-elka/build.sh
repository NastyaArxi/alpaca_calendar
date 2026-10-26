#!/bin/sh
# Собирает архив для загрузки в консоль Яндекс Игр / Playgama / CrazyGames.
set -e
cd "$(dirname "$0")"
node tests/levelgen.test.js
mkdir -p dist
rm -f dist/pixel-elka.zip
python3 -c "
import zipfile
files = ['index.html', 'style.css', 'pictures.js', 'levelgen.js', 'platform.js', 'game.js']
with zipfile.ZipFile('dist/pixel-elka.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files: z.write(f)
"
echo "dist/pixel-elka.zip"
