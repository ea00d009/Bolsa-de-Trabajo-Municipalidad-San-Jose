package com.sanjose.bolsatrabajo.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class StatsService {

    @PersistenceContext
    private EntityManager entityManager;

    public Map<String, Object> obtenerEstadisticas(String fechaInicio, String fechaFin, Integer idBarrio, String nivelEducativo, String genero) {
        Map<String, Object> stats = new HashMap<>();

        // Build JPQL filter snippet
        StringBuilder filterJpql = new StringBuilder();
        Map<String, Object> params = new HashMap<>();

        if (fechaInicio != null && !fechaInicio.trim().isEmpty()) {
            filterJpql.append(" AND c.fechaRegistro >= :fechaInicio");
            params.put("fechaInicio", LocalDate.parse(fechaInicio).atStartOfDay());
        }
        if (fechaFin != null && !fechaFin.trim().isEmpty()) {
            filterJpql.append(" AND c.fechaRegistro <= :fechaFin");
            params.put("fechaFin", LocalDate.parse(fechaFin).atTime(23, 59, 59));
        }
        if (idBarrio != null) {
            filterJpql.append(" AND c.barrio.id = :idBarrio");
            params.put("idBarrio", idBarrio);
        }
        if (nivelEducativo != null && !nivelEducativo.trim().isEmpty()) {
            filterJpql.append(" AND EXISTS (SELECT ed FROM Educacion ed WHERE ed.ciudadano = c AND ed.activo = true AND ed.nivelAlcanzado = :nivelEducativo)");
            params.put("nivelEducativo", nivelEducativo);
        }
        if (genero != null && !genero.trim().isEmpty()) {
            filterJpql.append(" AND c.genero = :genero");
            params.put("genero", genero);
        }

        // Build Native SQL filter snippet (note table prefix c.)
        StringBuilder filterNative = new StringBuilder();
        if (fechaInicio != null && !fechaInicio.trim().isEmpty()) {
            filterNative.append(" AND c.fecha_registro >= :fechaInicio");
        }
        if (fechaFin != null && !fechaFin.trim().isEmpty()) {
            filterNative.append(" AND c.fecha_registro <= :fechaFin");
        }
        if (idBarrio != null) {
            filterNative.append(" AND c.id_barrio = :idBarrio");
        }
        if (nivelEducativo != null && !nivelEducativo.trim().isEmpty()) {
            filterNative.append(" AND EXISTS (SELECT 1 FROM educacion ed WHERE ed.id_ciudadano = c.id AND ed.activo = true AND ed.nivel_alcanzado = :nivelEducativo)");
        }
        if (genero != null && !genero.trim().isEmpty()) {
            filterNative.append(" AND c.genero = :genero");
        }

        // 1. Total
        Query qTotal = entityManager.createQuery("SELECT COUNT(c) FROM Ciudadano c WHERE c.activo = true" + filterJpql.toString());
        applyFiltersToQuery(qTotal, params);
        Long total = (Long) qTotal.getSingleResult();
        stats.put("total", total);

        // 2. Última semana
        LocalDateTime unaSemanaAtras = LocalDateTime.now().minusDays(7);
        Query qLastWeek = entityManager.createQuery("SELECT COUNT(c) FROM Ciudadano c WHERE c.activo = true AND c.fechaRegistro >= :fecha" + filterJpql.toString());
        qLastWeek.setParameter("fecha", unaSemanaAtras);
        applyFiltersToQuery(qLastWeek, params);
        Long lastWeek = (Long) qLastWeek.getSingleResult();
        stats.put("lastWeek", lastWeek);

        // 3. Último mes
        LocalDateTime unMesAtras = LocalDateTime.now().minusDays(30);
        Query qLastMonth = entityManager.createQuery("SELECT COUNT(c) FROM Ciudadano c WHERE c.activo = true AND c.fechaRegistro >= :fecha" + filterJpql.toString());
        qLastMonth.setParameter("fecha", unMesAtras);
        applyFiltersToQuery(qLastMonth, params);
        Long lastMonth = (Long) qLastMonth.getSingleResult();
        stats.put("lastMonth", lastMonth);

        // 4. Por Entrevistador (Native)
        String nativeInterviewer = 
                "SELECT p.nombre_completo, COUNT(e.id_ciudadano) as cant " +
                "FROM personal p " +
                "JOIN entrevistas e ON p.id = e.id_personal " +
                "JOIN ciudadanos c ON e.id_ciudadano = c.id " +
                "WHERE c.activo = true AND e.activo = true " + filterNative.toString() + " " +
                "GROUP BY p.id, p.nombre_completo " +
                "ORDER BY cant DESC";
        Query qInterviewer = entityManager.createNativeQuery(nativeInterviewer);
        applyFiltersToQuery(qInterviewer, params);
        List<Object[]> queryInterviewer = qInterviewer.getResultList();
        
        List<Map<String, Object>> byInterviewer = new ArrayList<>();
        for (Object[] row : queryInterviewer) {
            Map<String, Object> map = new HashMap<>();
            map.put("name", row[0] != null ? row[0].toString() : "Desconocido");
            map.put("count", row[1] != null ? ((Number) row[1]).longValue() : 0L);
            byInterviewer.add(map);
        }
        stats.put("byInterviewer", byInterviewer);

        // 5. Por Estado Laboral
        Query qEstado = entityManager.createQuery("SELECT c.estadoLaboral, COUNT(c) FROM Ciudadano c WHERE c.activo = true" + filterJpql.toString() + " GROUP BY c.estadoLaboral");
        applyFiltersToQuery(qEstado, params);
        List<Object[]> queryEstado = qEstado.getResultList();
        Map<String, Long> byEstadoLaboral = new HashMap<>();
        for (Object[] row : queryEstado) {
            String key = row[0] != null ? row[0].toString() : "SIN_ESPECIFICAR";
            byEstadoLaboral.put(key, (Long) row[1]);
        }
        stats.put("byEstadoLaboral", byEstadoLaboral);

        // 6. Por Género
        Query qGenero = entityManager.createQuery("SELECT c.genero, COUNT(c) FROM Ciudadano c WHERE c.activo = true" + filterJpql.toString() + " GROUP BY c.genero");
        applyFiltersToQuery(qGenero, params);
        List<Object[]> queryGenero = qGenero.getResultList();
        Map<String, Long> byGenero = new HashMap<>();
        for (Object[] row : queryGenero) {
            String key = row[0] != null ? row[0].toString() : "SIN_ESPECIFICAR";
            byGenero.put(key, (Long) row[1]);
        }
        stats.put("byGenero", byGenero);

        // 7. Top 5 Barrios (Native)
        String nativeBarrios = 
                "SELECT b.nombre, COUNT(c.id) as cant " +
                "FROM ciudadanos c " +
                "JOIN barrios b ON c.id_barrio = b.id " +
                "WHERE c.activo = true " + filterNative.toString() + " " +
                "GROUP BY b.id, b.nombre " +
                "ORDER BY cant DESC " +
                "LIMIT 5";
        Query qBarrios = entityManager.createNativeQuery(nativeBarrios);
        applyFiltersToQuery(qBarrios, params);
        List<Object[]> queryBarrios = qBarrios.getResultList();
        List<Map<String, Object>> byBarrio = new ArrayList<>();
        for (Object[] row : queryBarrios) {
            Map<String, Object> map = new HashMap<>();
            map.put("name", row[0] != null ? row[0].toString() : "Desconocido");
            map.put("count", row[1] != null ? ((Number) row[1]).longValue() : 0L);
            byBarrio.add(map);
        }
        stats.put("byBarrio", byBarrio);

        // 8. Por Nivel Educativo (Native)
        String nativeEdu = 
                "SELECT ed.nivel_alcanzado, COUNT(DISTINCT ed.id_ciudadano) as cant " +
                "FROM educacion ed " +
                "JOIN ciudadanos c ON ed.id_ciudadano = c.id " +
                "WHERE c.activo = true AND ed.activo = true " + filterNative.toString() + " " +
                "GROUP BY ed.nivel_alcanzado " +
                "ORDER BY cant DESC";
        Query qEdu = entityManager.createNativeQuery(nativeEdu);
        applyFiltersToQuery(qEdu, params);
        List<Object[]> queryEdu = qEdu.getResultList();
        List<Map<String, Object>> byNivelEducativo = new ArrayList<>();
        for (Object[] row : queryEdu) {
            Map<String, Object> map = new HashMap<>();
            map.put("level", row[0] != null ? row[0].toString() : "Sin Nivel");
            map.put("count", row[1] != null ? ((Number) row[1]).longValue() : 0L);
            byNivelEducativo.add(map);
        }
        stats.put("byNivelEducativo", byNivelEducativo);

        // 9. Rango de edades y edad promedio
        Query qAges = entityManager.createQuery("SELECT c.fechaNacimiento FROM Ciudadano c WHERE c.activo = true" + filterJpql.toString());
        applyFiltersToQuery(qAges, params);
        List<LocalDate> birthDates = qAges.getResultList();
        
        int totalAges = 0;
        int under18 = 0;
        int de18a29 = 0;
        int de30a49 = 0;
        int de50mas = 0;
        int countAges = 0;
        
        for (LocalDate birthDate : birthDates) {
            if (birthDate != null) {
                int age = java.time.Period.between(birthDate, LocalDate.now()).getYears();
                totalAges += age;
                countAges++;
                if (age < 18) under18++;
                else if (age <= 29) de18a29++;
                else if (age <= 49) de30a49++;
                else de50mas++;
            }
        }
        
        double edadPromedio = countAges > 0 ? (double) totalAges / countAges : 0.0;
        Map<String, Object> ageStats = new HashMap<>();
        ageStats.put("promedio", Math.round(edadPromedio * 10.0) / 10.0);
        
        Map<String, Integer> rangos = new LinkedHashMap<>();
        rangos.put("Menores de 18", under18);
        rangos.put("18 a 29 años", de18a29);
        rangos.put("30 a 49 años", de30a49);
        rangos.put("50 años o más", de50mas);
        ageStats.put("rangos", rangos);
        stats.put("ageStats", ageStats);

        // 10. Discapacidad (CUD)
        Query qCud = entityManager.createQuery("SELECT c.cudDiscapacidad, COUNT(c) FROM Ciudadano c WHERE c.activo = true" + filterJpql.toString() + " GROUP BY c.cudDiscapacidad");
        applyFiltersToQuery(qCud, params);
        List<Object[]> queryCud = qCud.getResultList();
        
        long conCud = 0;
        long sinCud = 0;
        for (Object[] row : queryCud) {
            Boolean hasCud = false;
            if (row[0] != null) {
                if (row[0] instanceof Boolean) {
                    hasCud = (Boolean) row[0];
                } else if (row[0] instanceof Number) {
                    hasCud = ((Number) row[0]).intValue() == 1;
                }
            }
            Long val = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            if (Boolean.TRUE.equals(hasCud)) {
                conCud += val;
            } else {
                sinCud += val;
            }
        }
        Map<String, Object> cudStats = new HashMap<>();
        cudStats.put("conCud", conCud);
        cudStats.put("sinCud", sinCud);

        // Tipos de discapacidad
        Query qTipoDisp = entityManager.createQuery("SELECT c.tipoDiscapacidad, COUNT(c) FROM Ciudadano c WHERE c.activo = true AND c.cudDiscapacidad = true" + filterJpql.toString() + " GROUP BY c.tipoDiscapacidad");
        applyFiltersToQuery(qTipoDisp, params);
        List<Object[]> queryTipoDisp = qTipoDisp.getResultList();
        
        Map<String, Long> byTipoDiscapacidad = new HashMap<>();
        for (Object[] row : queryTipoDisp) {
            String key = row[0] != null && !row[0].toString().trim().isEmpty() ? row[0].toString() : "SIN_ESPECIFICAR";
            Long val = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            byTipoDiscapacidad.put(key, val);
        }
        cudStats.put("tipos", byTipoDiscapacidad);
        stats.put("cudStats", cudStats);

        // =========================================================================
        // 11. Estadísticas de Empresas Relevadas
        // =========================================================================
        Map<String, Object> empresaStats = new HashMap<>();

        // 11.1 Total empresas activas
        Long empTotal = (Long) entityManager.createQuery(
                "SELECT COUNT(e) FROM Empresa e WHERE e.activo = true"
        ).getSingleResult();
        empresaStats.put("total", empTotal);

        // 11.2 Agregadas última semana
        Long empLastWeek = (Long) entityManager.createQuery(
                "SELECT COUNT(e) FROM Empresa e WHERE e.activo = true AND (e.fechaRegistro >= :fechaDT OR e.fechaRelevamiento >= :fechaD)"
        )
                .setParameter("fechaDT", unaSemanaAtras)
                .setParameter("fechaD", LocalDate.now().minusDays(7))
                .getSingleResult();
        empresaStats.put("lastWeek", empLastWeek);

        // 11.3 Agregadas último mes
        Long empLastMonth = (Long) entityManager.createQuery(
                "SELECT COUNT(e) FROM Empresa e WHERE e.activo = true AND (e.fechaRegistro >= :fechaDT OR e.fechaRelevamiento >= :fechaD)"
        )
                .setParameter("fechaDT", unMesAtras)
                .setParameter("fechaD", LocalDate.now().minusDays(30))
                .getSingleResult();
        empresaStats.put("lastMonth", empLastMonth);

        // 11.4 Por Entrevistador (empresas relevadas por personal)
        String nativeEmpInterviewer =
                "SELECT p.nombre_completo, COUNT(emp.id) as cant " +
                "FROM empresas emp " +
                "JOIN personal p ON emp.id_personal_relevo = p.id " +
                "WHERE emp.activo = true " +
                "GROUP BY p.id, p.nombre_completo " +
                "ORDER BY cant DESC";
        List<Object[]> queryEmpInterviewer = entityManager.createNativeQuery(nativeEmpInterviewer).getResultList();
        List<Map<String, Object>> empByInterviewer = new ArrayList<>();
        for (Object[] row : queryEmpInterviewer) {
            Map<String, Object> map = new HashMap<>();
            map.put("name", row[0] != null ? row[0].toString() : "Sin especificar");
            map.put("count", row[1] != null ? ((Number) row[1]).longValue() : 0L);
            empByInterviewer.add(map);
        }
        empresaStats.put("byInterviewer", empByInterviewer);

        // 11.5 Por Interés en Incorporar Personal (Demanda Laboral)
        List<Object[]> queryEmpInteres = entityManager.createQuery(
                "SELECT e.interesIncorporar, COUNT(e) FROM Empresa e WHERE e.activo = true GROUP BY e.interesIncorporar"
        ).getResultList();
        Map<String, Long> byInteresIncorporar = new LinkedHashMap<>();
        long buscandoPersonal = 0;
        for (Object[] row : queryEmpInteres) {
            String key = row[0] != null && !row[0].toString().trim().isEmpty() ? row[0].toString() : "SIN_DATO";
            Long val = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            byInteresIncorporar.put(key, val);
            if ("SI".equalsIgnoreCase(key)) {
                buscandoPersonal += val;
            }
        }
        empresaStats.put("byInteresIncorporar", byInteresIncorporar);
        empresaStats.put("buscandoPersonal", buscandoPersonal);

        // 11.6 Top 5 Barrios con más Empresas
        String nativeEmpBarrios =
                "SELECT b.nombre, COUNT(emp.id) as cant " +
                "FROM empresas emp " +
                "JOIN barrios b ON emp.id_barrio = b.id " +
                "WHERE emp.activo = true " +
                "GROUP BY b.id, b.nombre " +
                "ORDER BY cant DESC " +
                "LIMIT 5";
        List<Object[]> queryEmpBarrios = entityManager.createNativeQuery(nativeEmpBarrios).getResultList();
        List<Map<String, Object>> empByBarrio = new ArrayList<>();
        for (Object[] row : queryEmpBarrios) {
            Map<String, Object> map = new HashMap<>();
            map.put("name", row[0] != null ? row[0].toString() : "Sin barrio");
            map.put("count", row[1] != null ? ((Number) row[1]).longValue() : 0L);
            empByBarrio.add(map);
        }
        empresaStats.put("byBarrio", empByBarrio);

        // 11.7 Por Rubro / Sector Productivo
        String nativeEmpRubros =
                "SELECT r.nombre, COUNT(emp.id) as cant " +
                "FROM empresas emp " +
                "JOIN rubros r ON emp.id_rubro = r.id " +
                "WHERE emp.activo = true " +
                "GROUP BY r.id, r.nombre " +
                "ORDER BY cant DESC";
        List<Object[]> queryEmpRubros = entityManager.createNativeQuery(nativeEmpRubros).getResultList();
        List<Map<String, Object>> empByRubro = new ArrayList<>();
        for (Object[] row : queryEmpRubros) {
            Map<String, Object> map = new HashMap<>();
            map.put("name", row[0] != null ? row[0].toString() : "Sin rubro");
            map.put("count", row[1] != null ? ((Number) row[1]).longValue() : 0L);
            empByRubro.add(map);
        }
        empresaStats.put("byRubro", empByRubro);

        // 11.8 Por Dotación (Cantidad de Empleados)
        List<Object[]> queryEmpDotacion = entityManager.createQuery(
                "SELECT e.cantidadEmpleados, COUNT(e) FROM Empresa e WHERE e.activo = true GROUP BY e.cantidadEmpleados"
        ).getResultList();
        Map<String, Long> rawDotacion = new HashMap<>();
        for (Object[] row : queryEmpDotacion) {
            String key = row[0] != null && !row[0].toString().trim().isEmpty() ? row[0].toString() : "Sin especificar";
            Long val = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            rawDotacion.put(key, rawDotacion.getOrDefault(key, 0L) + val);
        }
        Map<String, Long> byCantidadEmpleados = new LinkedHashMap<>();
        for (String rKey : List.of("1-5", "6-10", "11-50", "51-200", "+200", "Sin especificar")) {
            if (rawDotacion.containsKey(rKey)) {
                byCantidadEmpleados.put(rKey.equals("Sin especificar") ? rKey : rKey + " empleados", rawDotacion.get(rKey));
            }
        }
        empresaStats.put("byCantidadEmpleados", byCantidadEmpleados);

        // 11.9 Por Localidad
        List<Object[]> queryEmpLocalidad = entityManager.createQuery(
                "SELECT e.localidad, COUNT(e) FROM Empresa e WHERE e.activo = true GROUP BY e.localidad"
        ).getResultList();
        Map<String, Long> byLocalidad = new LinkedHashMap<>();
        for (Object[] row : queryEmpLocalidad) {
            String key = row[0] != null && !row[0].toString().trim().isEmpty() ? row[0].toString() : "San José";
            Long val = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            byLocalidad.put(key, byLocalidad.getOrDefault(key, 0L) + val);
        }
        empresaStats.put("byLocalidad", byLocalidad);

        // 11.10 Interés en Programas de Empleo
        List<Object[]> queryEmpProg = entityManager.createQuery(
                "SELECT e.interesProgramasEmpleo, COUNT(e) FROM Empresa e WHERE e.activo = true GROUP BY e.interesProgramasEmpleo"
        ).getResultList();
        long conInteresProg = 0;
        long sinInteresProg = 0;
        for (Object[] row : queryEmpProg) {
            boolean hasInteres = false;
            if (row[0] instanceof Boolean) {
                hasInteres = (Boolean) row[0];
            } else if (row[0] instanceof Number) {
                hasInteres = ((Number) row[0]).intValue() == 1;
            }
            long val = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            if (hasInteres) conInteresProg += val;
            else sinInteresProg += val;
        }
        Map<String, Object> programasStats = new HashMap<>();
        programasStats.put("conInteres", conInteresProg);
        programasStats.put("sinInteres", sinInteresProg);
        empresaStats.put("programasStats", programasStats);

        stats.put("empresaStats", empresaStats);

        return stats;
    }

    private void applyFiltersToQuery(Query query, Map<String, Object> params) {
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }
    }
}
