import type { Transaction } from "@/types/transaction"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface ApiError {
  error: string
  details?: Record<string, string>
}

export class TransactionApiError extends Error {
  details?: Record<string, string>
  constructor(message: string, details?: Record<string, string>) {
    super(message)
    this.details = details
  }
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${API_URL}/transactions`)
  if (!res.ok) throw new Error("Failed to fetch transactions")
  return res.json()
}

export async function createTransaction(
  data: Omit<Transaction, "status" | "amount"> & { amount: string }
): Promise<Transaction> {
  const res = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({ error: "Failed to create transaction" }))
    throw new TransactionApiError(body.error, body.details)
  }
  return res.json()
}
