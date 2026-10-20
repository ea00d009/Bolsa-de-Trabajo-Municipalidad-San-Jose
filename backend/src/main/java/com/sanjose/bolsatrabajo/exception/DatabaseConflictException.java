package com.sanjose.bolsatrabajo.exception;

public class DatabaseConflictException extends RuntimeException {
    public DatabaseConflictException(String message) {
        super(message);
    }
}
