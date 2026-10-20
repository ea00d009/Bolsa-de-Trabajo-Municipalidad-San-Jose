package com.sanjose.bolsatrabajo.controller;

import com.sanjose.bolsatrabajo.entity.Ciudadano;
import com.sanjose.bolsatrabajo.entity.Entrevista;
import com.sanjose.bolsatrabajo.entity.User;
import com.sanjose.bolsatrabajo.repository.CiudadanoRepository;
import com.sanjose.bolsatrabajo.repository.EntrevistaRepository;
import com.sanjose.bolsatrabajo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/entrevistas")
public class EntrevistaController {

    @Autowired
    private EntrevistaRepository entrevistaRepository;

    @Autowired
    private CiudadanoRepository ciudadanoRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Map<String, Object> payload) {
        Integer ciudadanoId = (Integer) payload.get("ciudadanoId");
        String objetivo = (String) payload.get("objetivoConsulta");
        String observaciones = (String) payload.get("observacionesTecnicas");
        String prioridad = (String) payload.get("prioridadInsercion");
        String estado = (String) payload.get("estadoTramite");

        if (ciudadanoId == null) {
            return ResponseEntity.badRequest().body("El id del ciudadano es obligatorio.");
        }
        if (objetivo == null || objetivo.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El objetivo de la consulta es obligatorio.");
        }

        Ciudadano ciudadano = ciudadanoRepository.findById(ciudadanoId)
                .filter(Ciudadano::getActivo)
                .orElse(null);
        if (ciudadano == null) {
            return ResponseEntity.badRequest().body("Ciudadano no encontrado o inactivo.");
        }

        // Obtener el entrevistador logueado
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("No autorizado.");
        }
        String username = auth.getName();
        User personal = userRepository.findByUsername(username).orElse(null);
        if (personal == null) {
            return ResponseEntity.status(401).body("Entrevistador no encontrado.");
        }

        Entrevista entrevista = new Entrevista();
        entrevista.setCiudadano(ciudadano);
        entrevista.setPersonal(personal);
        entrevista.setFechaEntrevista(LocalDateTime.now());
        entrevista.setObjetivoConsulta(objetivo.trim());
        entrevista.setObservacionesTecnicas(observaciones != null ? observaciones.trim() : "");
        entrevista.setPrioridadInsercion(prioridad != null ? prioridad.trim() : "MEDIA");
        entrevista.setEstadoTramite(estado != null ? estado.trim() : "PENDIENTE");
        entrevista.setActivo(true);

        Entrevista guardada = entrevistaRepository.save(entrevista);
        return ResponseEntity.ok(guardada);
    }
}
