package com.sanjose.bolsatrabajo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/catalogos-config")
public class CatalogoConfigController {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final File configFile = Paths.get("catalogos-config.json").toFile();

    private static final List<String> DEFAULT_NIVELES = Arrays.asList(
            "Primario", "Secundario", "Terciario", "Universitario", "Posgrado"
    );

    private static final List<String> DEFAULT_ESTADOS = Arrays.asList(
            "Entrevista", "Empleado", "En búsqueda activa", "Rechazado", "Programa Social", "Desempleado"
    );

    @GetMapping
    public synchronized ResponseEntity<Map<String, List<String>>> getConfig() {
        return ResponseEntity.ok(loadOrCreateDefault());
    }

    @PutMapping
    @SuppressWarnings("unchecked")
    public synchronized ResponseEntity<Map<String, List<String>>> updateConfig(@RequestBody Map<String, List<String>> payload) {
        Map<String, List<String>> current = loadOrCreateDefault();
        if (payload.containsKey("nivelesEducativos") && payload.get("nivelesEducativos") != null) {
            current.put("nivelesEducativos", payload.get("nivelesEducativos"));
        }
        if (payload.containsKey("estadosLaborales") && payload.get("estadosLaborales") != null) {
            current.put("estadosLaborales", payload.get("estadosLaborales"));
        }
        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(configFile, current);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
        return ResponseEntity.ok(current);
    }

    @SuppressWarnings("unchecked")
    private Map<String, List<String>> loadOrCreateDefault() {
        if (configFile.exists()) {
            try {
                Map<String, List<String>> data = objectMapper.readValue(configFile, Map.class);
                if (!data.containsKey("nivelesEducativos")) {
                    data.put("nivelesEducativos", DEFAULT_NIVELES);
                }
                if (!data.containsKey("estadosLaborales")) {
                    data.put("estadosLaborales", DEFAULT_ESTADOS);
                }
                return data;
            } catch (Exception ignored) {
            }
        }
        Map<String, List<String>> defaults = new HashMap<>();
        defaults.put("nivelesEducativos", DEFAULT_NIVELES);
        defaults.put("estadosLaborales", DEFAULT_ESTADOS);
        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(configFile, defaults);
        } catch (Exception ignored) {
        }
        return defaults;
    }
}
