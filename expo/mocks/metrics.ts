export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
}

export const dashboardMetrics: DashboardMetric[] = [
  {
    id: 'total-funded',
    label: 'Total Funded',
    value: '$275.7K',
    change: 12.4,
    changeLabel: 'vs last month',
  },
  {
    id: 'beneficiaries',
    label: 'Beneficiaries',
    value: '28,460',
    change: 8.2,
    changeLabel: 'vs last month',
  },
  {
    id: 'transactions',
    label: 'On-Chain Txns',
    value: '1,247',
    change: 23.1,
    changeLabel: 'vs last month',
  },
  {
    id: 'verifications',
    label: 'Verifications',
    value: '836',
    change: 15.7,
    changeLabel: 'vs last month',
  },
];

export interface WalletBalance {
  currency: string;
  symbol: string;
  balance: number;
  usdValue: number;
  change24h: number;
  network: string;
}

export const walletBalances: WalletBalance[] = [
  { currency: 'Ethereum', symbol: 'ETH', balance: 4.235, usdValue: 14822.5, change24h: 2.3, network: 'Ethereum' },
  { currency: 'USD Coin', symbol: 'USDC', balance: 25430, usdValue: 25430, change24h: 0, network: 'Ethereum' },
  { currency: 'Polygon', symbol: 'MATIC', balance: 8500, usdValue: 5100, change24h: -1.2, network: 'Polygon' },
  { currency: 'Celo Dollar', symbol: 'cUSD', balance: 3400, usdValue: 3400, change24h: 0.1, network: 'Celo' },
];
