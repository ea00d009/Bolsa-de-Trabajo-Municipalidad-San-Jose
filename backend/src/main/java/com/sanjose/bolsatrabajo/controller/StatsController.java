package com.sanjose.bolsatrabajo.controller;

import com.sanjose.bolsatrabajo.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @GetMapping
    public ResponseEntity<?> obtenerEstadisticas(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin,
            @RequestParam(required = false) Integer idBarrio,
            @RequestParam(required = false) String nivelEducativo,
            @RequestParam(required = false) String genero) {
        try {
            return ResponseEntity.ok(statsService.obtenerEstadisticas(fechaInicio, fechaFin, idBarrio, nivelEducativo, genero));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
