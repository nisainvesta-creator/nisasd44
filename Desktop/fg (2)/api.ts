// FIX: Removed invalid `0x${string}` type from the import statement. This type is available from viem without explicit import.
import { createPublicClient, http, formatUnits } from 'viem';
import { bsc } from 'viem/chains';
import {
    poolDataContent,
    outputDetailsContent,
    faqDataContent,
    partnersContent,
    rawOutputDetails
} from './api-data';
import {
    PoolDataItem,
    OutputItem,
    FaqItem,
    Partner,
    SwapRecordData,
    WithdrawRecordData,
    IncomeRecordData,
    MiningSession,
    TeamData
} from './types';

// FastAPI base URL
const FASTAPI_BASE = 'http://localhost:8000/api/v1';

// --- Constants ---
const USDT_CONTRACT_ADDRESS_BSC = '0x55d398326f99059fF775485246999027B3197955';
const POOL_WALLET_ADDRESS = '0x059af157229bD723d958A44987168690dfC6dd96';

const publicClient = createPublicClient({
  chain: bsc,
  transport: http(),
});

// FIX: Updated ABI to a more modern format to improve type inference with viem.
const USDT_ABI_BALANCE_OF = [{
    "name": "balanceOf",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{"name": "_owner", "type": "address"}],
    "outputs": [{"name": "balance", "type": "uint256"}]
}] as const;


// --- Helpers ---
const apiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Home Page Data API ---
export const fetchPoolData = async (t: (key: string) => string): Promise<PoolDataItem[]> => {
    await apiDelay(500);
    const baseData = poolDataContent(t);

    const safeGetLocalStorage = (key: string, defaultValue: string) => {
        try {
            return localStorage.getItem(key) || defaultValue;
        } catch {
            return defaultValue;
        }
    };

    const safeSetLocalStorage = (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Ignore quota exceeded errors in this simulation
        }
    };
    
    // Add some random variation to simulate real-time updates with persistence
    const currentTotalOutput = parseFloat(safeGetLocalStorage('pool_totalOutput', '8600516.16'));
    const newTotalOutput = currentTotalOutput + (Math.random() * 10);
    safeSetLocalStorage('pool_totalOutput', newTotalOutput.toString());
    baseData[0].value = newTotalOutput.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    const currentValidNodes = parseInt(safeGetLocalStorage('pool_validNodes', '56668'), 10);
    const newValidNodes = currentValidNodes + Math.floor(Math.random() * 3 - 1);
    safeSetLocalStorage('pool_validNodes', newValidNodes.toString());
    baseData[1].value = newValidNodes.toLocaleString('en-US');

    const currentParticipants = parseInt(safeGetLocalStorage('pool_participants', '78087'), 10);
    const newParticipants = currentParticipants + Math.floor(Math.random() * 5 - 2);
    safeSetLocalStorage('pool_participants', newParticipants.toString());
    baseData[2].value = newParticipants.toLocaleString('en-US');

    const currentUserRevenue = parseFloat(safeGetLocalStorage('pool_userRevenue', '1896683446.79'));
    const newUserRevenue = currentUserRevenue + (Math.random() * 100);
    safeSetLocalStorage('pool_userRevenue', newUserRevenue.toString());
    baseData[3].value = newUserRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    return Promise.resolve(baseData);
};

