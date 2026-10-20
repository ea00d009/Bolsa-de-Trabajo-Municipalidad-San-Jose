package com.sanjose.bolsatrabajo.repository;

import com.sanjose.bolsatrabajo.entity.Ciudadano;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CiudadanoRepository extends JpaRepository<Ciudadano, Integer> {
    Optional<Ciudadano> findByDni(String dni);
    Optional<Ciudadano> findByCuil(String cuil);

    List<Ciudadano> findByActivoTrue();

    @Query("SELECT c FROM Ciudadano c WHERE c.activo = true AND " +
           "(LOWER(c.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.apellido) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " c.dni LIKE CONCAT('%', :search, '%'))")
    List<Ciudadano> buscarCiudadanosActivos(@Param("search") String search);

    @Query("SELECT DISTINCT c FROM Ciudadano c LEFT JOIN c.rubros r WHERE c.activo = true AND " +
           "(:rubroId IS NULL OR r.id = :rubroId) AND " +
           "(:estadoLaboral IS NULL OR :estadoLaboral = '' OR c.estadoLaboral = :estadoLaboral) AND " +
           "(:barrioId IS NULL OR c.barrio.id = :barrioId) AND " +
           "(:cudDiscapacidad IS NULL OR c.cudDiscapacidad = :cudDiscapacidad) AND " +
           "(:nivelEducativo IS NULL OR :nivelEducativo = '' OR EXISTS (SELECT e FROM Educacion e WHERE e.ciudadano = c AND e.nivelAlcanzado = :nivelEducativo AND e.activo = true)) AND " +
           "(:minNacimiento IS NULL OR c.fechaNacimiento >= :minNacimiento) AND " +
           "(:maxNacimiento IS NULL OR c.fechaNacimiento <= :maxNacimiento) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(c.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.apellido) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " c.dni LIKE CONCAT('%', :search, '%'))")
    Page<Ciudadano> buscarCiudadanosConFiltroYPagina(
            @Param("search") String search,
            @Param("rubroId") Integer rubroId,
            @Param("estadoLaboral") String estadoLaboral,
            @Param("barrioId") Integer barrioId,
            @Param("cudDiscapacidad") Boolean cudDiscapacidad,
            @Param("nivelEducativo") String nivelEducativo,
            @Param("minNacimiento") java.time.LocalDate minNacimiento,
            @Param("maxNacimiento") java.time.LocalDate maxNacimiento,
            Pageable pageable);

    @Query("SELECT DISTINCT c FROM Ciudadano c LEFT JOIN c.rubros r WHERE c.activo = true AND " +
           "(:rubroId IS NULL OR r.id = :rubroId) AND " +
           "(:estadoLaboral IS NULL OR :estadoLaboral = '' OR c.estadoLaboral = :estadoLaboral) AND " +
           "(:barrioId IS NULL OR c.barrio.id = :barrioId) AND " +
           "(:cudDiscapacidad IS NULL OR c.cudDiscapacidad = :cudDiscapacidad) AND " +
           "(:nivelEducativo IS NULL OR :nivelEducativo = '' OR EXISTS (SELECT e FROM Educacion e WHERE e.ciudadano = c AND e.nivelAlcanzado = :nivelEducativo AND e.activo = true)) AND " +
           "(:minNacimiento IS NULL OR c.fechaNacimiento >= :minNacimiento) AND " +
           "(:maxNacimiento IS NULL OR c.fechaNacimiento <= :maxNacimiento) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(c.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.apellido) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " c.dni LIKE CONCAT('%', :search, '%'))")
    List<Ciudadano> buscarCiudadanosConFiltro(
            @Param("search") String search,
            @Param("rubroId") Integer rubroId,
            @Param("estadoLaboral") String estadoLaboral,
            @Param("barrioId") Integer barrioId,
            @Param("cudDiscapacidad") Boolean cudDiscapacidad,
            @Param("nivelEducativo") String nivelEducativo,
            @Param("minNacimiento") java.time.LocalDate minNacimiento,
            @Param("maxNacimiento") java.time.LocalDate maxNacimiento);

    @Query("SELECT DISTINCT c FROM Ciudadano c LEFT JOIN c.rubros r WHERE c.activo = false AND " +
           "(:rubroId IS NULL OR r.id = :rubroId) AND " +
           "(:barrioId IS NULL OR c.barrio.id = :barrioId) AND " +
           "(:cudDiscapacidad IS NULL OR c.cudDiscapacidad = :cudDiscapacidad) AND " +
           "(:nivelEducativo IS NULL OR :nivelEducativo = '' OR EXISTS (SELECT e FROM Educacion e WHERE e.ciudadano = c AND e.nivelAlcanzado = :nivelEducativo AND e.activo = true)) AND " +
           "(:minNacimiento IS NULL OR c.fechaNacimiento >= :minNacimiento) AND " +
           "(:maxNacimiento IS NULL OR c.fechaNacimiento <= :maxNacimiento) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(c.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.apellido) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " c.dni LIKE CONCAT('%', :search, '%'))")
    Page<Ciudadano> buscarCiudadanosInactivosConFiltroYPagina(
            @Param("search") String search,
            @Param("rubroId") Integer rubroId,
            @Param("barrioId") Integer barrioId,
            @Param("cudDiscapacidad") Boolean cudDiscapacidad,
            @Param("nivelEducativo") String nivelEducativo,
            @Param("minNacimiento") java.time.LocalDate minNacimiento,
            @Param("maxNacimiento") java.time.LocalDate maxNacimiento,
            Pageable pageable);

    @Query("SELECT DISTINCT c FROM Ciudadano c LEFT JOIN c.rubros r WHERE c.activo = false AND " +
           "(:rubroId IS NULL OR r.id = :rubroId) AND " +
           "(:barrioId IS NULL OR c.barrio.id = :barrioId) AND " +
           "(:cudDiscapacidad IS NULL OR c.cudDiscapacidad = :cudDiscapacidad) AND " +
           "(:nivelEducativo IS NULL OR :nivelEducativo = '' OR EXISTS (SELECT e FROM Educacion e WHERE e.ciudadano = c AND e.nivelAlcanzado = :nivelEducativo AND e.activo = true)) AND " +
           "(:minNacimiento IS NULL OR c.fechaNacimiento >= :minNacimiento) AND " +
           "(:maxNacimiento IS NULL OR c.fechaNacimiento <= :maxNacimiento) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(c.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.apellido) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " c.dni LIKE CONCAT('%', :search, '%'))")
    List<Ciudadano> buscarCiudadanosInactivosConFiltro(
            @Param("search") String search,
            @Param("rubroId") Integer rubroId,
            @Param("barrioId") Integer barrioId,
            @Param("cudDiscapacidad") Boolean cudDiscapacidad,
            @Param("nivelEducativo") String nivelEducativo,
            @Param("minNacimiento") java.time.LocalDate minNacimiento,
            @Param("maxNacimiento") java.time.LocalDate maxNacimiento);
}