const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const currDir = path.join(__dirname, 'assets', 'js');
const files = fs.readdirSync(currDir).filter(f => f.endsWith('.js'));

files.forEach(f => {
  try {
    execSync(`node --check "${path.join(currDir, f)}"`);
  } catch (e) {
    console.error(`Syntax error in ${f}:`, e.stderr.toString());
  }
});
console.log('Syntax check complete.');
