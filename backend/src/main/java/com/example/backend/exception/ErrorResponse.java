package com.example.backend.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(String error, Map<String, String> details) {

    public ErrorResponse(String error) {
        this(error, null);
    }
}