export const fetchOutputDetails = async (): Promise<OutputItem[]> => {
    await apiDelay(700);
    const newAddress = `0x${[...Array(6)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}...${[...Array(6)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const newAmount = `${(Math.random() * 0.1).toFixed(8)} BNB`;
    const newEntry = { address: newAddress, amount: newAmount };

    let currentDetails: OutputItem[];
    try {
        const stored = localStorage.getItem('output_details');
        currentDetails = stored ? JSON.parse(stored) : outputDetailsContent;
    } catch {
        currentDetails = outputDetailsContent;
    }

    const updatedDetails = [newEntry, ...currentDetails];
    
    const cappedDetails = updatedDetails.slice(0, rawOutputDetails.length * 2);
    
    try {
        localStorage.setItem('output_details', JSON.stringify(cappedDetails));
    } catch {
        // Ignore potential storage errors
    }

    return Promise.resolve(cappedDetails);
};

export const fetchFaqData = async (t: (key: string) => string): Promise<FaqItem[]> => {
    await apiDelay(600);
    return Promise.resolve(faqDataContent(t));
};

export const fetchPartners = async (): Promise<Partner[]> => {
    await apiDelay(800);
    return Promise.resolve(partnersContent);
};

// --- Wallet/Contract Info API ---

// Helper: try multiple RPC endpoints with retries/backoff to avoid transient 504s
const RPC_FALLBACK_URLS = [
  // primary: rely on viem default client first
  // Add widely-available public BSC RPC endpoints as fallbacks
  'https://bsc-dataseed.binance.org/',
  'https://rpc.ankr.com/bsc',
  'https://rpc.ankrs.com/bsc',
];

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const fetchPoolWalletUsdtBalance = async (): Promise<number> => {
  // Attempt using the existing publicClient first (this may use the project's configured RPC)
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const balance = await publicClient.readContract({
        address: USDT_CONTRACT_ADDRESS_BSC,
        abi: USDT_ABI_BALANCE_OF,
        functionName: 'balanceOf',
        args: [POOL_WALLET_ADDRESS],
        // include empty authorizationList to satisfy typing in this project
        authorizationList: [],
      });
      return parseFloat(formatUnits(balance, 18));
    } catch (err) {
      // If final attempt, we'll fall through to try fallbacks
      if (attempt < maxAttempts - 1) {
        const delay = 200 * Math.pow(2, attempt);
        // debug log (kept as console.debug to avoid noisy errors)
        console.debug(`readContract attempt ${attempt + 1} failed, retrying in ${delay}ms`, err);
        await sleep(delay);
        continue;
      }
    }
  }

  // If primary client continues failing, try fallback RPC urls sequentially
  for (const url of RPC_FALLBACK_URLS) {
    try {
      const altClient = createPublicClient({ chain: bsc, transport: http(url) });
      const balance = await altClient.readContract({
        address: USDT_CONTRACT_ADDRESS_BSC,
        abi: USDT_ABI_BALANCE_OF,
        functionName: 'balanceOf',
        args: [POOL_WALLET_ADDRESS],
        authorizationList: [],
      });
      return parseFloat(formatUnits(balance, 18));
    } catch (err) {
      console.debug(`Fallback RPC ${url} failed:`, err);
      // small delay before trying next fallback
      await sleep(150);
      continue;
    }
  }

  // All attempts failed. Log a concise message and return 0 as a safe fallback.
  console.warn('All RPC attempts to fetch pool wallet USDT balance failed — returning 0');
  return 0;
};

// --- Record & Actions API ---

const mockSwapRecords: SwapRecordData[] = [];
const mockWithdrawalRecords: WithdrawRecordData[] = [];
const mockIncomeRecords: IncomeRecordData[] = [];

// Generic localStorage helpers
const getRecords = <T,>(key: string, walletAddress: string, fallback: T[]): T[] => {
    try {
        const fullKey = `${key}_${walletAddress}`;
        const data = localStorage.getItem(fullKey);
        return data ? JSON.parse(data) : fallback;
    } catch (error) {
        console.error(`Failed to get records for ${key}:`, error);
        return fallback;
    }
};

const addRecord = <T,>(key: string, walletAddress: string, newRecordData: Omit<T, 'id'>, fallback: T[]) => {
    const records = getRecords(key, walletAddress, fallback);
    const newRecord = { ...newRecordData, id: Date.now() } as T;
    records.unshift(newRecord);
    localStorage.setItem(`${key}_${walletAddress}`, JSON.stringify(records));
};

export const fetchSwapRecords = async (walletAddress: string): Promise<SwapRecordData[]> => {
    await apiDelay(800);
    return Promise.resolve(getRecords('swap_records', walletAddress, mockSwapRecords));
};

export const fetchWithdrawalRecords = async (walletAddress: string): Promise<WithdrawRecordData[]> => {
    await apiDelay(600);
    return Promise.resolve(getRecords('withdrawal_records', walletAddress, mockWithdrawalRecords));
};

export const performBnbToUsdtSwap = async (walletAddress: string, bnbAmount: number, usdtAmount: number): Promise<void> => {
    await apiDelay(1200);
    const newRecord: Omit<SwapRecordData, 'id'> = {
        date: new Date().toLocaleString(),
        fromAmount: bnbAmount,
        toAmount: usdtAmount,
        fromCurrency: 'BNB',
        toCurrency: 'USDT',
    };
    addRecord('swap_records', walletAddress, newRecord, mockSwapRecords);
    return Promise.resolve();
};

export const performUsdtToBnbSwap = async (walletAddress: string, usdtAmount: number, bnbAmount: number): Promise<void> => {
    await apiDelay(1200);
    const newRecord: Omit<SwapRecordData, 'id'> = {
        date: new Date().toLocaleString(),
        fromAmount: usdtAmount,
        toAmount: bnbAmount,
        fromCurrency: 'USDT',
        toCurrency: 'BNB',
    };
    addRecord('swap_records', walletAddress, newRecord, mockSwapRecords);
    return Promise.resolve();
};


export const performUsdtWithdrawal = async (walletAddress: string, usdtAmount: number): Promise<void> => {
    await apiDelay(1500);
    const newRecord: Omit<WithdrawRecordData, 'id'> = {
        date: new Date().toLocaleString(),
        amount: usdtAmount,
        status: 'Completed',
    };
    addRecord('withdrawal_records', walletAddress, newRecord, mockWithdrawalRecords);
    return Promise.resolve();
};

export const fetchIncomeRecords = async (walletAddress: string): Promise<IncomeRecordData[]> => {
    await apiDelay(400);
    return getRecords('income_records', walletAddress, mockIncomeRecords);
};

// --- Mining API ---

const getProfitRates = () => ({
    "24H": { dailyRate: 0.35 },
    "7D": { dailyRate: 1.1 },
    "30D": { dailyRate: 1.3 },
});

const calculateProfit = (amount: number, duration: string, seconds: number): number => {
    const profitRates = getProfitRates();
    const rate = profitRates[duration as keyof typeof profitRates];
    if (!rate) return 0;
    const profitPerSecond = (amount * (rate.dailyRate / 100)) / (24 * 60 * 60);
    return seconds * profitPerSecond;
};


export const startMiningSession = async (walletAddress: string, amount: number, duration: string, totalEarningsAtStart: number): Promise<{ success: boolean }> => {
    await apiDelay(1000); // Simulate network latency
    const session: MiningSession = {
        isActive: true,
        startTime: Date.now(),
        amount,
        duration,
        totalEarningsAtStart,
        completedTransactions: 0,
    };
    localStorage.setItem(`mining_session_${walletAddress}`, JSON.stringify(session));
    return { success: true };
};

export const stopMiningSession = async (walletAddress: string): Promise<{ sessionProfit: number }> => {
    await apiDelay(500);
    const sessionKey = `mining_session_${walletAddress}`;
    const sessionData = localStorage.getItem(sessionKey);
    if (!sessionData) {
        return { sessionProfit: 0 };
    }
    const session: MiningSession = JSON.parse(sessionData);
    const elapsedTimeInSeconds = Math.floor((Date.now() - session.startTime) / 1000);
    const totalSessionProfit = calculateProfit(session.amount, session.duration, elapsedTimeInSeconds);

    // Compute already credited profit based on completedTransactions
    const durationSecondsMap: Record<string, number> = { '24H': 24*3600, '7D': 7*24*3600, '30D': 30*24*3600 };
    const durationSeconds = durationSecondsMap[session.duration] || (24*3600);
    const totalPotentialProfit = calculateProfit(session.amount, session.duration, durationSeconds);
    const completed = session.completedTransactions || 0;
    const creditedSoFar = (completed / 4) * totalPotentialProfit;

    // Remaining profit is totalSessionProfit - creditedSoFar (but not negative)
    let remainingProfit = totalSessionProfit - creditedSoFar;
    if (remainingProfit < 0) remainingProfit = 0;

    localStorage.removeItem(sessionKey);

    if (remainingProfit > 0) {
        const newRecord: Omit<IncomeRecordData, 'id'> = {
            date: new Date().toLocaleString(),
            amount: remainingProfit,
        };
        addRecord('income_records', walletAddress, newRecord, mockIncomeRecords);
    }

    return { sessionProfit: remainingProfit };
};

export const getMiningStatus = async (walletAddress: string): Promise<MiningSession | null> => {
    await apiDelay(300);
    const sessionData = localStorage.getItem(`mining_session_${walletAddress}`);
    if (sessionData) {
        return JSON.parse(sessionData);
    }
    return null;
};

export const fetchTeamData = async (walletAddress: string): Promise<TeamData> => {
    await apiDelay(1200); // Simulate network latency
    if (!walletAddress) {
        return { totalTeamSize: 0, validMembers: 0, totalCommission: 0, members: [] };
    }

    // Use a simple hash of the address to generate mock data
    const addressHash = walletAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const totalTeamSize = addressHash % 20;
    const validMembers = Math.floor(totalTeamSize * (0.5 + (addressHash % 5) / 10));
    const totalCommission = (addressHash % 1000) / 1000 * 5;

    const members = Array.from({ length: Math.min(totalTeamSize, 10) }).map((_, i) => {
        const randomAddress = `0x${[...Array(4)].map(() => (addressHash + i * 100).toString(16).slice(-2)).join('')}...${[...Array(4)].map(() => (addressHash * (i + 1) * 2).toString(16).slice(-2)).join('')}`;
        const date = new Date(Date.now() - (addressHash % 30 + i) * 24 * 60 * 60 * 1000);
        return {
            address: randomAddress,
            registrationDate: date.toISOString().split('T')[0],
        };
    });

    return {
        totalTeamSize,
        validMembers,
        totalCommission,
        members,
    };
};

// New helper: returns aggregated pool stats used by PoolStats component
export const getPoolStats = async (): Promise<{ total_output_bnb: number; valid_nodes: number; participants: number; user_revenue_usdt: number }> => {
    await apiDelay(300);

    const safeGetNumber = (key: string, defaultValue: string) => {
        try {
            const v = localStorage.getItem(key);
            return v ? Number(v) : Number(defaultValue);
        } catch {
            return Number(defaultValue);
        }
    };

    const total_output_bnb = safeGetNumber('pool_totalOutput', '8600516.16');
    const valid_nodes = Math.floor(safeGetNumber('pool_validNodes', '56668'));
    const participants = Math.floor(safeGetNumber('pool_participants', '78087'));
    const user_revenue_usdt = safeGetNumber('pool_userRevenue', '1896683446.79');

    return { total_output_bnb, valid_nodes, participants, user_revenue_usdt };
};

// --- FastAPI Integration ---

// Helper function to make requests to FastAPI
const fastApiRequest = async (endpoint: string, options: RequestInit = {}, token?: string) => {
    const url = `${FASTAPI_BASE}${endpoint}`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Merge additional headers from options
    if (options.headers) {
        Object.assign(headers, options.headers);
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        headers,
        ...options,
    });

    if (!response.ok) {
        throw new Error(`FastAPI request failed: ${response.statusText}`);
    }

    return response.json();
};

// Example: Fetch users from FastAPI
export const fetchUsers = async (token?: string): Promise<any> => {
    try {
        return await fastApiRequest('/users/', {}, token);
    } catch (error) {
        console.error('Failed to fetch from FastAPI:', error);
        // Fallback to local data if FastAPI is unavailable
        return {
            data: [],
            status: 'success'
        };
    }
};

// Example: Create user via FastAPI
export const createUser = async (userData: { wallet_address: string; email?: string; username?: string }, token?: string): Promise<any> => {
    try {
        return await fastApiRequest('/users/', {
            method: 'POST',
            body: JSON.stringify(userData),
        }, token);
    } catch (error) {
        console.error('Failed to create user via FastAPI:', error);
        // Fallback behavior
        return {
            message: 'User created in fallback',
            data: userData,
            status: 'success'
        };
    }
};

// Example: Connect wallet via FastAPI
export const connectWallet = async (walletData: { user_id: number; wallet_address: string }, token?: string): Promise<any> => {
    try {
        return await fastApiRequest('/connect-wallet', {
            method: 'POST',
            body: JSON.stringify(walletData),
        }, token);
    } catch (error) {
        console.error('Failed to connect wallet via FastAPI:', error);
        return {
            message: 'Wallet connection failed',
            status: 'error'
        };
    }
};

// Example: Claim reward via FastAPI
export const claimReward = async (rewardData: { user_id: number; reward_amount: number; reward_type: string }, token?: string): Promise<any> => {
    try {
        return await fastApiRequest('/claim-reward', {
            method: 'POST',
            body: JSON.stringify(rewardData),
        }, token);
    } catch (error) {
        console.error('Failed to claim reward via FastAPI:', error);
        return {
            message: 'Reward claim failed',
            status: 'error'
        };
    }
};

// Example: Withdraw via FastAPI
export const withdrawFunds = async (withdrawalData: { user_id: number; amount_usd: number; wallet_address: string }, token?: string): Promise<any> => {
    try {
        return await fastApiRequest('/withdraw', {
            method: 'POST',
            body: JSON.stringify(withdrawalData),
        }, token);
    } catch (error) {
        console.error('Failed to withdraw via FastAPI:', error);
        return {
            message: 'Withdrawal failed',
            status: 'error'
        };
    }
};

// Example: Create deposit via FastAPI
export const updateUserBalance = async (userId: number, balance: string, token: string): Promise<any> => {
    try {
        const response = await fetch(`${FASTAPI_BASE}/admin/users/${userId}/balance`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ balance }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update balance: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('Failed to update user balance:', error);
        throw error;
    }
};

export const notifyUserReward = async (userId: number, rewardData: { reward_amount: string; reward_type: string; message: string }, token: string): Promise<any> => {
    try {
        const response = await fetch(`${FASTAPI_BASE}/admin/users/${userId}/notify-reward`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(rewardData),
        });

        if (!response.ok) {
            throw new Error(`Failed to send reward notification: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('Failed to send reward notification:', error);
        throw error;
    }
};

