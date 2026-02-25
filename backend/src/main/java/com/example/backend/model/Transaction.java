package com.example.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    private LocalDate transactionDate;
    private String accountNumber;
    private String accountHolderName;
    private BigDecimal amount;
    private TransactionStatus status;
}
