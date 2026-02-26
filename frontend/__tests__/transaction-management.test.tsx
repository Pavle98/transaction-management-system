import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TransactionManagement from "@/components/transaction-management"

const SAMPLE_TRANSACTIONS = [
  {
    transactionDate: "2025-03-01",
    accountNumber: "7289-3445-1121",
    accountHolderName: "Maria Johnson",
    amount: 150.0,
    status: "Settled",
  },
  {
    transactionDate: "2025-03-02",
    accountNumber: "1122-3456-7890",
    accountHolderName: "John Smith",
    amount: 75.5,
    status: "Pending",
  },
  {
    transactionDate: "2025-03-04",
    accountNumber: "8899-0011-2233",
    accountHolderName: "Sarah Williams",
    amount: 310.75,
    status: "Failed",
  },
]

function mockFetchSuccess(data: unknown = SAMPLE_TRANSACTIONS) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  })
}

function mockFetchFailure() {
  return vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ error: "Server error" }),
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("TransactionManagement", () => {
  describe("Transaction Table", () => {
    it("displays all transactions from the API", async () => {
      vi.stubGlobal("fetch", mockFetchSuccess())

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("Maria Johnson")).toBeInTheDocument()
      })

      expect(screen.getByText("John Smith")).toBeInTheDocument()
      expect(screen.getByText("Sarah Williams")).toBeInTheDocument()
      expect(screen.getByText("7289-3445-1121")).toBeInTheDocument()
      expect(screen.getByText("1122-3456-7890")).toBeInTheDocument()
    })

    it("renders all five column headers", async () => {
      vi.stubGlobal("fetch", mockFetchSuccess())

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("Maria Johnson")).toBeInTheDocument()
      })

      expect(screen.getByText("Transaction Date")).toBeInTheDocument()
      expect(screen.getByText("Account Number")).toBeInTheDocument()
      expect(screen.getByText("Account Holder Name")).toBeInTheDocument()
      expect(screen.getByText("Amount")).toBeInTheDocument()
      expect(screen.getByText("Status")).toBeInTheDocument()
    })

    it("formats amounts as USD currency", async () => {
      vi.stubGlobal("fetch", mockFetchSuccess())

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("$150.00")).toBeInTheDocument()
      })

      expect(screen.getByText("$75.50")).toBeInTheDocument()
      expect(screen.getByText("$310.75")).toBeInTheDocument()
    })

    it("renders status badges with correct text", async () => {
      vi.stubGlobal("fetch", mockFetchSuccess())

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("Settled")).toBeInTheDocument()
      })

      expect(screen.getByText("Pending")).toBeInTheDocument()
      expect(screen.getByText("Failed")).toBeInTheDocument()
    })

    it("shows loading skeletons while fetching", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {}))) // never resolves

      render(<TransactionManagement />)

      // Table should render with header row + 5 skeleton placeholder rows
      const rows = screen.getAllByRole("row")
      expect(rows.length).toBe(6) // 1 header + 5 skeleton rows
      expect(screen.queryByText("Maria Johnson")).not.toBeInTheDocument()
    })

    it("shows error state with retry button when fetch fails", async () => {
      vi.stubGlobal("fetch", mockFetchFailure())

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("Failed to load transactions")).toBeInTheDocument()
      })

      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
    })

    it("retries fetching when retry button is clicked", async () => {
      vi.stubGlobal("fetch", mockFetchFailure())

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("Failed to load transactions")).toBeInTheDocument()
      })

      // Switch to success response for retry
      vi.stubGlobal("fetch", mockFetchSuccess())

      await userEvent.click(screen.getByRole("button", { name: /retry/i }))

      await waitFor(() => {
        expect(screen.getByText("Maria Johnson")).toBeInTheDocument()
      })
    })

    it("shows empty state when no transactions exist", async () => {
      vi.stubGlobal("fetch", mockFetchSuccess([]))

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("No transactions found.")).toBeInTheDocument()
      })
    })
  })

  describe("Add Transaction Dialog", () => {
    it("opens the dialog when Add Transaction button is clicked", async () => {
      vi.stubGlobal("fetch", mockFetchSuccess())

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("Maria Johnson")).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole("button", { name: /add transaction/i }))

      expect(screen.getByText("Enter transaction details below. All fields are required.")).toBeInTheDocument()
      expect(screen.getByLabelText("Transaction Date")).toBeInTheDocument()
      expect(screen.getByLabelText("Account Number")).toBeInTheDocument()
      expect(screen.getByLabelText("Account Holder Name")).toBeInTheDocument()
      expect(screen.getByLabelText("Amount")).toBeInTheDocument()
    })

    it("disables save button when form is incomplete", async () => {
      vi.stubGlobal("fetch", mockFetchSuccess())

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("Maria Johnson")).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole("button", { name: /add transaction/i }))

      const saveButton = screen.getByRole("button", { name: /save transaction/i })
      expect(saveButton).toBeDisabled()
    })

    it("enables save button when all fields are filled", async () => {
      vi.stubGlobal("fetch", mockFetchSuccess())

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("Maria Johnson")).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole("button", { name: /add transaction/i }))

      await userEvent.type(screen.getByLabelText("Transaction Date"), "2025-04-01")
      await userEvent.type(screen.getByLabelText("Account Number"), "1111-2222-3333")
      await userEvent.type(screen.getByLabelText("Account Holder Name"), "Jane Doe")
      await userEvent.type(screen.getByLabelText("Amount"), "250.00")

      const saveButton = screen.getByRole("button", { name: /save transaction/i })
      expect(saveButton).toBeEnabled()
    })

    it("submits the form and refreshes the table", async () => {
      const createdTransaction = {
        transactionDate: "2025-04-01",
        accountNumber: "1111-2222-3333",
        accountHolderName: "Jane Doe",
        amount: 250.0,
        status: "Pending",
      }

      const updatedList = [...SAMPLE_TRANSACTIONS, createdTransaction]

      let callCount = 0
      vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createdTransaction),
          })
        }
        // GET: first returns original, then updated list after POST
        callCount++
        const data = callCount <= 1 ? SAMPLE_TRANSACTIONS : updatedList
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        })
      }))

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("Maria Johnson")).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole("button", { name: /add transaction/i }))

      await userEvent.type(screen.getByLabelText("Transaction Date"), "2025-04-01")
      await userEvent.type(screen.getByLabelText("Account Number"), "1111-2222-3333")
      await userEvent.type(screen.getByLabelText("Account Holder Name"), "Jane Doe")
      await userEvent.type(screen.getByLabelText("Amount"), "250.00")

      await userEvent.click(screen.getByRole("button", { name: /save transaction/i }))

      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeInTheDocument()
      })
    })

    it("displays field-level errors from the backend", async () => {
      // First call: GET success
      // Second call: POST with validation errors
      vi.stubGlobal("fetch", vi.fn().mockImplementation((_url: string, options?: RequestInit) => {
        if (options?.method === "POST") {
          return Promise.resolve({
            ok: false,
            json: () =>
              Promise.resolve({
                error: "Validation failed",
                details: {
                  amount: "Amount must be greater than zero",
                  accountNumber: "Account number is required",
                },
              }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(SAMPLE_TRANSACTIONS),
        })
      }))

      render(<TransactionManagement />)

      await waitFor(() => {
        expect(screen.getByText("Maria Johnson")).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole("button", { name: /add transaction/i }))

      // Fill form with values that pass client validation but fail server validation
      await userEvent.type(screen.getByLabelText("Transaction Date"), "2025-04-01")
      await userEvent.type(screen.getByLabelText("Account Number"), "x")
      await userEvent.type(screen.getByLabelText("Account Holder Name"), "Jane Doe")
      await userEvent.type(screen.getByLabelText("Amount"), "1")

      await userEvent.click(screen.getByRole("button", { name: /save transaction/i }))

      await waitFor(() => {
        expect(screen.getByText("Amount must be greater than zero")).toBeInTheDocument()
        expect(screen.getByText("Account number is required")).toBeInTheDocument()
      })
    })
  })
})
