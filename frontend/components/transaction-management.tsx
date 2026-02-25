"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
  Download,
  Calendar,
  Copy,
  ChevronLeft,
  ChevronRight,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
// Mock data (57 realistic rows)
// ---------------------------------------------------------------------------
const HOLDER_NAMES = [
  "Maria Johnson","John Smith","Sarah Williams","David Brown","Emma Davis",
  "Michael Wilson","Olivia Taylor","James Anderson","Sophia Martinez","Robert Garcia",
  "Isabella Thomas","William Jackson","Mia White","Benjamin Harris","Charlotte Clark",
  "Daniel Lewis","Amelia Robinson","Alexander Walker","Harper Young","Ethan King",
  "Evelyn Wright","Henry Lopez","Abigail Hill","Sebastian Scott","Emily Green",
  "Jack Adams","Ella Baker","Owen Nelson","Scarlett Carter","Liam Mitchell",
  "Aria Perez","Lucas Roberts","Chloe Turner","Mason Phillips","Lily Campbell",
  "Logan Parker","Grace Evans","Aiden Edwards","Zoey Collins","Noah Stewart",
  "Nora Sanchez","Elijah Morris","Hannah Rogers","Jacob Reed","Victoria Cook",
  "Matthew Morgan","Penelope Bell","Jackson Murphy","Layla Bailey","Ryan Rivera",
  "Riley Cooper","Nathan Richardson","Aubrey Cox","Caleb Howard","Stella Ward",
  "Dylan Torres","Hazel Peterson",
]

const STATUSES: TransactionStatus[] = ["Settled","Pending","Failed"]

function generateMockTransactions(count: number): Transaction[] {
  const txs: Transaction[] = []
  for (let i = 0; i < count; i++) {
    const day = (i % 28) + 1
    const month = Math.floor(i / 28) + 1
    const seg = (n: number) => String(1000 + (n % 9000))
    txs.push({
      transactionDate: `2025-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`,
      accountNumber: `${seg(i)}-${seg(i * 7)}-${seg(i * 13)}`,
      accountHolderName: HOLDER_NAMES[i % HOLDER_NAMES.length],
      amount: Math.round((20 + (i * 17.731) % 980) * 100) / 100,
      status: STATUSES[i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : 0],
    })
  }
  return txs
}

const MOCK_TRANSACTIONS: Transaction[] = generateMockTransactions(57)

// ---------------------------------------------------------------------------
// Status dot + label (muted colors)
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
  "Date",
  "Account Number",
  "Account Holder",
  "Amount",
  "Status",
]

