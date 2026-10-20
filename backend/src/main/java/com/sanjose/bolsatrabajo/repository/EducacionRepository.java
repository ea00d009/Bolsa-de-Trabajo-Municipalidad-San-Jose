package com.sanjose.bolsatrabajo.repository;

import com.sanjose.bolsatrabajo.entity.Educacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EducacionRepository extends JpaRepository<Educacion, Integer> {
}
