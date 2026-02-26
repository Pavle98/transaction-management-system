package com.example.backend.model;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
@EqualsAndHashCode
@ToString
public class Transaction {

    private final LocalDate transactionDate;
    private final String accountNumber;
    private final String accountHolderName;
    private final BigDecimal amount;
    private final TransactionStatus status;
}
