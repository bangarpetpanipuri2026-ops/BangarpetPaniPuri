// replace-firebase-config.js
// Node ≥12
const fs   = require('fs');
const path = require('path');

const root = process.cwd();

const files = [
  path.join(root, 'script.js'),
  path.join(root, 'admin', 'app.js')
];

const replacements = {
  '__FIREBASE_API_KEY__': process.env.FIREBASE_API_KEY || '',
  '__FIREBASE_AUTH_DOMAIN__': process.env.FIREBASE_AUTH_DOMAIN || '',
  '__FIREBASE_PROJECT_ID__': process.env.FIREBASE_PROJECT_ID || '',
  '__FIREBASE_STORAGE_BUCKET__': process.env.FIREBASE_STORAGE_BUCKET || '',
  '__FIREBASE_MESSAGING_SENDER_ID__': process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  '__FIREBASE_APP_ID__': process.env.FIREBASE_APP_ID || ''
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  Object.entries(replacements).forEach(([token, value]) => {
    content = content.split(token).join(value);
  });

  // Write to a temporary "dist" folder that Pages will publish
  const outDir = path.join(root, 'dist');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outPath = path.join(outDir, path.relative(root, file));
  const outDirPath = path.dirname(outPath);
  if (!fs.existsSync(outDirPath)) fs.mkdirSync(outDirPath, { recursive: true });
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`✅ Processed ${file} → ${outPath}`);
});