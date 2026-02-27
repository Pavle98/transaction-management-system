package com.example.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@SpringBootTest
class TransactionManagementApplicationIntegrationTest {

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) throws IOException {
        Path csvFile = Files.createTempFile("transactions-test", ".csv");
        Files.write(csvFile, List.of("Transaction Date,Account Number,Account Holder Name,Amount,Status"));
        registry.add("csv.file.path", () -> csvFile.toString());
    }

    @Test
    void contextLoads() {
    }
}
