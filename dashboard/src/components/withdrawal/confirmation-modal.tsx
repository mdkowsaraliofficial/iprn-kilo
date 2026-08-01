import { motion } from "framer-motion"
import { Clock, Wallet, Coins, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Coin } from "@/lib/mockData"

type ConfirmationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  coin: Coin
  amount: string
  wallet: string
  usdEquivalent: number
  onConfirm: () => void
  submitting?: boolean
}

const coinColors: Record<Coin, string> = {
  USDT: "text-neon-green",
  BCH: "text-neon-amber",
  LTC: "text-neon-cyan",
}

export function ConfirmationModal({
  open,
  onOpenChange,
  coin,
  amount,
  wallet,
  usdEquivalent,
  onConfirm,
  submitting = false,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong rounded-2xl border-white/20 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Confirm Withdrawal</DialogTitle>
          <DialogDescription>
            Please review your withdrawal request before submitting.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Coins className="size-3.5" /> Coin
            </span>
            <span className={`text-sm font-semibold ${coinColors[coin]}`}>{coin}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ArrowRight className="size-3.5" /> Amount
            </span>
            <span className="text-sm font-semibold">
              {amount} {coin} <span className="text-muted-foreground">(~${usdEquivalent.toFixed(2)})</span>
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Wallet className="size-3.5 mt-0.5" /> Wallet
            </span>
            <span className="break-all text-right text-sm font-mono">
              {wallet.slice(0, 12)}...{wallet.slice(-8)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-3.5" /> Processing
            </span>
            <span className="text-sm text-muted-foreground">Pending admin approval</span>
          </div>
        </motion.div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="glass border-white/20"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={submitting}
            className="gradient-neon border-0 text-white shimmer hover:opacity-90"
            style={{ backgroundSize: "200% 100%" }}
          >
            {submitting ? "Submitting..." : "Confirm Submission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
