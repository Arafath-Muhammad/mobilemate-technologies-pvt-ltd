const fs = require('fs');
const path = require('path');

const projectDir = 'd:\\MobileMate POS';
const indexHtmlPath = path.join(projectDir, 'index.html');
const jsDir = path.join(projectDir, 'assets', 'js');

const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// Find all onclick handlers
const onclickRegex = /onclick="([^"(]+)/g;
let match;
const clickFunctions = new Set();
while ((match = onclickRegex.exec(htmlContent)) !== null) {
    clickFunctions.add(match[1].trim());
}

console.log(`Found ${clickFunctions.size} unique onclick functions in index.html`);

// Find all function definitions in JS files
const definedFunctions = new Set();
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

jsFiles.forEach(file => {
    const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
    const funcRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
    let fMatch;
    while ((fMatch = funcRegex.exec(content)) !== null) {
        definedFunctions.add(fMatch[1]);
    }

    // Also check for window.func = ... or const func = () => ...
    const arrowRegex = /(?:const|let|var|window)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(/g;
    while ((fMatch = arrowRegex.exec(content)) !== null) {
        definedFunctions.add(fMatch[1]);
    }
});

console.log(`Found ${definedFunctions.size} defined functions in JS files`);

// Check for missing functions
const missing = [];
clickFunctions.forEach(func => {
    if (!definedFunctions.has(func) &&
        !['window.scrollTo', 'window.print', 'window.close', 'closeWarrantyDetailModal', 'switchPOSItemTab', 'gisLoaded', 'gapiLoaded', 'adjustLayoutForDPI', 'handleLogin', 'togglePasswordVisibility', 'gisLoaded', 'gapiLoaded'].includes(func)) {
        // Some might be defined in index.html <script> blocks
        const scriptMatch = new RegExp(`function\\s+${func}\\s*\\(`).test(htmlContent) ||
            new RegExp(`const\\s+${func}\\s*=`).test(htmlContent);
        if (!scriptMatch) {
            missing.push(func);
        }
    }
});

if (missing.length > 0) {
    console.log('--- MISSING FUNCTIONS ---');
    missing.forEach(m => console.log(m));
} else {
    console.log('No missing onclick functions found.');
}
