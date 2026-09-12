-- Seed data for DEMO products only (as explicitly specified in guidelines)
-- Note: Never create fake users, fake transactions, or fake balances.

INSERT INTO products (id, name, category, price, duration_days, return_rate, return_type, status, purchase_limit, description, eligibility_tier)
VALUES 
(
    'prod-solar-001',
    'EcoPower Solar Micro-Grid Unit',
    'Clean Energy Equipment',
    10000.00,
    7,
    0.0180,
    'daily_percentage',
    'active',
    5,
    'Supports distributed photovoltaic mini-inverter deployment for off-grid rural trading centers. Generates daily equipment operating fee yields based on real power metering.',
    'STANDARD'
),
(
    'prod-chiller-002',
    'Cold-Chain Dairy Chiller Lease',
    'Agro-Processing Logistics',
    25000.00,
    14,
    0.0220,
    'daily_percentage',
    'active',
    4,
    'Commercial bulk milk cooling tanks deployed across agricultural collection cooperatives in Mbarara and Kiruhura. Operational return based on measured milk volume preservation fees.',
    'STANDARD'
),
(
    'prod-grain-003',
    'Agri-Grain Silo Milling Node',
    'Post-Harvest Infrastructure',
    50000.00,
    30,
    0.0250,
    'daily_percentage',
    'active',
    3,
    'Automated maize and grain cleaning, bagging, and storage facility in Eastern Uganda. Operating yields tied to contracted seasonal storage and grain drying throughput.',
    'VIP_BRONZE'
),
(
    'prod-emobility-004',
    'Kampala E-Mobility Fleet Charger',
    'Urban Transport Tech',
    100000.00,
    45,
    0.0280,
    'daily_percentage',
    'active',
    2,
    'High-speed commercial battery swap & charging stations for electric motorcycle taxis (boda-bodas) operating in central Kampala commercial corridors.',
    'VIP_SILVER'
),
(
    'prod-telecom-005',
    'Regional Telecom Repeater Tower',
    'Digital Infrastructure',
    250000.00,
    60,
    0.0300,
    'daily_percentage',
    'active',
    1,
    'Off-grid cellular relay tower and satellite backhaul transceiver powering digital Mobile Money connectivity in western border commercial outposts.',
    'VIP_GOLD'
)
ON CONFLICT (id) DO NOTHING;

-- Default Platform Settings
INSERT INTO platform_settings (id, setting_key, setting_value, description)
VALUES
('sett-001', 'min_deposit_ugx', '10000', 'Minimum allowed deposit in UGX'),
('sett-002', 'min_withdrawal_ugx', '5000', 'Minimum allowed withdrawal in UGX'),
('sett-003', 'l1_referral_percentage', '5.0', 'Direct level 1 referral reward percentage on qualifying purchases'),
('sett-004', 'l2_referral_percentage', '2.0', 'Indirect level 2 referral reward percentage on qualifying purchases'),
('sett-005', 'referral_eligibility_min_deposit', '10000', 'Minimum cumulative deposit required to unlock referral commissions'),
('sett-006', 'maintenance_mode', 'false', 'Global maintenance mode toggle'),
('sett-007', 'momo_gateway_mode', 'sandbox', 'Mobile Money gateway operating mode (sandbox / live)')
ON CONFLICT (id) DO NOTHING;
