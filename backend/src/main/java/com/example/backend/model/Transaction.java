package com.example.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    private String transactionDate;
    private String accountNumber;
    private String accountHolderName;
    private double amount;
    private String status;
}
