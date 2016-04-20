const fs = require('fs');
const pkg = require('../package.json');
const bower = require('../bower.json');

bower.version = pkg.version;
fs.writeFile('./bower.json', JSON.stringify(bower, null, 2));
