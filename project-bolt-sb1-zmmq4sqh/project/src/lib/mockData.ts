export type Stats = {
  totalNumbers: number
  totalSms: number
  totalVoice: number
}

export type Earnings = {
  yesterday: number
  sevenDay: number
  thirtyDay: number
  yesterdayTrend: number
  sevenDayTrend: number
  thirtyDayTrend: number
  hourlyData: { hour: string; amount: number }[]
  sevenDayData: { day: string; amount: number }[]
  thirtyDayData: { day: string; amount: number }[]
}

export type Coin = "USDT" | "BCH" | "LTC"

export type CoinBalance = {
  coin: Coin
  balance: number
  usdRate: number
}

export type Withdrawal = {
  id: string
  date: string
  coin: Coin
  amount: number
  wallet: string
  status: "pending" | "approved" | "rejected"
}

export type Notification = {
  id: string
  title: string
  message: string
  time: string
  type: "earnings" | "approval" | "system"
  read: boolean
}

export const mockStats: Stats = {
  totalNumbers: 12,
  totalSms: 4821,
  totalVoice: 1203,
}

export const mockEarnings: Earnings = {
  yesterday: 47.3,
  sevenDay: 318.9,
  thirtyDay: 1204.5,
  yesterdayTrend: 12,
  sevenDayTrend: 8,
  thirtyDayTrend: -3,
  hourlyData: [
    { hour: "00", amount: 1.2 },
    { hour: "02", amount: 0.8 },
    { hour: "04", amount: 0.5 },
    { hour: "06", amount: 1.8 },
    { hour: "08", amount: 3.2 },
    { hour: "10", amount: 4.5 },
    { hour: "12", amount: 5.8 },
    { hour: "14", amount: 6.2 },
    { hour: "16", amount: 5.1 },
    { hour: "18", amount: 7.3 },
    { hour: "20", amount: 6.8 },
    { hour: "22", amount: 4.1 },
  ],
  sevenDayData: [
    { day: "Mon", amount: 42.5 },
    { day: "Tue", amount: 38.2 },
    { day: "Wed", amount: 51.4 },
    { day: "Thu", amount: 47.8 },
    { day: "Fri", amount: 55.1 },
    { day: "Sat", amount: 48.3 },
    { day: "Sun", amount: 35.6 },
  ],
  thirtyDayData: Array.from({ length: 30 }, (_, i) => ({
    day: `${i + 1}`,
    amount: Math.round((30 + Math.sin(i / 3) * 20 + Math.random() * 15) * 10) / 10,
  })),
}

export const mockCoinBalances: CoinBalance[] = [
  { coin: "USDT", balance: 0.45, usdRate: 1.0 },
  { coin: "BCH", balance: 0.12, usdRate: 412.5 },
  { coin: "LTC", balance: 1.85, usdRate: 84.2 },
]

export const mockWithdrawals: Withdrawal[] = [
  {
    id: "w1",
    date: "2026-07-13T10:30:00Z",
    coin: "USDT",
    amount: 50,
    wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    status: "approved",
  },
  {
    id: "w2",
    date: "2026-07-12T14:15:00Z",
    coin: "LTC",
    amount: 0.5,
    wallet: "ltc1qg9stkxrszkdqsuj92lm4c7akvk36zvhqw7p6ck",
    status: "pending",
  },
  {
    id: "w3",
    date: "2026-07-10T09:00:00Z",
    coin: "BCH",
    amount: 0.05,
    wallet: "bitcoincash:qpm2qsznhks23z7629fms6kzc0f4zylh5u8z2kvk2",
    status: "rejected",
  },
  {
    id: "w4",
    date: "2026-07-08T16:45:00Z",
    coin: "USDT",
    amount: 120,
    wallet: "0x89205A3A3b88A93307f76157F02697A3b470Bd20",
    status: "approved",
  },
  {
    id: "w5",
    date: "2026-07-06T11:20:00Z",
    coin: "LTC",
    amount: 1.2,
    wallet: "ltc1qg9stkxrszkdqsuj92lm4c7akvk36zvhqw7p6ck",
    status: "approved",
  },
  {
    id: "w6",
    date: "2026-07-04T08:10:00Z",
    coin: "USDT",
    amount: 75,
    wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    status: "rejected",
  },
  {
    id: "w7",
    date: "2026-07-02T19:30:00Z",
    coin: "BCH",
    amount: 0.08,
    wallet: "bitcoincash:qpm2qsznhks23z7629fms6kzc0f4zylh5u8z2kvk2",
    status: "approved",
  },
]

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    title: "Earnings Update",
    message: "Yesterday's earnings: $47.30 (+12% vs previous day)",
    time: "2h ago",
    type: "earnings",
    read: false,
  },
  {
    id: "n2",
    title: "Withdrawal Approved",
    message: "Your 50 USDT withdrawal has been approved and processed.",
    time: "5h ago",
    type: "approval",
    read: false,
  },
  {
    id: "n3",
    title: "New Number Assigned",
    message: "A new IPRN number +4479xx has been assigned to your account.",
    time: "1d ago",
    type: "system",
    read: false,
  },
  {
    id: "n4",
    title: "Withdrawal Rejected",
    message: "Your 0.05 BCH withdrawal was rejected. Please verify your wallet address.",
    time: "4d ago",
    type: "approval",
    read: true,
  },
  {
    id: "n5",
    title: "Weekly Summary",
    message: "Last 7 days earnings: $318.90 (+8% vs previous week).",
    time: "5d ago",
    type: "earnings",
    read: true,
  },
]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchStats(): Promise<Stats> {
  await delay(300)
  return mockStats
}

export async function fetchEarnings(): Promise<Earnings> {
  await delay(300)
  return mockEarnings
}

export async function fetchWithdrawals(): Promise<Withdrawal[]> {
  await delay(300)
  return mockWithdrawals
}

export async function fetchNotifications(): Promise<Notification[]> {
  await delay(200)
  return mockNotifications
}

export async function fetchCoinBalances(): Promise<CoinBalance[]> {
  await delay(200)
  return mockCoinBalances
}
