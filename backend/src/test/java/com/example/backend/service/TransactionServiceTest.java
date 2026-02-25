package com.example.backend.service;

import com.example.backend.model.Transaction;
import com.example.backend.model.TransactionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TransactionServiceTest {

    @TempDir
    Path tempDir;

    private TransactionService createServiceWithCsv(String... lines) throws IOException {
        Path csvFile = tempDir.resolve("test.csv");
        Files.write(csvFile, Arrays.asList(lines));
        return new TransactionService(csvFile.toString());
    }

    @Nested
    @DisplayName("getAllTransactions")
    class GetAllTransactions {

        @Test
        @DisplayName("reads transactions from CSV correctly")
        void readsTransactions() throws IOException {
            TransactionService service = createServiceWithCsv(
                    "Transaction Date,Account Number,Account Holder Name,Amount,Status",
                    "2025-03-01,1111-2222-3333,Jane Doe,150.00,Settled",
                    "2025-03-02,4444-5555-6666,John Smith,250.00,Pending"
            );

            List<Transaction> transactions = service.getAllTransactions();

            assertEquals(2, transactions.size());

            Transaction first = transactions.get(0);
            assertEquals(LocalDate.of(2025, 3, 1), first.getTransactionDate());
            assertEquals("1111-2222-3333", first.getAccountNumber());
            assertEquals("Jane Doe", first.getAccountHolderName());
            assertEquals(new BigDecimal("150.00"), first.getAmount());
            assertEquals(TransactionStatus.Settled, first.getStatus());

            Transaction second = transactions.get(1);
            assertEquals("John Smith", second.getAccountHolderName());
            assertEquals(TransactionStatus.Pending, second.getStatus());
        }

        @Test
        @DisplayName("returns empty list when CSV has only header")
        void returnsEmptyForHeaderOnly() throws IOException {
            TransactionService service = createServiceWithCsv(
                    "Transaction Date,Account Number,Account Holder Name,Amount,Status"
            );

            List<Transaction> transactions = service.getAllTransactions();

            assertTrue(transactions.isEmpty());
        }

        @Test
        @DisplayName("skips malformed rows and returns valid ones")
        void skipsMalformedRows() throws IOException {
            TransactionService service = createServiceWithCsv(
                    "Transaction Date,Account Number,Account Holder Name,Amount,Status",
                    "2025-03-01,1111-2222-3333,Jane Doe,150.00,Settled",
                    "bad-date,4444-5555-6666,John Smith,250.00,Pending",
                    "2025-03-03,7777-8888-9999,Alice Brown,300.00,Failed"
            );

            List<Transaction> transactions = service.getAllTransactions();

            assertEquals(2, transactions.size());
            assertEquals("Jane Doe", transactions.get(0).getAccountHolderName());
            assertEquals("Alice Brown", transactions.get(1).getAccountHolderName());
        }

        @Test
        @DisplayName("skips rows with too few columns")
        void skipsShortRows() throws IOException {
            TransactionService service = createServiceWithCsv(
                    "Transaction Date,Account Number,Account Holder Name,Amount,Status",
                    "2025-03-01,1111-2222-3333,Jane Doe,150.00,Settled",
                    "2025-03-02,only-two-columns",
                    "2025-03-03,7777-8888-9999,Alice Brown,300.00,Failed"
            );

            List<Transaction> transactions = service.getAllTransactions();

            assertEquals(2, transactions.size());
        }

        @Test
        @DisplayName("throws when CSV file does not exist")
        void throwsForMissingFile() {
            TransactionService service = new TransactionService(tempDir.resolve("nonexistent.csv").toString());

            assertThrows(UncheckedIOException.class, service::getAllTransactions);
        }
    }

    @Nested
    @DisplayName("addTransaction")
    class AddTransaction {

        @Test
        @DisplayName("appends transaction to CSV file")
        void appendsToCsv() throws IOException {
            TransactionService service = createServiceWithCsv(
                    "Transaction Date,Account Number,Account Holder Name,Amount,Status"
            );

            Transaction input = new Transaction(LocalDate.of(2025, 3, 15), "1111-2222-3333", "Jane Doe", new BigDecimal("250.00"), null);
            service.addTransaction(input);

            List<String> lines = Files.readAllLines(tempDir.resolve("test.csv"));
            assertEquals(2, lines.size());

            String dataLine = lines.get(1);
            assertTrue(dataLine.contains("2025-03-15"));
            assertTrue(dataLine.contains("1111-2222-3333"));
            assertTrue(dataLine.contains("Jane Doe"));
            assertTrue(dataLine.contains("250.00"));
        }

        @Test
        @DisplayName("assigns a random status from the enum")
        void assignsRandomStatus() throws IOException {
            TransactionService service = createServiceWithCsv(
                    "Transaction Date,Account Number,Account Holder Name,Amount,Status"
            );

            Transaction input = new Transaction(LocalDate.of(2025, 3, 15), "1111-2222-3333", "Jane Doe", new BigDecimal("100.00"), null);
            Transaction result = service.addTransaction(input);

            assertNotNull(result.getStatus());
            assertTrue(
                    result.getStatus() == TransactionStatus.Pending ||
                    result.getStatus() == TransactionStatus.Settled ||
                    result.getStatus() == TransactionStatus.Failed
            );
        }

        @Test
        @DisplayName("does not mutate the input transaction")
        void doesNotMutateInput() throws IOException {
            TransactionService service = createServiceWithCsv(
                    "Transaction Date,Account Number,Account Holder Name,Amount,Status"
            );

            Transaction input = new Transaction(LocalDate.of(2025, 3, 15), "1111-2222-3333", "Jane Doe", new BigDecimal("100.00"), null);
            Transaction result = service.addTransaction(input);

            assertNull(input.getStatus());
            assertNotNull(result.getStatus());
        }

        @Test
        @DisplayName("trims whitespace from string fields")
        void trimsWhitespace() throws IOException {
            TransactionService service = createServiceWithCsv(
                    "Transaction Date,Account Number,Account Holder Name,Amount,Status"
            );

            Transaction input = new Transaction(LocalDate.of(2025, 3, 15), "  1111-2222-3333  ", "  Jane Doe  ", new BigDecimal("100.00"), null);
            Transaction result = service.addTransaction(input);

            assertEquals("1111-2222-3333", result.getAccountNumber());
            assertEquals("Jane Doe", result.getAccountHolderName());
        }

        @Test
        @DisplayName("written transaction can be read back")
        void roundTrip() throws IOException {
            TransactionService service = createServiceWithCsv(
                    "Transaction Date,Account Number,Account Holder Name,Amount,Status"
            );

            Transaction input = new Transaction(LocalDate.of(2025, 3, 15), "1111-2222-3333", "Jane Doe", new BigDecimal("250.00"), null);
            service.addTransaction(input);

            List<Transaction> transactions = service.getAllTransactions();
            assertEquals(1, transactions.size());

            Transaction read = transactions.get(0);
            assertEquals(LocalDate.of(2025, 3, 15), read.getTransactionDate());
            assertEquals("1111-2222-3333", read.getAccountNumber());
            assertEquals("Jane Doe", read.getAccountHolderName());
            assertEquals(new BigDecimal("250.00"), read.getAmount());
            assertNotNull(read.getStatus());
        }
    }
}
