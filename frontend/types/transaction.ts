export type TransactionStatus = "Pending" | "Settled" | "Failed"
export type UIState = "ready" | "loading" | "empty" | "error"

export interface Transaction {
  transactionDate: string
  accountNumber: string
  accountHolderName: string
  amount: number
  status: TransactionStatus
}
