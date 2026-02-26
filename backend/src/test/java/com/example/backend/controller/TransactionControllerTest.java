package com.example.backend.controller;

import com.example.backend.model.Transaction;
import com.example.backend.model.TransactionStatus;
import com.example.backend.service.TransactionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TransactionController.class)
class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TransactionService transactionService;

    @Nested
    @DisplayName("GET /transactions")
    class GetTransactions {

        @Test
        @DisplayName("returns 200 with list of transactions")
        void returnsTransactions() throws Exception {
            List<Transaction> transactions = List.of(
                    new Transaction(LocalDate.of(2025, 3, 1), "1111-2222-3333", "Jane Doe", new BigDecimal("150.00"), TransactionStatus.SETTLED),
                    new Transaction(LocalDate.of(2025, 3, 2), "4444-5555-6666", "John Smith", new BigDecimal("250.00"), TransactionStatus.PENDING)
            );
            when(transactionService.getAllTransactions()).thenReturn(transactions);

            mockMvc.perform(get("/transactions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(2)))
                    .andExpect(jsonPath("$[0].transactionDate", is("2025-03-01")))
                    .andExpect(jsonPath("$[0].accountHolderName", is("Jane Doe")))
                    .andExpect(jsonPath("$[0].amount", is(150.00)))
                    .andExpect(jsonPath("$[0].status", is("Settled")))
                    .andExpect(jsonPath("$[1].status", is("Pending")));
        }

        @Test
        @DisplayName("returns 200 with empty list when no transactions exist")
        void returnsEmptyList() throws Exception {
            when(transactionService.getAllTransactions()).thenReturn(List.of());

            mockMvc.perform(get("/transactions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        @DisplayName("returns 500 when service throws exception")
        void returnsServerError() throws Exception {
            when(transactionService.getAllTransactions()).thenThrow(new RuntimeException("CSV read failed"));

            mockMvc.perform(get("/transactions"))
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.error", is("An unexpected error occurred")));
        }
    }

    @Nested
    @DisplayName("POST /transactions")
    class AddTransaction {

        @Test
        @DisplayName("returns 201 with valid transaction")
        void createsTransaction() throws Exception {
            Transaction saved = new Transaction(LocalDate.of(2025, 3, 15), "1111-2222-3333", "Jane Doe", new BigDecimal("250.00"), TransactionStatus.PENDING);
            when(transactionService.addTransaction(any(LocalDate.class), any(String.class), any(String.class), any(BigDecimal.class))).thenReturn(saved);

            mockMvc.perform(post("/transactions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "transactionDate": "2025-03-15",
                                      "accountNumber": "1111-2222-3333",
                                      "accountHolderName": "Jane Doe",
                                      "amount": 250.00
                                    }
                                    """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.accountHolderName", is("Jane Doe")))
                    .andExpect(jsonPath("$.status", is("Pending")));
        }

        @Test
        @DisplayName("returns 400 when required fields are missing")
        void rejectsMissingFields() throws Exception {
            mockMvc.perform(post("/transactions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error", is("Validation failed")))
                    .andExpect(jsonPath("$.details.transactionDate", is("Transaction date is required")))
                    .andExpect(jsonPath("$.details.accountNumber", is("Account number is required")))
                    .andExpect(jsonPath("$.details.accountHolderName", is("Account holder name is required")))
                    .andExpect(jsonPath("$.details.amount", is("Amount is required")));
        }

        @Test
        @DisplayName("returns 400 when amount is negative")
        void rejectsNegativeAmount() throws Exception {
            mockMvc.perform(post("/transactions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "transactionDate": "2025-03-15",
                                      "accountNumber": "1111-2222-3333",
                                      "accountHolderName": "Jane Doe",
                                      "amount": -50.00
                                    }
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.details.amount", is("Amount must be greater than zero")));
        }

        @Test
        @DisplayName("returns 400 when amount is zero")
        void rejectsZeroAmount() throws Exception {
            mockMvc.perform(post("/transactions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "transactionDate": "2025-03-15",
                                      "accountNumber": "1111-2222-3333",
                                      "accountHolderName": "Jane Doe",
                                      "amount": 0
                                    }
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.details.amount", is("Amount must be greater than zero")));
        }

        @Test
        @DisplayName("returns 400 when account number is blank")
        void rejectsBlankAccountNumber() throws Exception {
            mockMvc.perform(post("/transactions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "transactionDate": "2025-03-15",
                                      "accountNumber": "   ",
                                      "accountHolderName": "Jane Doe",
                                      "amount": 100.00
                                    }
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.details.accountNumber", is("Account number is required")));
        }

        @Test
        @DisplayName("returns 400 when body is malformed JSON")
        void rejectsMalformedJson() throws Exception {
            mockMvc.perform(post("/transactions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("not json"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error", is("Invalid request body")));
        }

        @Test
        @DisplayName("returns 400 when account number contains commas")
        void rejectsCommaInAccountNumber() throws Exception {
            mockMvc.perform(post("/transactions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "transactionDate": "2025-03-15",
                                      "accountNumber": "1111,2222,3333",
                                      "accountHolderName": "Jane Doe",
                                      "amount": 100.00
                                    }
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.details.accountNumber", is("Account number must not contain commas")));
        }

        @Test
        @DisplayName("returns 400 when account holder name contains commas")
        void rejectsCommaInAccountHolderName() throws Exception {
            mockMvc.perform(post("/transactions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "transactionDate": "2025-03-15",
                                      "accountNumber": "1111-2222-3333",
                                      "accountHolderName": "Smith, John",
                                      "amount": 100.00
                                    }
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.details.accountHolderName", is("Account holder name must not contain commas")));
        }

        @Test
        @DisplayName("returns 400 when date format is invalid")
        void rejectsInvalidDateFormat() throws Exception {
            mockMvc.perform(post("/transactions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "transactionDate": "15-03-2025",
                                      "accountNumber": "1111-2222-3333",
                                      "accountHolderName": "Jane Doe",
                                      "amount": 100.00
                                    }
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error", is("Invalid request body")));
        }
    }
}
