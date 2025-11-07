#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(process.cwd(), 'backend/fastapi/test.db');

function setupAdmin(walletAddress) {
  try {
    const db = new Database(DB_PATH);
    
    // Ensure tables exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address VARCHAR(128) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        username VARCHAR(100) UNIQUE,
        is_active BOOLEAN DEFAULT 1,
        is_admin BOOLEAN DEFAULT 0,
        wallet_connected BOOLEAN DEFAULT 0,
        last_wallet_connection DATETIME,
        wallet_balance VARCHAR(100) DEFAULT '0',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS deposits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet VARCHAR(128) NOT NULL,
        amount_usd FLOAT NOT NULL,
        eth_amount FLOAT,
        tx_hash VARCHAR(255),
        metadata TEXT,
        confirmed BOOLEAN DEFAULT 0,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    const normalizedAddress = walletAddress.toLowerCase();
    
    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(normalizedAddress);
    
    if (existingUser) {
      const stmt = db.prepare('UPDATE users SET is_admin = 1, is_active = 1 WHERE wallet_address = ?');
      stmt.run(normalizedAddress);
      console.log(`✅ Admin status granted to existing user: ${normalizedAddress}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Balance: $${existingUser.wallet_balance}`);
    } else {
      const stmt = db.prepare(`
        INSERT INTO users (wallet_address, is_admin, is_active, wallet_balance) 
        VALUES (?, 1, 1, '0')
      `);
      const result = stmt.run(normalizedAddress);
      console.log(`✅ Created new admin user: ${normalizedAddress}`);
      console.log(`   ID: ${result.lastInsertRowid}`);
    }
    
    db.close();
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

const walletAddress = process.argv[2];

if (!walletAddress) {
  console.error('Usage: node cli/setup-admin-db.js <wallet_address>');
  console.error('Example: node cli/setup-admin-db.js 0xd27baddfc09d511305deef8aaa29d2a884f861a3');
  process.exit(1);
}

if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
  console.error('❌ Invalid wallet address format');
  process.exit(1);
}

const success = setupAdmin(walletAddress);
process.exit(success ? 0 : 1);

export { setupAdmin };
