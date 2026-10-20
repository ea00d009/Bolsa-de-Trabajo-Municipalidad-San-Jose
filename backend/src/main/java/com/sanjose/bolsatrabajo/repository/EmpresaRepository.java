package com.sanjose.bolsatrabajo.repository;

import com.sanjose.bolsatrabajo.entity.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmpresaRepository extends JpaRepository<Empresa, Integer> {

    List<Empresa> findByActivoTrueOrderByRazonSocialAsc();

    Optional<Empresa> findByCuit(String cuit);
}
