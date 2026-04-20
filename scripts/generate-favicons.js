const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'favicon_io');
const pub = path.join(__dirname, '..', 'public');
const icons = path.join(pub, 'icons');

[ root, icons ].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

const pngBase = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
const iconNames = [
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'mstile-150x150.png'
];

function writePng(name) {
  fs.writeFileSync(path.join(root, name), Buffer.from(pngBase, 'base64'));
  fs.writeFileSync(path.join(pub, name), Buffer.from(pngBase, 'base64'));
  if (name.startsWith('android-chrome')) {
    fs.writeFileSync(path.join(icons, name), Buffer.from(pngBase, 'base64'));
  }
}

iconNames.forEach(writePng);

const ico = Buffer.from([
  0,0,1,0,1,0,16,16,0,0,1,0,32,0,44,0,22,0,0,0,40,0,0,0,1,0,0,0,2,0,0,0,1,0,32,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,255
]);
fs.writeFileSync(path.join(root, 'favicon.ico'), ico);
fs.writeFileSync(path.join(pub, 'favicon.ico'), ico);

const manifest = {
  name: 'Objetives App',
  short_name: 'Objetives',
  description: 'Sistema de seguimiento personal de hábitos, eventos y puntajes diarios.',
  start_url: '/',
  display: 'standalone',
  background_color: '#f8fafc',
  theme_color: '#334155',
  icons: [
    {
      src: '/icons/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/icons/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ]
};
fs.writeFileSync(path.join(root, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(pub, 'site.webmanifest'), JSON.stringify(manifest, null, 2));

const browserconfig = '<browserconfig><msapplication><tile><square150x150logo src="/mstile-150x150.png"/><TileColor>#334155</TileColor></tile></msapplication></browserconfig>';
fs.writeFileSync(path.join(root, 'browserconfig.xml'), browserconfig);
fs.writeFileSync(path.join(pub, 'browserconfig.xml'), browserconfig);
