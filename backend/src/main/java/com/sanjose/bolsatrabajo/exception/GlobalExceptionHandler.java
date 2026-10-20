package com.sanjose.bolsatrabajo.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, String>> handleValidation(ValidationException ex) {
        // Log WARN: Situación esperada de negocio (error de usuario al ingresar datos)
        logger.warn("AVISO DE VALIDACION: {}", ex.getMessage());
        
        Map<String, String> response = new HashMap<>();
        response.put("error", "VALIDACION_FALLIDA");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException ex) {
        // Log WARN: Recurso solicitado inexistente
        logger.warn("RECURSO NO ENCONTRADO: {}", ex.getMessage());
        
        Map<String, String> response = new HashMap<>();
        response.put("error", "NO_ENCONTRADO");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(DatabaseConflictException.class)
    public ResponseEntity<Map<String, String>> handleConflict(DatabaseConflictException ex) {
        // Log ERROR: Conflicto de unicidad en la base de datos (auditoría técnica necesaria)
        logger.error("CONFLICTO DE BASE DE DATOS: {}", ex.getMessage());
        
        Map<String, String> response = new HashMap<>();
        response.put("error", "CONFLICTO_DATOS");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception ex) {
        // Log ERROR con StackTrace: Error inesperado en el sistema
        logger.error("ERROR 500 CRITICO: Excepción inesperada en el sistema: {}", ex.getMessage(), ex);
        
        Map<String, String> response = new HashMap<>();
        response.put("error", "ERROR_INTERNO");
        response.put("message", "Ha ocurrido un error inesperado en el servidor.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
