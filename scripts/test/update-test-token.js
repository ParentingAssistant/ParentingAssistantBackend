#!/usr/bin/env node

/**
 * This script updates the test-production.js file with a new Firebase token.
 * It takes the token as a command-line argument.
 * 
 * Usage: node update-test-token.js <firebase-token>
 */

const fs = require('fs');
const path = require('path');

// Get the token from command-line arguments
const token = process.argv[2];

if (!token) {
  console.error('❌ No token provided');
  console.error('Usage: node update-test-token.js <firebase-token>');
  process.exit(1);
}

// Path to the test file
const testFilePath = path.join(__dirname, 'test-production.js');

// Read the test file
try {
  let content = fs.readFileSync(testFilePath, 'utf8');
  
  // Replace the token
  content = content.replace(
    /const FIREBASE_TOKEN = ['"].*['"]/,
    `const FIREBASE_TOKEN = '${token}'`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(testFilePath, content, 'utf8');
  
  console.log('✅ Token updated successfully in test-production.js');
} catch (error) {
  console.error('❌ Error updating token:', error);
  process.exit(1);
} 