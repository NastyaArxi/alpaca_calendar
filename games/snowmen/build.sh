#!/bin/sh
# Собирает архивы для площадок:
#   dist/snowmen-vk.zip     — ВКонтакте (VK Bridge внутри архива)
#   dist/snowmen-yandex.zip — Яндекс Игры (SDK подключается с /sdk.js)
set -e
cd "$(dirname "$0")"
node tests/puzzle.test.js > /dev/null
mkdir -p dist
rm -f dist/*.zip
python3 - <<'PY'
import zipfile
common = ['style.css', 'levels.js', 'calendar-levels.js', 'figures.js', 'calendar.js', 'puzzle.js', 'platform.js', 'game.js']
html = open('index.html', encoding='utf-8').read()
variants = {
    'yandex': (html, []),
    'vk': (html.replace('<script src="/sdk.js"></script>', '<script src="vendor/vk-bridge-3.0.2.min.js"></script>'),
           ['vendor/vk-bridge-3.0.2.min.js']),
}
for name, (page, extra) in variants.items():
    with zipfile.ZipFile(f'dist/snowmen-{name}.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('index.html', page)
        for f in common + extra:
            z.write(f)
    print(f'dist/snowmen-{name}.zip')
PY
