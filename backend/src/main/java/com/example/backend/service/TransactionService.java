package com.example.backend.service;

import com.example.backend.model.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionService {

    List<Transaction> getAllTransactions();

    Transaction addTransaction(LocalDate transactionDate, String accountNumber,
                               String accountHolderName, BigDecimal amount);
}