// ---------------------------------------------------------------------------
// KPI cards
// ---------------------------------------------------------------------------
function KPICards() {
  const totalAmount = MOCK_TRANSACTIONS.reduce((s, t) => s + t.amount, 0)
  const pending = MOCK_TRANSACTIONS.filter((t) => t.status === "Pending").length
  const failed = MOCK_TRANSACTIONS.filter((t) => t.status === "Failed").length

  const kpis: { label: string; value: string; hoverClass: string }[] = [
    { label: "Total Transactions", value: MOCK_TRANSACTIONS.length.toString(), hoverClass: "hover:border-primary/25 hover:shadow-[0_0_12px_-4px_rgba(198,161,91,0.12)]" },
    { label: "Total Amount", value: `$${totalAmount.toFixed(2)}`, hoverClass: "hover:border-primary/40 hover:shadow-[0_0_16px_-4px_rgba(198,161,91,0.22)]" },
    { label: "Pending", value: pending.toString(), hoverClass: "hover:border-amber-500/25 hover:shadow-[0_0_12px_-4px_rgba(245,158,11,0.12)]" },
    { label: "Failed", value: failed.toString(), hoverClass: "hover:border-red-500/35 hover:shadow-[0_0_16px_-4px_rgba(239,68,68,0.18)]" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`group rounded-lg border border-border bg-card p-4 transition-all duration-200 ${kpi.hoverClass}`}
        >
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {kpi.value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{kpi.label}</p>
        </div>
      ))}
    </div>
  )
}

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
    <TableRow className="group/row border-border transition-colors duration-150 hover:bg-[#1A1A20]">
      <TableCell className="text-sm text-foreground">
        {tx.transactionDate}
      </TableCell>
      <TableCell>
        <span className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-sm text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline">
          {tx.accountNumber}
          <Copy className="size-3 text-muted-foreground/0 transition-colors group-hover/row:text-muted-foreground/60" />
        </span>
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
// Controls row (search, status filter, date range)
// ---------------------------------------------------------------------------
function ControlsRow({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string
  onSearchChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="flex flex-col gap-1">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by account number or holder name..."
            className="h-8 w-72 border-border bg-secondary pl-8 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
          />
        </div>
        <p className="pl-0.5 text-[10px] text-muted-foreground/50">Search by account or holder name</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Status filter */}
        <Select defaultValue="all">
          <SelectTrigger className="h-8 w-28 border-border bg-secondary text-xs text-foreground" size="sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card text-foreground">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-border bg-secondary text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Calendar className="size-3.5" />
          Last 30 days
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Transaction Dialog (dark-styled)
// ---------------------------------------------------------------------------
function AddTransactionDialog() {
  return (
    <Dialog>
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
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground">
              Use decimals, e.g. 150.00
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/85">
            Save Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Loading state (inline)
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
// Empty state (inline)
// ---------------------------------------------------------------------------
function TransactionTableEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <p className="text-sm text-muted-foreground">
        No transactions found.
      </p>
      <Button
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-primary/85"
      >
        <Plus className="size-3.5" />
        Add Transaction
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Error state (inline)
// ---------------------------------------------------------------------------
function TransactionTableError() {
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
// Table content switcher (now accepts paged rows)
// ---------------------------------------------------------------------------
function TableContent({
  uiState,
  rows,
}: {
  uiState: UIState
  rows: Transaction[]
}) {
  if (uiState === "loading") return <TransactionTableLoading />
  if (uiState === "empty") return <TransactionTableEmpty />
  if (uiState === "error") return <TransactionTableError />

  return (
    <Table>
      <TransactionTableHeader />
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="border-border">
            <TableCell colSpan={TABLE_COLUMNS.length} className="py-12 text-center text-sm text-muted-foreground">
              No transactions match your search.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((tx, idx) => (
            <TransactionTableRow key={`${tx.accountNumber}-${idx}`} tx={tx} />
          ))
        )}
      </TableBody>
    </Table>
  )
}

// ---------------------------------------------------------------------------
// Pagination footer
// ---------------------------------------------------------------------------
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "ellipsis")[] = []
  if (current <= 3) {
    pages.push(1, 2, 3, 4, "ellipsis", total)
  } else if (current >= total - 2) {
    pages.push(1, "ellipsis", total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, "ellipsis", current - 1, current, current + 1, "ellipsis", total)
  }
  return pages
}

function PaginationFooter({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const pages = getPageNumbers(page, totalPages)

  return (
    <div className="flex flex-col items-center gap-3 border-t border-border px-5 py-3 sm:flex-row sm:justify-between">
      {/* Left: range label */}
      <p className="text-xs text-muted-foreground/70">
        Showing{" "}
        <span className="font-medium text-muted-foreground">{start}&ndash;{end}</span>
        {" "}of{" "}
        <span className="font-medium text-muted-foreground">{total}</span>
      </p>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        {/* Page size */}
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-7 w-[70px] border-border bg-secondary text-xs text-foreground" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-card text-foreground">
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>

        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-7 w-7 border-border bg-secondary p-0 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="size-3.5" />
          <span className="sr-only">Previous page</span>
        </Button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ell-${i}`} className="px-0.5 text-xs text-muted-foreground/50">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant="outline"
              size="sm"
              onClick={() => onPageChange(p)}
              className={`h-7 w-7 border-border p-0 text-xs transition-all ${
                p === page
                  ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_8px_-3px_rgba(198,161,91,0.2)]"
                  : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {p}
            </Button>
          )
        )}

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-7 w-7 border-border bg-secondary p-0 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight className="size-3.5" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function TransactionManagement() {
  // Switch between "ready" | "loading" | "empty" | "error" to preview states
  const [uiState] = useState<UIState>("ready")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_TRANSACTIONS
    const q = searchQuery.toLowerCase()
    return MOCK_TRANSACTIONS.filter(
      (tx) =>
        tx.accountNumber.toLowerCase().includes(q) ||
        tx.accountHolderName.toLowerCase().includes(q)
    )
  }, [searchQuery])

  // Paginate
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  function handlePageChange(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)))
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setPage(1)
  }

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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
          <AddTransactionDialog />
        </div>
      </header>

      {/* KPI summary row */}
      <KPICards />

      {/* Main transactions card */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <ControlsRow searchQuery={searchQuery} onSearchChange={handleSearchChange} />
        <CardContent className="p-0">
          <TableContent uiState={uiState} rows={pagedRows} />
        </CardContent>
        {uiState === "ready" && (
          <PaginationFooter
            page={safePage}
            pageSize={pageSize}
            total={total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </Card>

      {/* Footer hint */}
      <p className="pb-1 text-center text-xs text-muted-foreground/50">
        Data is stored locally in a CSV file.
      </p>
    </div>
  )
}
