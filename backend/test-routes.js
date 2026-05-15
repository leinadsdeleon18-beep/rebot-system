const fs = require('fs');
const path = require('path');

const routesDir = './src/routes';
const files = fs.readdirSync(routesDir);

console.log('Checking route files...\n');

files.forEach(file => {
  if (file.endsWith('.js')) {
    try {
      const route = require(path.join(__dirname, routesDir, file));
      console.log(`✅ ${file} - exports: ${typeof route}`);
      if (typeof route !== 'function' && typeof route !== 'object') {
        console.log(`   ❌ WARNING: ${file} exports ${typeof route}, expected function/router`);
      }
    } catch (error) {
      console.log(`❌ ${file} - ERROR: ${error.message}`);
    }
  }
});