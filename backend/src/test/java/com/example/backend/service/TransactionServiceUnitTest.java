package com.example.backend.service;

import com.example.backend.model.Transaction;
import com.example.backend.model.TransactionStatus;
import com.example.backend.repository.TransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceUnitTest {

    @Mock
    private TransactionRepository repository;

    @InjectMocks
    private TransactionServiceImpl service;

    @Test
    @DisplayName("getAllTransactions delegates to repository")
    void delegatesToRepository() {
        List<Transaction> expected = List.of(
                new Transaction(LocalDate.of(2025, 3, 1), "1111-2222-3333", "Jane Doe", new BigDecimal("150.00"), TransactionStatus.SETTLED)
        );
        when(repository.findAll()).thenReturn(expected);

        List<Transaction> result = service.getAllTransactions();

        assertEquals(expected, result);
        verify(repository).findAll();
    }

    @Test
    @DisplayName("addTransaction assigns a random status from the enum")
    void assignsRandomStatus() {
        Transaction result = service.addTransaction(
                LocalDate.of(2025, 3, 15), "1111-2222-3333", "Jane Doe", new BigDecimal("100.00")
        );

        assertNotNull(result.getStatus());
        assertTrue(
                result.getStatus() == TransactionStatus.PENDING ||
                result.getStatus() == TransactionStatus.SETTLED ||
                result.getStatus() == TransactionStatus.FAILED
        );
        verify(repository).save(any(Transaction.class));
    }

    @Test
    @DisplayName("addTransaction trims whitespace from string fields")
    void trimsWhitespace() {
        Transaction result = service.addTransaction(
                LocalDate.of(2025, 3, 15), "  1111-2222-3333  ", "  Jane Doe  ", new BigDecimal("100.00")
        );

        assertEquals("1111-2222-3333", result.getAccountNumber());
        assertEquals("Jane Doe", result.getAccountHolderName());
    }

    @Test
    @DisplayName("addTransaction preserves date and amount from input")
    void preservesInputFields() {
        Transaction result = service.addTransaction(
                LocalDate.of(2025, 3, 15), "1111-2222-3333", "Jane Doe", new BigDecimal("250.00")
        );

        assertEquals(LocalDate.of(2025, 3, 15), result.getTransactionDate());
        assertEquals(new BigDecimal("250.00"), result.getAmount());
    }

    @Test
    @DisplayName("addTransaction normalizes amount to two decimal places")
    void normalizesAmountScale() {
        Transaction result = service.addTransaction(
                LocalDate.of(2025, 3, 15), "1111-2222-3333", "Jane Doe", new BigDecimal("150")
        );

        assertEquals(new BigDecimal("150.00"), result.getAmount());
    }
}
