import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWithdrawals } from "@/hooks/use-api"
import { cn } from "@/lib/utils"
import type { Withdrawal } from "@/lib/mockData"

const PAGE_SIZE = 5

const statusConfig: Record<
  Withdrawal["status"],
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-neon-amber/10 text-neon-amber border-neon-amber/30",
    dot: "bg-neon-amber",
  },
  approved: {
    label: "Approved",
    className: "bg-neon-green/10 text-neon-green border-neon-green/30",
    dot: "bg-neon-green",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
}

function WalletCell({ wallet }: { wallet: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet)
    setCopied(true)
    toast.success("Wallet address copied")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs">
        {wallet.slice(0, 8)}...{wallet.slice(-6)}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleCopy}
        aria-label="Copy wallet address"
        className="hover:bg-white/10"
      >
        {copied ? <Check className="size-3 text-neon-green" /> : <Copy className="size-3" />}
      </Button>
    </div>
  )
}

export function WithdrawalHistory() {
  const { data: withdrawals, isLoading } = useWithdrawals()
  const [page, setPage] = useState(0)
  const [prevStatuses, setPrevStatuses] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!withdrawals) return
    const currentStatuses: Record<string, string> = {}
    withdrawals.forEach((w) => {
      currentStatuses[w.id] = w.status
    })

    if (Object.keys(prevStatuses).length > 0) {
      withdrawals.forEach((w) => {
        const prev = prevStatuses[w.id]
        if (prev && prev !== w.status) {
          if (w.status === "approved") {
            toast.success(`Withdrawal of ${w.amount} ${w.coin} approved!`, {
              description: "Funds have been sent to your wallet.",
            })
          } else if (w.status === "rejected") {
            toast.error(`Withdrawal of ${w.amount} ${w.coin} rejected`, {
              description: "Please contact support for details.",
            })
          }
        }
      })
    }
    setPrevStatuses(currentStatuses)
  }, [withdrawals])

  const data = withdrawals ?? []
  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const pageData = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      className="glass rounded-2xl border-white/20 p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Withdrawal History</h2>
        {data.length > 0 && (
          <span className="text-xs text-muted-foreground">{data.length} total</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-white/5" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto scrollbar-hide">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Coin</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Wallet</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {pageData.map((w, i) => {
                    const config = statusConfig[w.status]
                    return (
                      <motion.tr
                        key={w.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="border-white/5 hover:bg-white/5"
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(w.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{w.coin}</span>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {w.amount} {w.coin}
                        </TableCell>
                        <TableCell>
                          <WalletCell wallet={w.wallet} />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("gap-1.5 border", config.className)}
                          >
                            <span className={cn("size-1.5 rounded-full", config.dot)} />
                            {config.label}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="glass border-white/20"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="glass border-white/20"
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
