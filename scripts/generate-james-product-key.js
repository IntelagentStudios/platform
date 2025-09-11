// Script to generate a proper product key for James
// Run with: node scripts/generate-james-product-key.js

const crypto = require('crypto');

function generateProductKey() {
  // Generate a unique product key for James
  // Format: chat_[identifier]_[random]
  const identifier = 'jtest';
  const random = crypto.randomBytes(4).toString('hex');
  return `chat_${identifier}_${random}`;
}

const newProductKey = generateProductKey();
console.log('Generated product key for James (INTL-NW1S-QANW-2025):');
console.log(newProductKey);
console.log('\nThis should replace the placeholder "chat_james_nw1s_2025" in the code.');
console.log('\nTo update the database, run:');
console.log(`UPDATE product_keys SET product_key = '${newProductKey}' WHERE license_key = 'INTL-NW1S-QANW-2025' AND product = 'chatbot';`);