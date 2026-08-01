import useSWR from "swr"
import {
  fetchStats,
  fetchEarnings,
  fetchWithdrawals,
  fetchNotifications,
  fetchCoinBalances,
  type Stats,
  type Earnings,
  type Withdrawal,
  type Notification,
  type CoinBalance,
} from "@/lib/mockData"

const POLL_INTERVAL = 30000

export function useStats() {
  return useSWR<Stats>("stats", fetchStats, {
    refreshInterval: POLL_INTERVAL,
  })
}

export function useEarnings() {
  return useSWR<Earnings>("earnings", fetchEarnings, {
    refreshInterval: POLL_INTERVAL,
  })
}

export function useWithdrawals() {
  return useSWR<Withdrawal[]>("withdrawals", fetchWithdrawals, {
    refreshInterval: POLL_INTERVAL,
  })
}

export function useNotifications() {
  return useSWR<Notification[]>("notifications", fetchNotifications, {
    refreshInterval: POLL_INTERVAL,
  })
}

export function useCoinBalances() {
  return useSWR<CoinBalance[]>("coinBalances", fetchCoinBalances, {
    refreshInterval: POLL_INTERVAL,
  })
}
