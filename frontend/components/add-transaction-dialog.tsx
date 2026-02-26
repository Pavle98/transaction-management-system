"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { createTransaction, TransactionApiError } from "@/lib/api"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-400">{message}</p>
}

export function AddTransactionDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
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
    setFieldErrors({})
  }

  async function handleSubmit() {
    setSaving(true)
    setError("")
    setFieldErrors({})
    try {
      await createTransaction({
        transactionDate: formData.transactionDate,
        accountNumber: formData.accountNumber.trim(),
        accountHolderName: formData.accountHolderName.trim(),
        amount: formData.amount.trim(),
      })
      resetForm()
      setOpen(false)
      onSaved()
    } catch (e) {
      if (e instanceof TransactionApiError && e.details) {
        setFieldErrors(e.details)
      } else {
        setError("Failed to save transaction. Please try again.")
      }
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
            <FieldError message={fieldErrors.transactionDate} />
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
            <FieldError message={fieldErrors.accountNumber} />
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
            <FieldError message={fieldErrors.accountHolderName} />
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
            <FieldError message={fieldErrors.amount} />
            {!fieldErrors.amount && (
              <p className="text-xs text-muted-foreground">
                Use decimals, e.g. 150.00
              </p>
            )}
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
