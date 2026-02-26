package com.example.backend.dto;

import com.example.backend.model.TransactionStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(
        LocalDate transactionDate,
        String accountNumber,
        String accountHolderName,
        BigDecimal amount,
        TransactionStatus status
) {}
