"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TransactionStatus = "Pending" | "Settled" | "Failed"
type UIState = "ready" | "loading" | "empty" | "error"

interface Transaction {
  transactionDate: string
  accountNumber: string
  accountHolderName: string
  amount: number
  status: TransactionStatus
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${API_URL}/transactions`)
  if (!res.ok) throw new Error("Failed to fetch transactions")
  return res.json()
}

async function createTransaction(
  data: Omit<Transaction, "status">
): Promise<Transaction> {
  const res = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create transaction")
  return res.json()
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  TransactionStatus,
  { dot: string; bg: string; text: string }
> = {
  Pending: {
    dot: "bg-amber-500/70",
    bg: "bg-amber-500/10",
    text: "text-amber-400/90",
  },
  Settled: {
    dot: "bg-emerald-500/70",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400/90",
  },
  Failed: {
    dot: "bg-red-500/70",
    bg: "bg-red-500/10",
    text: "text-red-400/90",
  },
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------
const TABLE_COLUMNS = [
  "Transaction Date",
  "Account Number",
  "Account Holder Name",
  "Amount",
  "Status",
]

// ---------------------------------------------------------------------------
// Table header
// ---------------------------------------------------------------------------
function TransactionTableHeader() {
  return (
    <TableHeader className="sticky top-0 z-10">
      <TableRow className="border-border hover:bg-transparent">
        {TABLE_COLUMNS.map((col) => (
          <TableHead
            key={col}
            className={`bg-card text-xs font-medium uppercase tracking-wider text-muted-foreground ${col === "Amount" ? "text-right" : ""}`}
          >
            {col}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

// ---------------------------------------------------------------------------
// Table row
// ---------------------------------------------------------------------------
function TransactionTableRow({ tx }: { tx: Transaction }) {
  return (
    <TableRow className="border-border transition-colors duration-150 hover:bg-[#1A1A20]">
      <TableCell className="text-sm text-foreground">
        {tx.transactionDate}
      </TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground">
        {tx.accountNumber}
      </TableCell>
      <TableCell className="text-sm text-foreground">
        {tx.accountHolderName}
      </TableCell>
      <TableCell className="text-right font-mono text-sm tabular-nums text-foreground">
        ${tx.amount.toFixed(2)}
      </TableCell>
      <TableCell>
        <StatusBadge status={tx.status} />
      </TableCell>
    </TableRow>
  )
}

// ---------------------------------------------------------------------------
// Add Transaction Dialog
// ---------------------------------------------------------------------------
function AddTransactionDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    transactionDate: "",
    accountNumber: "",
    accountHolderName: "",
    amount: "",
  })

  function resetForm() {
    setFormData({
      transactionDate: "",
      accountNumber: "",
      accountHolderName: "",
      amount: "",
    })
    setError("")
  }

  async function handleSubmit() {
    setSaving(true)
    setError("")
    try {
      await createTransaction({
        transactionDate: formData.transactionDate,
        accountNumber: formData.accountNumber.trim(),
        accountHolderName: formData.accountHolderName.trim(),
        amount: parseFloat(formData.amount),
      })
      resetForm()
      setOpen(false)
      onSaved()
    } catch {
      setError("Failed to save transaction. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const isValid =
    formData.transactionDate &&
    formData.accountNumber.trim() &&
    formData.accountHolderName.trim() &&
    formData.amount &&
    !isNaN(parseFloat(formData.amount)) &&
    parseFloat(formData.amount) > 0

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button className="h-8 bg-primary text-primary-foreground hover:bg-primary/85">
          <Plus className="size-3.5" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card text-card-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Add Transaction
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter transaction details below. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="txDate" className="text-sm text-foreground">
              Transaction Date
            </Label>
            <Input
              id="txDate"
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              className="border-border bg-secondary text-foreground focus-visible:ring-primary/40"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="accountNumber" className="text-sm text-foreground">
              Account Number
            </Label>
            <Input
              id="accountNumber"
              placeholder="e.g. 1234-5678-9012"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="holderName" className="text-sm text-foreground">
              Account Holder Name
            </Label>
            <Input
              id="holderName"
              placeholder="e.g. Jane Doe"
              value={formData.accountHolderName}
              onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="amount" className="text-sm text-foreground">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground">
              Use decimals, e.g. 150.00
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || saving}
            className="bg-primary text-primary-foreground hover:bg-primary/85"
          >
            {saving ? "Saving..." : "Save Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------
function TransactionTableLoading() {
  return (
    <Table>
      <TransactionTableHeader />
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i} className="border-border">
            {TABLE_COLUMNS.map((col) => (
              <TableCell key={col}>
                <Skeleton className="h-4 w-full bg-secondary" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function TransactionTableEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <p className="text-sm text-muted-foreground">
        No transactions found.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------
function TransactionTableError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="px-5 py-6">
      <Alert
        variant="destructive"
        className="border-red-500/20 bg-red-500/10 text-red-400"
      >
        <AlertCircle className="size-4" />
        <AlertTitle>Failed to load transactions</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <p className="text-red-400/80">
            Something went wrong while fetching your transactions.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="w-fit border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table content switcher
// ---------------------------------------------------------------------------
function TableContent({
  uiState,
  rows,
  onRetry,
}: {
  uiState: UIState
  rows: Transaction[]
  onRetry: () => void
}) {
  if (uiState === "loading") return <TransactionTableLoading />
  if (uiState === "empty") return <TransactionTableEmpty />
  if (uiState === "error") return <TransactionTableError onRetry={onRetry} />

  return (
    <Table>
      <TransactionTableHeader />
      <TableBody>
        {rows.map((tx, idx) => (
          <TransactionTableRow key={`${tx.accountNumber}-${idx}`} tx={tx} />
        ))}
      </TableBody>
    </Table>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function TransactionManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [uiState, setUiState] = useState<UIState>("loading")

  const loadTransactions = useCallback(async () => {
    setUiState("loading")
    try {
      const data = await fetchTransactions()
      setTransactions(data)
      setUiState(data.length === 0 ? "empty" : "ready")
    } catch {
      setUiState("error")
    }
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-5 md:p-8">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage transactions stored in your CSV file.
          </p>
        </div>
        <AddTransactionDialog onSaved={loadTransactions} />
      </header>

      {/* Main transactions card */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardContent className="p-0">
          <TableContent uiState={uiState} rows={transactions} onRetry={loadTransactions} />
        </CardContent>
      </Card>

      {/* Footer hint */}
      <p className="pb-1 text-center text-xs text-muted-foreground/50">
        Data is stored locally in a CSV file.
      </p>
    </div>
  )
}
