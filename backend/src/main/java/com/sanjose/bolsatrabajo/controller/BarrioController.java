package com.sanjose.bolsatrabajo.controller;

import com.sanjose.bolsatrabajo.entity.Barrio;
import com.sanjose.bolsatrabajo.repository.BarrioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/barrios")
public class BarrioController {

    @Autowired
    private BarrioRepository barrioRepository;

    @GetMapping
    public ResponseEntity<List<Barrio>> listarActivos() {
        List<Barrio> barrios = barrioRepository.findByActivoTrueOrderByNombreAsc();
        return ResponseEntity.ok(barrios);
    }

    @PostMapping
    public ResponseEntity<?> guardar(@RequestBody Barrio barrio) {
        if (barrio.getNombre() == null || barrio.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El nombre del barrio no puede estar vacío.");
        }
        barrio.setNombre(barrio.getNombre().trim());
        Barrio guardado = barrioRepository.save(barrio);
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Integer id, @RequestBody Barrio barrio) {
        return barrioRepository.findById(id)
            .map(existing -> {
                if (barrio.getNombre() == null || barrio.getNombre().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("El nombre del barrio no puede estar vacío.");
                }
                existing.setNombre(barrio.getNombre().trim());
                Barrio guardado = barrioRepository.save(existing);
                return ResponseEntity.ok(guardado);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Integer id) {
        return barrioRepository.findById(id)
            .map(existing -> {
                existing.setActivo(false);
                barrioRepository.save(existing);
                return ResponseEntity.ok().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
