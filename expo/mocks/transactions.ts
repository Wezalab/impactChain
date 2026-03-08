export interface Transaction {
  id: string;
  type: 'donation' | 'disbursement' | 'verification' | 'milestone';
  title: string;
  description: string;
  amount: number;
  currency: string;
  from: string;
  to: string;
  status: 'confirmed' | 'pending' | 'processing';
  blockHash: string;
  blockNumber: number;
  timestamp: string;
  gasUsed: number;
  network: string;
  projectId: string;
}

export const transactions: Transaction[] = [
  {
    id: 'tx-001',
    type: 'donation',
    title: 'Education Fund Contribution',
    description: 'Quarterly contribution to the Global Education Initiative fund for sub-Saharan Africa.',
    amount: 12500,
    currency: 'USDC',
    from: '0x7a2B...4f91',
    to: '0x3eC1...8d22',
    status: 'confirmed',
    blockHash: '0xabc123...def456',
    blockNumber: 18234567,
    timestamp: '2026-03-07T14:23:00Z',
    gasUsed: 21000,
    network: 'Ethereum',
    projectId: 'proj-001',
  },
  {
    id: 'tx-002',
    type: 'disbursement',
    title: 'Clean Water Infrastructure',
    description: 'Disbursement for water purification system installation in rural communities.',
    amount: 8750,
    currency: 'ETH',
    from: '0x3eC1...8d22',
    to: '0x9bF4...1c77',
    status: 'confirmed',
    blockHash: '0x789abc...123def',
    blockNumber: 18234590,
    timestamp: '2026-03-06T09:45:00Z',
    gasUsed: 35000,
    network: 'Ethereum',
    projectId: 'proj-002',
  },
  {
    id: 'tx-003',
    type: 'verification',
    title: 'Impact Verification — Nairobi',
    description: 'On-chain verification of impact metrics for the Nairobi digital literacy program.',
    amount: 0,
    currency: 'MATIC',
    from: '0x5dA2...7e33',
    to: '0x3eC1...8d22',
    status: 'confirmed',
    blockHash: '0xdef789...abc123',
    blockNumber: 52345678,
    timestamp: '2026-03-05T18:12:00Z',
    gasUsed: 42000,
    network: 'Polygon',
    projectId: 'proj-003',
  },
  {
    id: 'tx-004',
    type: 'milestone',
    title: 'Milestone: 1000 Students Enrolled',
    description: 'Smart contract milestone trigger — 1000 students successfully enrolled in digital skills program.',
    amount: 25000,
    currency: 'USDC',
    from: '0x8cE5...2a44',
    to: '0x3eC1...8d22',
    status: 'confirmed',
    blockHash: '0x456def...789abc',
    blockNumber: 18234610,
    timestamp: '2026-03-04T11:30:00Z',
    gasUsed: 65000,
    network: 'Ethereum',
    projectId: 'proj-001',
  },
  {
    id: 'tx-005',
    type: 'donation',
    title: 'Healthcare Supply Chain',
    description: 'Funding for blockchain-tracked medical supply distribution across Southeast Asia.',
    amount: 5200,
    currency: 'USDC',
    from: '0x1fB8...5d99',
    to: '0x3eC1...8d22',
    status: 'processing',
    blockHash: '0x...',
    blockNumber: 0,
    timestamp: '2026-03-07T16:05:00Z',
    gasUsed: 0,
    network: 'Ethereum',
    projectId: 'proj-004',
  },
  {
    id: 'tx-006',
    type: 'disbursement',
    title: 'Agricultural Microloans',
    description: 'DeFi microloan disbursement for smallholder farmers in Uganda.',
    amount: 3400,
    currency: 'cUSD',
    from: '0x3eC1...8d22',
    to: '0x6aD7...3b88',
    status: 'pending',
    blockHash: '0x...',
    blockNumber: 0,
    timestamp: '2026-03-07T17:30:00Z',
    gasUsed: 0,
    network: 'Celo',
    projectId: 'proj-005',
  },
];
