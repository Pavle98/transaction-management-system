package com.example.backend.service;

import com.example.backend.model.Transaction;
import com.example.backend.model.TransactionStatus;
import com.example.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private static final TransactionStatus[] STATUSES = TransactionStatus.values();

    private final TransactionRepository repository;

    @Override
    public List<Transaction> getAllTransactions() {
        return repository.findAll();
    }

    @Override
    public Transaction addTransaction(LocalDate transactionDate, String accountNumber,
                                      String accountHolderName, BigDecimal amount) {
        TransactionStatus status = STATUSES[ThreadLocalRandom.current().nextInt(STATUSES.length)];

        Transaction transaction = new Transaction(
                transactionDate,
                accountNumber.trim(),
                accountHolderName.trim(),
                amount.setScale(2, RoundingMode.HALF_UP),
                status
        );

        repository.save(transaction);

        log.info("Transaction added for account {} — amount: {}, status: {}",
                transaction.getAccountNumber(), transaction.getAmount(), status);

        return transaction;
    }
}
