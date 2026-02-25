package com.example.backend.service;

import com.example.backend.model.Transaction;
import com.example.backend.model.TransactionStatus;
import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;
import com.opencsv.exceptions.CsvValidationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Service
public class TransactionService {

    private static final TransactionStatus[] STATUSES = TransactionStatus.values();

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final String csvFilePath;

    public TransactionService(@Value("${csv.file.path}") String csvFilePath) {
        this.csvFilePath = csvFilePath;
    }

    public List<Transaction> getAllTransactions() throws IOException, CsvValidationException {
        lock.readLock().lock();
        try (CSVReader reader = new CSVReader(new FileReader(csvFilePath))) {
            reader.readNext(); // skip header

            List<Transaction> transactions = new ArrayList<>();
            String[] line;

            while ((line = reader.readNext()) != null) {
                transactions.add(parseTransaction(line));
            }

            return transactions;
        } finally {
            lock.readLock().unlock();
        }
    }

    public Transaction addTransaction(Transaction transaction) throws IOException {
        TransactionStatus status = STATUSES[ThreadLocalRandom.current().nextInt(STATUSES.length)];

        Transaction newTransaction = new Transaction(
                transaction.getTransactionDate(),
                transaction.getAccountNumber(),
                transaction.getAccountHolderName(),
                transaction.getAmount(),
                status
        );

        lock.writeLock().lock();
        try (CSVWriter writer = new CSVWriter(new FileWriter(csvFilePath, true))) {
            writer.writeNext(toRow(newTransaction));
        } finally {
            lock.writeLock().unlock();
        }

        return newTransaction;
    }

    private Transaction parseTransaction(String[] line) {
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
