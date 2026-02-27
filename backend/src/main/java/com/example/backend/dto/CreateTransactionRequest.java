package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateTransactionRequest(
        @NotNull(message = "Transaction date is required")
        @PastOrPresent(message = "Transaction date must not be in the future")
        LocalDate transactionDate,

        @NotBlank(message = "Account number is required")
        @Pattern(regexp = "^[^,]*$", message = "Account number must not contain commas")
        String accountNumber,

        @NotBlank(message = "Account holder name is required")
        @Pattern(regexp = "^[\\p{L}\\s'\\-]*$", message = "Account holder name may only contain letters, spaces, hyphens, and apostrophes")
        String accountHolderName,

        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be greater than zero")
        BigDecimal amount
) {}
