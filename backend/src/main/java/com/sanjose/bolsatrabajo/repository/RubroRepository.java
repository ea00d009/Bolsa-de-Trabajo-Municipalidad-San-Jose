package com.sanjose.bolsatrabajo.repository;

import com.sanjose.bolsatrabajo.entity.Rubro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RubroRepository extends JpaRepository<Rubro, Integer> {
    List<Rubro> findByActivoTrue();
}
