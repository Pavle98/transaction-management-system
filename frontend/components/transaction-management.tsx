"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { fetchTransactions } from "@/lib/api"
import type { Transaction, UIState } from "@/types/transaction"
import { TableContent } from "@/components/transaction-table"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"

// ---------------------------------------------------------------------------
// Success toast
// ---------------------------------------------------------------------------
function SuccessToast({ show, message }: { show: boolean; message: string }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 shadow-lg backdrop-blur-sm transition-all duration-300 ${
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <CheckCircle2 className="size-4" />
      {message}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function TransactionManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [uiState, setUiState] = useState<UIState>("loading")
  const [toast, setToast] = useState({ show: false, message: "" })
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [])

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ show: true, message })
    toastTimer.current = setTimeout(() => setToast({ show: false, message: "" }), 3000)
  }

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

  async function handleSaved() {
    await loadTransactions()
    showToast("Transaction added successfully")
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
        <AddTransactionDialog onSaved={handleSaved} />
      </header>

      {/* Main transactions card */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardContent className="overflow-x-auto p-0">
          <TableContent uiState={uiState} rows={transactions} onRetry={loadTransactions} />
        </CardContent>
      </Card>

      {/* Footer hint */}
      <p className="pb-1 text-center text-xs text-muted-foreground/50">
        Data is stored locally in a CSV file.
      </p>

      {/* Success toast */}
      <SuccessToast show={toast.show} message={toast.message} />
    </div>
  )
}
