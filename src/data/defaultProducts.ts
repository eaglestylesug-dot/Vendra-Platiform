import { Product } from '../types/index.ts';

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-bread-milk',
    vip_level: 'VIP1',
    name: 'Bread & Milk Combo',
    category: 'Essential Groceries',
    price: 15000,
    daily_income: 3000,
    total_revenue: 270000,
    duration_days: 90,
    return_rate: 0.20, // 3,000 / 15,000 = 20% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 10,
    image_url: '/images/packed_bread_milk.jpg',
    description: 'High-demand daily breakfast staple distribution inventory. Generates automated daily yield distributed every 24 hours.',
    eligibility_tier: 'VIP1',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'prod-rice-bag-5kg',
    vip_level: 'VIP2',
    name: 'Rice Bag 5kg',
    category: 'Pantry Staples',
    price: 30000,
    daily_income: 4800,
    total_revenue: 432000,
    duration_days: 90,
    return_rate: 0.16, // 4,800 / 30,000 = 16% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 8,
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
    description: 'Premium long-grain 5kg rice packaging wholesale contract with dependable daily returns over 90 days.',
    eligibility_tier: 'VIP2',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'prod-cooking-oil-5l',
    vip_level: 'VIP3',
    name: 'Cooking Oil 5L',
    category: 'Cooking & Edibles',
    price: 50000,
    daily_income: 9320,
    total_revenue: 559200,
    duration_days: 60,
    return_rate: 0.1864, // 9,320 / 50,000 = 18.64% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 6,
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
    description: 'Refined vegetable cooking oil 5L wholesale batch with accelerated 60-day commercial retail distribution return.',
    eligibility_tier: 'VIP3',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'prod-grocery-kit',
    vip_level: 'VIP4',
    name: 'Full Grocery Kit',
    category: 'Household Package',
    price: 120000,
    daily_income: 15000,
    total_revenue: 750000,
    duration_days: 50,
    return_rate: 0.125, // 15,000 / 120,000 = 12.5% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 5,
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    description: 'Comprehensive family grocery kit supplied directly to retail supermarkets and local distribution hubs.',
    eligibility_tier: 'VIP4',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'prod-tv-32-inch',
    vip_level: 'VIP5',
    name: '32 Inch TV',
    category: 'Consumer Electronics',
    price: 260000,
    daily_income: 50000,
    total_revenue: 1000000,
    duration_days: 20,
    return_rate: 0.1923, // 50,000 / 260,000 = 19.23% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 4,
    image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
    description: 'High-definition 32-inch smart digital television units supplied for hospitality and urban electronics retail.',
    eligibility_tier: 'VIP5',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'prod-fridge',
    vip_level: 'VIP6',
    name: 'Fridge',
    category: 'Home Appliances',
    price: 450000,
    daily_income: 100000,
    total_revenue: 1400000,
    duration_days: 14,
    return_rate: 0.2222, // 100,000 / 450,000 = 22.22% daily
    return_type: 'daily_percentage',
    status: 'active',
    purchase_limit: 3,
    image_url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80',
    description: 'High-capacity commercial refrigeration systems deployed for retail cold-chain preservation and perishable grocery storage.',
    eligibility_tier: 'VIP6',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z'
  }
];
