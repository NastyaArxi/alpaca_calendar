#!/bin/sh
# Собирает архивы для площадок:
#   dist/gnome-gifts-vk.zip     — ВКонтакте (VK Bridge внутри архива)
#   dist/gnome-gifts-yandex.zip — Яндекс Игры (SDK подключается с /sdk.js)
set -e
cd "$(dirname "$0")"
node tests/engine.test.js > /dev/null
mkdir -p dist
rm -f dist/*.zip
python3 - <<'PY'
import zipfile
common = ['style.css', 'toys.js', 'engine.js', 'platform.js', 'game.js']
html = open('index.html', encoding='utf-8').read()
variants = {
    'yandex': (html, []),
    'vk': (html.replace('<script src="/sdk.js"></script>', '<script src="vendor/vk-bridge-3.0.2.min.js"></script>'),
           ['vendor/vk-bridge-3.0.2.min.js']),
}
for name, (page, extra) in variants.items():
    with zipfile.ZipFile(f'dist/gnome-gifts-{name}.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('index.html', page)
        for f in common + extra:
            z.write(f)
    print(f'dist/gnome-gifts-{name}.zip')
PY
