#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(process.cwd(), '.cli-cache');
const OFFLINE_FILE = path.join(CACHE_DIR, 'pending-balance-updates.json');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || null;
const TIMEOUT = parseInt(process.env.BACKEND_TIMEOUT || '5000', 10);

class BalanceCLI {
  constructor() {
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  getPendingUpdates() {
    if (!fs.existsSync(OFFLINE_FILE)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(OFFLINE_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  savePendingUpdates(updates) {
    fs.writeFileSync(OFFLINE_FILE, JSON.stringify(updates, null, 2));
  }

  addPendingUpdate(walletAddress, amount, status = 'pending') {
    const updates = this.getPendingUpdates();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    updates.push({
      id,
      walletAddress: walletAddress.toLowerCase(),
      amount,
      status,
      timestamp: new Date().toISOString(),
      retries: 0
    });
    this.savePendingUpdates(updates);
    return id;
  }

  updatePendingStatus(id, status) {
    const updates = this.getPendingUpdates();
    const update = updates.find(u => u.id === id);
    if (update) {
      update.status = status;
      this.savePendingUpdates(updates);
    }
  }

  makeRequest(method, path, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BACKEND_URL);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const headers = {
        'Content-Type': 'application/json',
      };

      if (ADMIN_TOKEN) {
        headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
      }

      const options = {
        method,
        headers,
        timeout: TIMEOUT
      };

      const req = client.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${TIMEOUT}ms`));
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async getAdminToken(walletAddress) {
    try {
      const response = await this.makeRequest('POST', '/api/v1/auth/login', {
        wallet_address: walletAddress
      });

      if (response.status === 200) {
        return response.data.access_token;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async tryBackendAddBalance(walletAddress, amount) {
    try {
      let token = ADMIN_TOKEN;

      if (!token) {
        console.log(`   🔑 Authenticating with wallet ${walletAddress}...`);
        token = await this.getAdminToken(walletAddress);

        if (!token) {
          return { success: false, error: 'Failed to authenticate with backend' };
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const url = new URL('/api/v1/admin/balance/by-address', BACKEND_URL);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        method: 'POST',
        headers,
        timeout: TIMEOUT
      };

      const response = await new Promise((resolve, reject) => {
        const req = client.request(url, options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const parsed = body ? JSON.parse(body) : {};
              resolve({ status: res.statusCode, data: parsed });
            } catch {
              resolve({ status: res.statusCode, data: body });
            }
          });
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`Request timeout after ${TIMEOUT}ms`));
        });

        req.on('error', reject);
        req.write(JSON.stringify({
          wallet_address: walletAddress,
          amount: amount
        }));
        req.end();
      });

      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data };
      } else if (response.status === 404) {
        return { success: false, error: `User with wallet address ${walletAddress} not found` };
      } else if (response.status === 403) {
        return { success: false, error: `Admin access required. The wallet ${walletAddress} does not have admin privileges.` };
      } else {
        return { success: false, error: `Backend error: ${response.data?.detail || response.data?.message || `HTTP ${response.status}`}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async tryBackendSetBalance(walletAddress, amount) {
    try {
      let token = ADMIN_TOKEN;

      if (!token) {
        console.log(`   🔑 Authenticating with wallet ${walletAddress}...`);
        token = await this.getAdminToken(walletAddress);

        if (!token) {
          return { success: false, error: 'Failed to authenticate with backend' };
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // First get the user to find their ID
      const userUrl = new URL('/api/v1/admin/users/', BACKEND_URL);
      userUrl.searchParams.set('search', walletAddress);
      const isHttps = userUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const userResponse = await new Promise((resolve, reject) => {
        const req = client.request(userUrl, {
          method: 'GET',
          headers,
          timeout: TIMEOUT
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const parsed = body ? JSON.parse(body) : {};
              resolve({ status: res.statusCode, data: parsed });
            } catch {
              resolve({ status: res.statusCode, data: body });
            }
          });
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`Request timeout after ${TIMEOUT}ms`));
        });

        req.on('error', reject);
        req.end();
      });

      if (userResponse.status !== 200 || !userResponse.data || userResponse.data.length === 0) {
        return { success: false, error: `User with wallet address ${walletAddress} not found` };
      }

      const user = userResponse.data.find(u => u.wallet_address.toLowerCase() === walletAddress.toLowerCase());
      if (!user) {
        return { success: false, error: `User with wallet address ${walletAddress} not found` };
      }

      // Now set the balance using the user ID
      const balanceUrl = new URL(`/api/v1/admin/users/${user.id}/balance`, BACKEND_URL);
      const balanceResponse = await new Promise((resolve, reject) => {
        const req = client.request(balanceUrl, {
          method: 'PUT',
          headers,
          timeout: TIMEOUT
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const parsed = body ? JSON.parse(body) : {};
              resolve({ status: res.statusCode, data: parsed });
            } catch {
              resolve({ status: res.statusCode, data: body });
            }
          });
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`Request timeout after ${TIMEOUT}ms`));
        });

