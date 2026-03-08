export interface Project {
  id: string;
  name: string;
  description: string;
  category: 'education' | 'health' | 'water' | 'finance' | 'agriculture' | 'governance';
  location: string;
  country: string;
  raised: number;
  goal: number;
  currency: string;
  beneficiaries: number;
  milestones: number;
  milestonesCompleted: number;
  status: 'active' | 'completed' | 'upcoming';
  imageUrl: string;
  sdgGoals: number[];
  startDate: string;
  endDate: string;
  team: string;
  verifications: number;
}

export const projects: Project[] = [
  {
    id: 'proj-001',
    name: 'Digital Literacy for Sub-Saharan Africa',
    description: 'Providing blockchain-verified digital skills training certificates to underserved youth across Kenya, Nigeria, and Tanzania. Each completion is recorded on-chain as a verifiable credential.',
    category: 'education',
    location: 'Nairobi, Kenya',
    country: 'KE',
    raised: 87500,
    goal: 100000,
    currency: 'USDC',
    beneficiaries: 2340,
    milestones: 8,
    milestonesCompleted: 6,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
    sdgGoals: [4, 8, 10],
    startDate: '2025-09-01',
    endDate: '2026-08-31',
    team: 'EduChain Labs',
    verifications: 156,
  },
  {
    id: 'proj-002',
    name: 'Clean Water Tracking — Rural India',
    description: 'IoT sensors linked to blockchain for real-time water quality monitoring and transparent fund allocation for purification infrastructure.',
    category: 'water',
    location: 'Rajasthan, India',
    country: 'IN',
    raised: 45200,
    goal: 75000,
    currency: 'USDC',
    beneficiaries: 12500,
    milestones: 6,
    milestonesCompleted: 3,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=800',
    sdgGoals: [6, 3, 11],
    startDate: '2025-11-15',
    endDate: '2026-11-15',
    team: 'AquaLedger',
    verifications: 89,
  },
  {
    id: 'proj-003',
    name: 'Healthcare Supply Chain — Philippines',
    description: 'End-to-end tracking of medical supplies from donors to clinics using blockchain, ensuring zero diversion and full accountability.',
    category: 'health',
    location: 'Manila, Philippines',
    country: 'PH',
    raised: 62000,
    goal: 80000,
    currency: 'USDC',
    beneficiaries: 8900,
    milestones: 10,
    milestonesCompleted: 7,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    sdgGoals: [3, 1, 17],
    startDate: '2025-07-01',
    endDate: '2026-06-30',
    team: 'MedTrace',
    verifications: 234,
  },
  {
    id: 'proj-004',
    name: 'DeFi Microloans for Farmers',
    description: 'Decentralized lending platform providing microloans to smallholder farmers in Uganda with transparent interest rates and repayment tracking.',
    category: 'agriculture',
    location: 'Kampala, Uganda',
    country: 'UG',
    raised: 31000,
    goal: 50000,
    currency: 'cUSD',
    beneficiaries: 520,
    milestones: 5,
    milestonesCompleted: 2,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
    sdgGoals: [1, 2, 8],
    startDate: '2026-01-10',
    endDate: '2026-12-31',
    team: 'AgriBlock',
    verifications: 45,
  },
  {
    id: 'proj-005',
    name: 'Community Governance DAO — Brazil',
    description: 'Decentralized governance platform enabling transparent community decision-making and budget allocation for favela improvement projects.',
    category: 'governance',
    location: 'Rio de Janeiro, Brazil',
    country: 'BR',
    raised: 50000,
    goal: 50000,
    currency: 'USDC',
    beneficiaries: 4200,
    milestones: 7,
    milestonesCompleted: 7,
    status: 'completed',
    imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
    sdgGoals: [11, 16, 10],
    startDate: '2025-03-01',
    endDate: '2026-02-28',
    team: 'GovChain DAO',
    verifications: 312,
  },
];

export const categoryColors: Record<Project['category'], string> = {
  education: '#3B82F6',
  health: '#EF4444',
  water: '#06B6D4',
  finance: '#F59E0B',
  agriculture: '#10B981',
  governance: '#8B5CF6',
};
