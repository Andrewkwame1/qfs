/* Client-safe payload types shared by the dashboard + admin UI. No server imports. */

export type BalanceCard = {
  key: string;
  label: string;
  amount: string;
  sub: string;
  trend: string;
  trendDir: "up" | "down" | "flat";
  action: string;
  tone: "lime" | "ghost" | "danger";
  actionModal: string;
};

export type TxItem = {
  id: string;
  kind: "dep" | "inv" | "wd" | "earn" | "ref";
  title: string;
  meta: string;
  amount: string;
  cls: "plus" | "minus";
  date: string;
  status: string;
};

export type MarketItem = {
  sym: string;
  name: string;
  full: string;
  price: string;
  chg: string;
  up: boolean;
  color: string;
};

export type DocItem = { code: string; label: string; flag: string };
export type ReviewItem = { name: string; meta: string; avatar: string; stars: number; text: string };
export type CardItem = { brand: string; last4: string; expiry: string; holder: string; color: string };

export type InvestPlanItem = {
  id: string;
  name: string;
  min: string;
  max?: string;
  roi: string;
  term: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  read: boolean;
  time: string;
};

export type PayoutItem = { label: string; value: string };
export type PayoutMethod = { method: string; items: PayoutItem[] };

export type OverviewData = {
  user: {
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    avatarUrl: string;
    country: string;
    referralCode: string;
    memberSince: string;
    kycLevel: number;
  };
  balance: {
    totalCents: number;
    availableCents: number;
    total: string;
    available: string;
    thisMonthDeposits: string;
  };
  investmentSummary: { activeCount: number; activeAmount: string; activeTrend: string };
  earnings: { total: string; thisMonth: string; count: number };
  withdrawals: { total: string; count: number };
  loans: { total: string; count: number };
  balanceCards: BalanceCard[];
  recentTx: TxItem[];
  markets: { metals: MarketItem[]; stocks: MarketItem[]; crypto: MarketItem[] };
  documents: DocItem[];
  reviews: ReviewItem[];
  cards: CardItem[];
  plans: InvestPlanItem[];
  referral: { url: string; count: number; earnings: string };
  notifications: { unread: number; items: NotificationItem[] };
  /** Where to send a deposit, keyed by method (empty until the admin sets addresses). */
  payout: PayoutMethod[];
};

/* ---------- Admin payloads ---------- */

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  country: string;
  kycLevel: number;
  balanceCents: number;
  availableCents: number;
  /** Lifetime sum of COMPLETED deposit transactions (money actually credited). */
  depositCents: number;
  /** Lifetime sum of COMPLETED withdrawal transactions (money actually paid out). */
  withdrawalCents: number;
  memberSince: string;
  lastLoginAt: string | null;
  referralCode: string;
  referredCount: number;
  /** Address of the wallet this user connected, if any. */
  walletAddress: string | null;
};

export type AdminRequestRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amountCents: number;
  amount: string;
  method: string;
  reference: string;
  details?: string;
  /** Verified wallet the funds came from (deposit) or go to (withdrawal). */
  walletAddress?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  adminNote?: string;
};

export type AdminTxRow = {
  id: string;
  userName: string;
  userEmail: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  reference: string;
  method?: string;
  createdAt: string;
  note?: string;
};

export type AdminStats = {
  totalUsers: number;
  newUsers30d: number;
  activeUsers: number;
  suspendedUsers: number;
  totalBalanceCents: number;
  totalBalance: string;
  /** Lifetime sum of COMPLETED deposit transactions. */
  totalDepositsCents: number;
  totalDeposits: string;
  /** Lifetime sum of COMPLETED withdrawal transactions. */
  totalWithdrawalsCents: number;
  totalWithdrawals: string;
  pendingDeposits: { count: number; sumCents: number };
  pendingWithdrawals: { count: number; sumCents: number };
  pendingLoans: number;
  activeInvestments: number;
  activeInvestmentsCents: number;
  totalPlans: number;
  approvals30d: number;
};

export type AuditRow = {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  meta?: string;
  createdAt: string;
};