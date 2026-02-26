package com.example.backend.repository;

import com.example.backend.model.Transaction;

import java.util.List;

public interface TransactionRepository {

    List<Transaction> findAll();

    void save(Transaction transaction);
}
