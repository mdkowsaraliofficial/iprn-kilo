import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ClipboardPaste, QrCode, ArrowRight, Clock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCoinBalances } from "@/hooks/use-api"
import { Skeleton } from "@/components/ui/skeleton"
import { type Coin } from "@/lib/mockData"
import { cn } from "@/lib/utils"
import { ConfirmationModal } from "@/components/withdrawal/confirmation-modal"

const coinColors: Record<Coin, { text: string; bg: string; glow: string }> = {
  USDT: { text: "text-neon-green", bg: "bg-neon-green/10", glow: "neon-glow-green" },
  BCH: { text: "text-neon-amber", bg: "bg-neon-amber/10", glow: "neon-glow-amber" },
  LTC: { text: "text-neon-cyan", bg: "bg-neon-cyan/10", glow: "neon-glow-cyan" },
}

export function WithdrawalModule() {
  const { data: balances, isLoading } = useCoinBalances()
  const [activeCoin, setActiveCoin] = useState<Coin>("USDT")
  const [amount, setAmount] = useState("")
  const [wallet, setWallet] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(false)

  const currentBalance = balances?.find((b) => b.coin === activeCoin)
  const usdEquivalent = currentBalance && amount ? parseFloat(amount) * currentBalance.usdRate : 0

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setWallet(text)
      toast.success("Wallet address pasted")
    } catch {
      toast.error("Failed to read clipboard")
    }
  }

  const handleRequest = () => {
    if (!amount || !wallet) {
      toast.error("Please fill in all fields")
      return
    }
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setShowConfirm(false)
      setPendingStatus(true)
      setAmount("")
      setWallet("")
      toast.success("Withdrawal request submitted", {
        description: "Your request is pending admin approval.",
      })
    }, 1200)
  }

  const handleCoinChange = (coin: string) => {
    setActiveCoin(coin as Coin)
    setAmount("")
    setPendingStatus(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      className="glass rounded-2xl border-white/20 p-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Request Withdrawal</h2>
        <div className="mt-1 h-0.5 w-32 rounded-full gradient-neon" />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full bg-white/5" />
          <Skeleton className="h-20 w-full bg-white/5" />
        </div>
      ) : (
        <>
          <Tabs value={activeCoin} onValueChange={handleCoinChange}>
            <TabsList className="glass grid w-full grid-cols-3 rounded-xl border-white/20">
              {balances?.map((b) => {
                const colors = coinColors[b.coin]
                return (
                  <TabsTrigger
                    key={b.coin}
                    value={b.coin}
                    className={cn(
                      "flex-col gap-0.5 py-2 data-[state=active]:glass-strong",
                      activeCoin === b.coin && colors.text
                    )}
                  >
                    <span className="text-sm font-semibold">{b.coin}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {b.balance} {b.coin}
                    </span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCoin}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="mt-5 space-y-4"
            >
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={pendingStatus}
                    className="glass border-white/20 bg-white/5 pr-16 text-lg font-medium"
                  />
                  <span className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium", coinColors[activeCoin].text)}>
                    {activeCoin}
                  </span>
                </div>
                {amount && (
                  <p className="text-xs text-muted-foreground">
                    ~${usdEquivalent.toFixed(2)} USD
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Wallet Address
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter your wallet address"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    disabled={pendingStatus}
                    className="glass border-white/20 bg-white/5 pr-20 font-mono text-sm"
                  />
                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={handlePaste}
                      disabled={pendingStatus}
                      aria-label="Paste wallet address"
                      className="hover:bg-white/10"
                    >
                      <ClipboardPaste className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={pendingStatus}
                      aria-label="Scan QR code"
                      className="hover:bg-white/10"
                    >
                      <QrCode className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {pendingStatus ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-neon-amber/30 bg-neon-amber/10 py-3"
                >
                  <Clock className="size-4 text-neon-amber" />
                  <span className="text-sm font-medium text-neon-amber">Pending Admin Approval</span>
                </motion.div>
              ) : (
                <Button
                  onClick={handleRequest}
                  className="gradient-neon w-full border-0 py-6 text-base font-semibold text-white shimmer hover:opacity-90"
                  style={{ backgroundSize: "200% 100%" }}
                >
                  Request Withdrawal <ArrowRight className="size-4" />
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      <ConfirmationModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        coin={activeCoin}
        amount={amount}
        wallet={wallet}
        usdEquivalent={usdEquivalent}
        onConfirm={handleConfirm}
        submitting={submitting}
      />
    </motion.div>
  )
}
