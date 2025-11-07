import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'dev-telegram-api',
          configureServer(server) {
            // Add a lightweight /api/telegram endpoint for the dev server.
            server.middlewares.use(async (req, res, next) => {
              try {
                if (req.url?.startsWith('/api/telegram') && req.method === 'POST') {
                  let body = '';
                  req.on('data', (chunk) => (body += chunk));
                  req.on('end', async () => {
                    try {
                      const payload = body ? JSON.parse(body) : {};
                      const botToken = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
                      const chatId = process.env.TELEGRAM_CHAT_ID || env.TELEGRAM_CHAT_ID || payload.chat_id;

                      if (!botToken) {
                        res.statusCode = 500;
                        res.setHeader('content-type', 'application/json');
                        res.end(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured on server.' }));
                        return;
                      }

                      if (!chatId) {
                        res.statusCode = 400;
                        res.setHeader('content-type', 'application/json');
                        res.end(JSON.stringify({ error: 'CHAT_ID not provided. Set TELEGRAM_CHAT_ID env or include chat_id in the request body.' }));
                        return;
                      }

                      const type = payload.type || 'message';
                      let text = '';
                      const wallet = payload.wallet || payload.from || '';

                      if (type === 'deposit') {
                        const amountUsd = payload.amountUsd ?? payload.amount;
                        const ethAmount = payload.ethAmount;
                        const txHash = payload.txHash;
                        text = `New deposit\nWallet: ${wallet || 'unknown'}\nAmount (USD): ${amountUsd ?? 'N/A'}\nAmount (ETH): ${ethAmount ?? 'N/A'}${txHash ? `\nTx: https://etherscan.io/tx/${txHash}` : ''}`;
                      } else if (type === 'mining') {
                        text = `Mining activity\nWallet: ${wallet || 'unknown'}\nMessage: ${payload.message || ''}${payload.amount ? `\nAmount: ${payload.amount}` : ''}`;
                      } else if (type === 'rewards') {
                        text = `Rewards\nWallet: ${wallet || 'unknown'}\nAmount: ${payload.amount ?? 'N/A'}\n${payload.message ?? ''}`;
                      } else {
                        text = payload.message || JSON.stringify(payload);
                      }

                      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text }),
                      });

                      const json = await tgRes.json();
                      res.statusCode = 200;
                      res.setHeader('content-type', 'application/json');
                      res.end(JSON.stringify({ ok: true, result: json }));
                    } catch (err) {
                      res.statusCode = 500;
                      res.setHeader('content-type', 'application/json');
                      res.end(JSON.stringify({ error: String(err) }));
                    }
                  });
                  return;
                }
              } catch (e) {
                console.error('dev-telegram-api middleware error', e);
              }
              next();
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        exclude: [
          '@base-org/account',
          '@walletconnect/ethereum-provider'
        ],
        include: ['react', 'react-dom']
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              wagmi: ['wagmi', '@wagmi/core', 'viem'],
              appkit: ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
              query: ['@tanstack/react-query']
            }
          }
        },
        chunkSizeWarningLimit: 1000
      }
    };
});
