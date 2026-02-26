package com.example.backend.repository;

import com.example.backend.model.Transaction;
import com.example.backend.model.TransactionStatus;
import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;
import com.opencsv.exceptions.CsvValidationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Slf4j
@Repository
public class CsvTransactionRepository implements TransactionRepository {

    private static final int EXPECTED_COLUMN_COUNT = 5;

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final String csvFilePath;

    public CsvTransactionRepository(@Value("${csv.file.path}") String csvFilePath) {
        this.csvFilePath = csvFilePath;
    }

    @PostConstruct
    void validateCsvFile() {
        Path path = Path.of(csvFilePath);
        if (!Files.exists(path)) {
            throw new IllegalStateException("CSV file not found: " + path.toAbsolutePath());
        }
        if (!Files.isReadable(path)) {
            throw new IllegalStateException("CSV file is not readable: " + path.toAbsolutePath());
        }
        if (!Files.isWritable(path)) {
            throw new IllegalStateException("CSV file is not writable: " + path.toAbsolutePath());
        }
        log.info("CSV file validated: {}", path.toAbsolutePath());
    }

    @Override
    public List<Transaction> findAll() {
        lock.readLock().lock();
        try (CSVReader reader = new CSVReader(new FileReader(csvFilePath, StandardCharsets.UTF_8))) {
            reader.readNext(); // skip header

            List<Transaction> transactions = new ArrayList<>();
            String[] line;
            int rowNumber = 1;

            while ((line = reader.readNext()) != null) {
                rowNumber++;
                try {
                    transactions.add(parseTransaction(line, rowNumber));
                } catch (DateTimeParseException | IllegalArgumentException e) {
                    log.warn("Skipping malformed CSV row {}: {}", rowNumber, e.getMessage());
                }
            }

            log.info("Loaded {} transactions from CSV", transactions.size());
            return transactions;
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read CSV file", e);
        } catch (CsvValidationException e) {
            throw new IllegalStateException("CSV validation failed", e);
        } finally {
            lock.readLock().unlock();
        }
    }

    @Override
    public void save(Transaction transaction) {
        lock.writeLock().lock();
        try (CSVWriter writer = new CSVWriter(new FileWriter(csvFilePath, StandardCharsets.UTF_8, true),
                CSVWriter.DEFAULT_SEPARATOR,
                CSVWriter.NO_QUOTE_CHARACTER,
                CSVWriter.DEFAULT_ESCAPE_CHARACTER,
                CSVWriter.DEFAULT_LINE_END)) {
            writer.writeNext(toRow(transaction));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to write to CSV file", e);
        } finally {
            lock.writeLock().unlock();
        }
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
                TransactionStatus.fromString(line[4].trim())
        );
    }

    private String[] toRow(Transaction transaction) {
        return new String[]{
                transaction.getTransactionDate().toString(),
                transaction.getAccountNumber(),
                transaction.getAccountHolderName(),
                transaction.getAmount().setScale(2, RoundingMode.HALF_UP).toPlainString(),
                transaction.getStatus().getDisplayName()
        };
    }
}