export const getAdminDashboardStats = async (token: string): Promise<any> => {
    try {
        const response = await fetch(`${FASTAPI_BASE}/admin/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('Failed to fetch admin dashboard stats:', error);
        throw error;
    }
};

export const getAllUsersAdmin = async (token: string, params?: { skip?: number; limit?: number; search?: string }): Promise<any> => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.skip) queryParams.append('skip', params.skip.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const response = await fetch(`${FASTAPI_BASE}/admin/users/?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('Failed to fetch admin users:', error);
        throw error;
    }
};

export const createDeposit = async (depositData: { wallet: string; amount_usd: number; tx_hash?: string }, token?: string): Promise<any> => {
    try {
        return await fastApiRequest('/deposits/', {
            method: 'POST',
            body: JSON.stringify(depositData),
        }, token);
    } catch (error) {
        console.error('Failed to create deposit via FastAPI:', error);
        return {
            message: 'Deposit creation failed',
            status: 'error'
        };
    }
};

export const addBalanceByWalletAddress = async (walletAddress: string, amount: number, token: string): Promise<any> => {
    try {
        const response = await fetch(`${FASTAPI_BASE}/admin/balance/by-address`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                wallet_address: walletAddress,
                amount: amount
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add balance: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('Failed to add balance by wallet address:', error);
        throw error;
    }
};
