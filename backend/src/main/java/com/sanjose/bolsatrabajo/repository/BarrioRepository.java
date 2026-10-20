package com.sanjose.bolsatrabajo.repository;

import com.sanjose.bolsatrabajo.entity.Barrio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BarrioRepository extends JpaRepository<Barrio, Integer> {
    List<Barrio> findByActivoTrueOrderByNombreAsc();
}
