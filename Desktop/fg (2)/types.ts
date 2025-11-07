export interface PoolDataItem {
  label: string;
  value: string;
  currency?: string;
}

export interface OutputItem {
  address: string;
  amount: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Partner {
  name: string;
  logo: string;
}

export type Page = 'Home' | 'Withdrawal' | 'Account' | 'Certificate' | 'Record' | 'Team' | 'Trading' | 'Admin';

export type RecordTab = 'swap' | 'withdraw' | 'income';

export interface SwapRecordData {
  id: number;
  date: string;
  fromAmount: number;
  toAmount: number;
  fromCurrency: 'BNB' | 'USDT';
  toCurrency: 'USDT' | 'BNB';
}

export interface WithdrawRecordData {
  id: number;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface IncomeRecordData {
  id: number;
  date: string;
  amount: number;
}

export interface MiningSession {
    isActive: boolean;
    startTime: number;
    amount: number;
    duration: string;
    duration_minutes?: number;
    started_at?: string;
    totalEarningsAtStart: number;
    completedTransactions?: number;
}

export interface TeamMember {
  address: string;
  registrationDate: string;
}

export interface TeamData {
  totalTeamSize: number;
  validMembers: number;
  totalCommission: number; // in BNB
  members: TeamMember[];
}