        req.on('error', reject);
        req.write(JSON.stringify({
          balance: amount
        }));
        req.end();
      });

      if (balanceResponse.status === 200) {
        return { success: true, data: {
          user_id: user.id,
          wallet_address: user.wallet_address,
          new_balance: amount,
          previous_balance: user.wallet_balance
        }};
      } else if (balanceResponse.status === 404) {
        return { success: false, error: `User not found` };
      } else if (balanceResponse.status === 403) {
        return { success: false, error: `Admin access required. The wallet ${walletAddress} does not have admin privileges.` };
      } else {
        return { success: false, error: `Backend error: ${balanceResponse.data?.detail || balanceResponse.data?.message || `HTTP ${balanceResponse.status}`}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addBalance(walletAddress, amount) {
    const normalized = walletAddress.toLowerCase();
    console.log(`\n📊 Adding balance: $${amount} to ${normalized}`);

    const backendResult = await this.tryBackendAddBalance(normalized, amount);

    if (backendResult.success) {
      console.log('✅ Success! Balance added via backend.');
      console.log(`   User ID: ${backendResult.data.user_id}`);
      console.log(`   New Balance: $${backendResult.data.new_balance}`);
      return { success: true, method: 'backend', data: backendResult.data };
    } else {
      console.log(`⚠️  Backend unavailable: ${backendResult.error}`);
      console.log(`   Saving offline for later sync...`);

      const id = this.addPendingUpdate(normalized, amount, 'offline');
      console.log(`✅ Stored offline. ID: ${id}`);
      console.log(`   Run 'npm run cli -- sync' to sync when backend is available.`);

      return { success: true, method: 'offline', id, data: { wallet_address: normalized, amount_added: amount } };
    }
  }

  async setBalance(walletAddress, amount) {
    const normalized = walletAddress.toLowerCase();
    console.log(`\n📊 Setting balance: $${amount} for ${normalized}`);

    const backendResult = await this.tryBackendSetBalance(normalized, amount);

    if (backendResult.success) {
      console.log('✅ Success! Balance set via backend.');
      console.log(`   User ID: ${backendResult.data.user_id}`);
      console.log(`   New Balance: $${backendResult.data.new_balance}`);
      return { success: true, method: 'backend', data: backendResult.data };
    } else {
      console.log(`⚠️  Backend unavailable: ${backendResult.error}`);
      console.log(`   Cannot set balance offline - requires backend connection.`);

      return { success: false, method: 'error', error: backendResult.error };
    }
  }

  async sync() {
    const pending = this.getPendingUpdates().filter(u => u.status === 'offline');
    
    if (pending.length === 0) {
      console.log('✅ No pending updates to sync.');
      return;
    }

    console.log(`\n🔄 Syncing ${pending.length} pending update(s)...`);
    let synced = 0;
    let failed = 0;

    for (const update of pending) {
      const result = await this.tryBackendAddBalance(update.walletAddress, update.amount);
      
      if (result.success) {
        this.updatePendingStatus(update.id, 'synced');
        console.log(`✅ Synced: ${update.walletAddress} +$${update.amount}`);
        synced++;
      } else {
        console.log(`❌ Failed: ${update.walletAddress} - ${result.error}`);
        failed++;
      }
    }

    console.log(`\n📈 Sync complete: ${synced} synced, ${failed} failed.`);
  }

  listPending() {
    const pending = this.getPendingUpdates();
    
    if (pending.length === 0) {
      console.log('\n✅ No pending updates.');
      return;
    }

    console.log('\n📋 Pending Balance Updates:');
    console.log('─'.repeat(80));
    
    for (const update of pending) {
      const status = update.status === 'synced' ? '✅' : '⏳';
      console.log(`${status} ${update.id.substring(0, 20)}... | ${update.walletAddress} | +$${update.amount} | ${update.status}`);
    }
    console.log('─'.repeat(80));
  }

  async setupAdminFromDatabase(walletAddress) {
    console.log(`\n🔧 Setting up admin for ${walletAddress.toLowerCase()}...`);
    console.log(`⚠️  Direct database setup not available via CLI.`);
    console.log(`\nTo grant admin access, use one of these methods:\n`);
    console.log(`1. Direct database (SQLite):`);
    console.log(`   sqlite3 backend/fastapi/test.db`);
    console.log(`   UPDATE users SET is_admin=1 WHERE wallet_address='${walletAddress.toLowerCase()}';`);
    console.log(`\n2. Python script:`);
    console.log(`   cd backend/fastapi && python setup_admin.py ${walletAddress}`);
    console.log(`\n3. FastAPI admin endpoint (if you already have an admin token):`);
    console.log(`   ADMIN_TOKEN=<token> npm run cli -- add ${walletAddress} 0`);
  }

  showHelp() {
    console.log(`
Usage: npm run cli -- [command] [options]

Commands:
  add <address> <amount>    Add balance to wallet address
  set <address> <amount>    Set balance for wallet address (replaces current balance)
  sync                      Sync pending offline updates with backend
  list                      List pending updates
  admin <address>           Show instructions to grant admin access
  help                      Show this help message

Examples:
  npm run cli -- add 0xd27baddfc09d511305deef8aaa29d2a884f861a3 20000
  npm run cli -- set 0xd27baddfc09d511305deef8aaa29d2a884f861a3 50000
  npm run cli -- sync
  npm run cli -- list
  npm run cli -- admin 0xd27baddfc09d511305deef8aaa29d2a884f861a3

Environment Variables:
  ADMIN_TOKEN              Bearer token for admin API (optional)
  BACKEND_URL              Backend API URL (default: http://localhost:8000)
  BACKEND_TIMEOUT          Request timeout in ms (default: 5000)
    `);
  }
}

async function main() {
  const cli = new BalanceCLI();
  const [, , command, ...args] = process.argv;

  if (!command || command === 'help') {
    cli.showHelp();
    process.exit(0);
  }

  if (command === 'add') {
    if (args.length < 2) {
      console.error('❌ Error: add command requires <address> and <amount>');
      console.error('   Usage: npm run cli -- add <address> <amount>');
      process.exit(1);
    }
    const [address, amountStr] = args;
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      console.error('❌ Error: amount must be a positive number');
      process.exit(1);
    }

    if (!address.match(/^0x[a-fA-F0-9]{40}$/i)) {
      console.error('❌ Error: invalid wallet address format (must be 0x followed by 40 hex characters)');
      process.exit(1);
    }

    await cli.addBalance(address, amount);
  } else if (command === 'set') {
    if (args.length < 2) {
      console.error('❌ Error: set command requires <address> and <amount>');
      console.error('   Usage: npm run cli -- set <address> <amount>');
      process.exit(1);
    }
    const [address, amountStr] = args;
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount < 0) {
      console.error('❌ Error: amount must be a non-negative number');
      process.exit(1);
    }

    if (!address.match(/^0x[a-fA-F0-9]{40}$/i)) {
      console.error('❌ Error: invalid wallet address format (must be 0x followed by 40 hex characters)');
      process.exit(1);
    }

    await cli.setBalance(address, amount);
  } else if (command === 'sync') {
    await cli.sync();
  } else if (command === 'list') {
    cli.listPending();
  } else if (command === 'admin') {
    if (args.length < 1) {
      console.error('❌ Error: admin command requires <address>');
      console.error('   Usage: npm run cli -- admin <address>');
      process.exit(1);
    }
    const [address] = args;

    if (!address.match(/^0x[a-fA-F0-9]{40}$/i)) {
      console.error('❌ Error: invalid wallet address format (must be 0x followed by 40 hex characters)');
      process.exit(1);
    }

    await cli.setupAdminFromDatabase(address);
  } else {
    console.error(`❌ Unknown command: ${command}`);
    cli.showHelp();
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
