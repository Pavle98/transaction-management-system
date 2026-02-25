package com.example.backend.service;

import com.example.backend.model.Transaction;
import com.example.backend.model.TransactionStatus;
import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Slf4j
@Service
public class TransactionService {

    private static final int EXPECTED_COLUMN_COUNT = 5;
    private static final TransactionStatus[] STATUSES = TransactionStatus.values();

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final String csvFilePath;

    public TransactionService(@Value("${csv.file.path}") String csvFilePath) {
        this.csvFilePath = csvFilePath;
    }

    public List<Transaction> getAllTransactions() {
        lock.readLock().lock();
        try (CSVReader reader = new CSVReader(new FileReader(csvFilePath))) {
            reader.readNext(); // skip header

            List<Transaction> transactions = new ArrayList<>();
            String[] line;
            int rowNumber = 1;

            while ((line = reader.readNext()) != null) {
                rowNumber++;
                try {
                    transactions.add(parseTransaction(line, rowNumber));
                } catch (Exception e) {
                    log.warn("Skipping malformed CSV row {}: {}", rowNumber, e.getMessage());
                }
            }

            log.info("Loaded {} transactions from CSV", transactions.size());
            return transactions;
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read CSV file", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV file", e);
        } finally {
            lock.readLock().unlock();
        }
    }

    public Transaction addTransaction(Transaction transaction) {
        TransactionStatus status = STATUSES[ThreadLocalRandom.current().nextInt(STATUSES.length)];

        Transaction newTransaction = new Transaction(
                transaction.getTransactionDate(),
                transaction.getAccountNumber().trim(),
                transaction.getAccountHolderName().trim(),
                transaction.getAmount(),
                status
        );

        lock.writeLock().lock();
        try (CSVWriter writer = new CSVWriter(new FileWriter(csvFilePath, true),
                CSVWriter.DEFAULT_SEPARATOR,
                CSVWriter.NO_QUOTE_CHARACTER,
                CSVWriter.DEFAULT_ESCAPE_CHARACTER,
                CSVWriter.DEFAULT_LINE_END)) {
            writer.writeNext(toRow(newTransaction));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to write to CSV file", e);
        } finally {
            lock.writeLock().unlock();
        }

        log.info("Transaction added for account {} with status {}", newTransaction.getAccountNumber(), status);
        return newTransaction;
    }

    private Transaction parseTransaction(String[] line, int rowNumber) {
        if (line.length < EXPECTED_COLUMN_COUNT) {
            throw new IllegalArgumentException(
                    "Row " + rowNumber + " has " + line.length + " columns, expected " + EXPECTED_COLUMN_COUNT
            );
        }

        return new Transaction(
                LocalDate.parse(line[0].trim()),
                line[1].trim(),
                line[2].trim(),
                new BigDecimal(line[3].trim()),
                TransactionStatus.valueOf(line[4].trim())
        );
    }

    private String[] toRow(Transaction transaction) {
        return new String[]{
                transaction.getTransactionDate().toString(),
                transaction.getAccountNumber(),
                transaction.getAccountHolderName(),
                transaction.getAmount().toPlainString(),
                transaction.getStatus().name()
        };
    }
}
