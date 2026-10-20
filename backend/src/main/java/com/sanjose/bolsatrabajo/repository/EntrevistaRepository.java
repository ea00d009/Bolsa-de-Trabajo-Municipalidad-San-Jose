package com.sanjose.bolsatrabajo.repository;

import com.sanjose.bolsatrabajo.entity.Entrevista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EntrevistaRepository extends JpaRepository<Entrevista, Integer> {
}
