package com.sanjose.bolsatrabajo.controller;

import com.sanjose.bolsatrabajo.entity.Rubro;
import com.sanjose.bolsatrabajo.repository.RubroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rubros")
public class RubroController {

    @Autowired
    private RubroRepository rubroRepository;

    @GetMapping
    public ResponseEntity<List<Rubro>> listarActivos() {
        List<Rubro> rubros = rubroRepository.findByActivoTrue();
        return ResponseEntity.ok(rubros);
    }

    @PostMapping
    public ResponseEntity<?> guardar(@RequestBody Rubro rubro) {
        if (rubro.getNombre() == null || rubro.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El nombre del rubro no puede estar vacío.");
        }
        rubro.setNombre(rubro.getNombre().trim());
        Rubro guardado = rubroRepository.save(rubro);
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Integer id, @RequestBody Rubro rubro) {
        return rubroRepository.findById(id)
            .map(existing -> {
                if (rubro.getNombre() == null || rubro.getNombre().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("El nombre del rubro no puede estar vacío.");
                }
                existing.setNombre(rubro.getNombre().trim());
                Rubro guardado = rubroRepository.save(existing);
                return ResponseEntity.ok(guardado);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Integer id) {
        return rubroRepository.findById(id)
            .map(existing -> {
                existing.setActivo(false);
                rubroRepository.save(existing);
                return ResponseEntity.ok().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
