package com.example.backend.controller;

import com.example.backend.dto.CreateTransactionRequest;
import com.example.backend.dto.TransactionResponse;
import com.example.backend.model.Transaction;
import com.example.backend.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.RoundingMode;
import java.util.List;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAllTransactions() {
        List<TransactionResponse> responses = transactionService.getAllTransactions()
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> addTransaction(@Valid @RequestBody CreateTransactionRequest request) {
        Transaction transaction = transactionService.addTransaction(
                request.transactionDate(),
                request.accountNumber(),
                request.accountHolderName(),
                request.amount()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(transaction));
    }

    private TransactionResponse toResponse(Transaction t) {
        return new TransactionResponse(
                t.getTransactionDate(),
                t.getAccountNumber(),
                t.getAccountHolderName(),
                t.getAmount().setScale(2, RoundingMode.HALF_UP),
                t.getStatus()
        );
    }
}
