# Transaction Management System

A full-stack application for managing transactions. The backend API reads and writes to a CSV file, and the frontend displays the data in a table with the ability to add new transactions.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Java 21, Spring Boot 3.4, Maven, OpenCSV
- **Data Storage:** CSV file

## Project Structure

```
transaction-management-system/
├── backend/
│   └── src/main/java/com/example/backend/
│       ├── controller/        → REST endpoints
│       ├── service/           → Business logic & CSV I/O
│       ├── model/             → Transaction model & status enum
│       ├── config/            → CORS configuration
│       └── exception/         → Global error handling
├── frontend/
│   ├── app/                   → Next.js app router (layout, page, styles)
│   ├── components/            → UI components
│   │   ├── transaction-management.tsx   → Main orchestrator
│   │   ├── transaction-table.tsx        → Table, loading, empty & error states
│   │   ├── add-transaction-dialog.tsx   → Form dialog
│   │   ├── status-badge.tsx             → Status badge with colors
│   │   └── ui/                          → shadcn/ui primitives
│   ├── lib/                   → API client & utilities
│   └── types/                 → TypeScript type definitions
├── data/
│   └── transactions.csv       → CSV data file (12 sample rows)
├── docker-compose.yml         → Runs frontend + backend with health checks
└── README.md
```

## Prerequisites

### Running with Docker (recommended)

- [Docker](https://docs.docker.com/get-docker/) (v20+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

### Running without Docker

- [Java 21](https://adoptium.net/) (JDK, not JRE)
- [Node.js 20+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (comes with Node.js)

> Maven does not need to be installed separately — the project includes a Maven Wrapper (`mvnw`).

## Getting Started

### Option 1: Docker (recommended)

From the project root, run:

```bash
docker compose up --build
```

This will:
- Build and start the backend on **http://localhost:8080**
- Wait for the backend health check to pass
- Build and start the frontend on **http://localhost:3000**

Open **http://localhost:3000** in your browser.

To stop:

```bash
docker compose down
```

### Option 2: Run manually

You need two terminal windows — one for the backend and one for the frontend.

**Terminal 1 — Backend:**

```bash
cd backend
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd` instead of `./mvnw`:

```bash
cd backend
mvnw.cmd spring-boot:run
```

The backend starts on **http://localhost:8080**.

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:3000**.

Open **http://localhost:3000** in your browser.

## Configuration

### Backend (`backend/src/main/resources/application.properties`)

| Property              | Default                    | Description                          |
|-----------------------|----------------------------|--------------------------------------|
| `server.port`         | `8080`                     | Port the API runs on                 |
| `csv.file.path`       | `../data/transactions.csv` | Path to the CSV data file            |
| `cors.allowed-origin` | `http://localhost:3000`    | Allowed origin for CORS              |

### Frontend

| Variable               | Default                  | Description         |
|------------------------|--------------------------|---------------------|
| `NEXT_PUBLIC_API_URL`  | `http://localhost:8080`  | Backend API base URL|

Set this as an environment variable or in a `.env.local` file in the `frontend/` directory.

## API Documentation

### GET /transactions

Retrieves all transactions from the CSV file.

**Example Request:**

```
GET http://localhost:8080/transactions
```

**Example Response (200 OK):**

```json
[
  {
    "transactionDate": "2025-03-01",
    "accountNumber": "7289-3445-1121",
    "accountHolderName": "Maria Johnson",
    "amount": 150.00,
    "status": "Settled"
  }
]
```

### POST /transactions

Adds a new transaction. The status is randomly assigned by the server (Pending, Settled, or Failed).

**Request Body:**

```json
{
  "transactionDate": "2025-03-15",
  "accountNumber": "1111-2222-3333",
  "accountHolderName": "Jane Doe",
  "amount": 250.00
}
```

**Example Response (201 Created):**

```json
{
  "transactionDate": "2025-03-15",
  "accountNumber": "1111-2222-3333",
  "accountHolderName": "Jane Doe",
  "amount": 250.00,
  "status": "Pending"
}
```

### Validation Rules

| Field                | Rule                                      |
|----------------------|-------------------------------------------|
| `transactionDate`    | Required, format `YYYY-MM-DD`             |
| `accountNumber`      | Required, must not be blank or contain commas |
| `accountHolderName`  | Required, must not be blank or contain commas |
| `amount`             | Required, must be greater than zero       |
| `status`             | Ignored on input — assigned randomly by the server |

### Error Responses

**Validation error (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "details": {
    "accountNumber": "Account number is required",
    "amount": "Amount must be greater than zero"
  }
}
```

The `details` map contains one entry per invalid field, with the field name as the key and the validation message as the value. The frontend displays these as inline errors below each form field.

**Malformed request body (400 Bad Request):**

```json
{
  "error": "Invalid request body"
}
```

**Server error (500 Internal Server Error):**

```json
{
  "error": "An unexpected error occurred"
}
```

## Testing

### Run the automated tests

**Backend tests** (26 tests — unit, controller, and integration):

```bash
cd backend
./mvnw test
```

On Windows:

```bash
cd backend
mvnw.cmd test
```

**Frontend tests** (13 tests — component integration):

```bash
cd frontend
npm test
```

### Test the API manually

With the backend running, you can test using `curl`:

**Get all transactions:**

```bash
curl http://localhost:8080/transactions
```

**Add a transaction:**

```bash
curl -X POST http://localhost:8080/transactions \
  -H "Content-Type: application/json" \
  -d '{"transactionDate":"2025-03-15","accountNumber":"1111-2222-3333","accountHolderName":"Jane Doe","amount":250.00}'
```

### Test the UI

1. Open **http://localhost:3000**
2. Verify the transaction table loads with the sample data (12 rows)
3. Click **Add Transaction**, fill in the form, and click **Save Transaction**
4. Verify the new transaction appears in the table with a randomly assigned status

## Troubleshooting

| Problem | Solution |
|---|---|
| `Port 8080 already in use` | Stop the process using port 8080, or change `server.port` in `application.properties` |
| `Port 3000 already in use` | Stop the process using port 3000, or run the frontend with `PORT=3001 npm run dev` |
| `CSV file not found` on backend startup | Ensure the `data/transactions.csv` file exists. The default path is `../data/transactions.csv` relative to the `backend/` directory |
| `CORS error` in browser console | Ensure the backend's `cors.allowed-origin` matches the frontend URL (default: `http://localhost:3000`) |
| `mvnw: Permission denied` | Run `chmod +x mvnw` in the `backend/` directory |
| `Java version error` | Ensure Java 21 is installed: `java -version` |
| `Node version error` | Ensure Node.js 20+ is installed: `node -v` |
