const bcrypt = require('bcryptjs');

const password = 'admin';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
