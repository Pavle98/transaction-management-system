package com.example.backend;

import com.example.backend.model.TransactionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TransactionIntegrationTest {

    private static Path csvFile;

    @Autowired
    private MockMvc mockMvc;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) throws IOException {
        csvFile = Files.createTempFile("transactions-test", ".csv");
        registry.add("csv.file.path", () -> csvFile.toString());
    }

    @BeforeEach
    void resetCsv() throws IOException {
        Files.write(csvFile, List.of(
                "Transaction Date,Account Number,Account Holder Name,Amount,Status",
                "2025-03-01,1111-2222-3333,Jane Doe,150.00,Settled",
                "2025-03-02,4444-5555-6666,John Smith,250.00,Pending"
        ));
    }

    @Test
    @DisplayName("GET /transactions returns all transactions from CSV")
    void getAllTransactions() throws Exception {
        mockMvc.perform(get("/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].transactionDate", is("2025-03-01")))
                .andExpect(jsonPath("$[0].accountNumber", is("1111-2222-3333")))
                .andExpect(jsonPath("$[0].accountHolderName", is("Jane Doe")))
                .andExpect(jsonPath("$[0].amount", is(150.00)))
                .andExpect(jsonPath("$[0].status", is("Settled")))
                .andExpect(jsonPath("$[1].accountHolderName", is("John Smith")))
                .andExpect(jsonPath("$[1].status", is("Pending")));
    }

    @Test
    @DisplayName("POST /transactions creates transaction and persists to CSV")
    void addTransactionAndVerifyPersistence() throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "transactionDate": "2025-03-15",
                                  "accountNumber": "9999-8888-7777",
                                  "accountHolderName": "Alice Brown",
                                  "amount": 500.00
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.transactionDate", is("2025-03-15")))
                .andExpect(jsonPath("$.accountNumber", is("9999-8888-7777")))
                .andExpect(jsonPath("$.accountHolderName", is("Alice Brown")))
                .andExpect(jsonPath("$.amount", is(500.00)))
                .andExpect(jsonPath("$.status", isIn(
                        Arrays.stream(TransactionStatus.values()).map(TransactionStatus::getDisplayName).toArray()
                )));

        // verify it was persisted — GET should now return 3
        mockMvc.perform(get("/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[2].accountHolderName", is("Alice Brown")));
    }

    @Test
    @DisplayName("POST /transactions rejects invalid input with 400")
    void rejectsInvalidInput() throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "transactionDate": "2025-03-15",
                                  "accountNumber": "",
                                  "accountHolderName": "Alice Brown",
                                  "amount": -10.00
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Validation failed")))
                .andExpect(jsonPath("$.details.accountNumber", is("Account number is required")))
                .andExpect(jsonPath("$.details.amount", is("Amount must be greater than zero")));

        // verify nothing was persisted — GET should still return 2
        mockMvc.perform(get("/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }
}
