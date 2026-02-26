import type { Transaction, UIState } from "@/types/transaction"
import { StatusBadge } from "@/components/status-badge"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const USD_FORMAT = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

const TABLE_COLUMNS = [
  "Transaction Date",
  "Account Number",
  "Account Holder Name",
  "Amount",
  "Status",
]

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
        {USD_FORMAT.format(tx.amount)}
      </TableCell>
      <TableCell>
        <StatusBadge status={tx.status} />
      </TableCell>
    </TableRow>
  )
}

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

function TransactionTableEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <p className="text-sm text-muted-foreground">
        No transactions found.
      </p>
    </div>
  )
}

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

export function TableContent({
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
