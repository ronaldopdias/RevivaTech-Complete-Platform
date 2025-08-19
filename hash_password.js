const crypto = require('crypto');

// Better Auth uses scrypt for password hashing
// Let's create a scrypt hash for the password 'admin123'

const password = 'admin123';
const salt = crypto.randomBytes(32);

// Generate scrypt hash (Better Auth compatible)
crypto.scrypt(password, salt, 64, (err, derivedKey) => {
  if (err) throw err;
  
  // Format: algorithm$salt$hash (base64 encoded)
  const saltBase64 = salt.toString('base64');
  const hashBase64 = derivedKey.toString('base64');
  const scryptHash = `scrypt$${saltBase64}$${hashBase64}`;
  
  console.log('Scrypt hash for admin123:', scryptHash);
  
  // Also create in a format that might be more compatible with Better Auth
  const simpleScrypt = `$scrypt$${saltBase64}$${hashBase64}`;
  console.log('Alternative format:', simpleScrypt);
});