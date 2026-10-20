package com.sanjose.bolsatrabajo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "educacion")
public class Educacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_ciudadano", nullable = false)
    @JsonIgnore
    private Ciudadano ciudadano;

    @Column(name = "nivel_alcanzado", nullable = false, length = 100)
    private String nivelAlcanzado;

    @Column(name = "titulo_obtenido", length = 255)
    private String tituloObtenido;

    @Column(length = 255)
    private String institucion;

    private Boolean finalizado = true;

    @Column(name = "anio_ultimo_aprobado")
    private Integer anioUltimoAprobado;

    private Boolean activo = true;

    // Constructores
    public Educacion() {}

    // Getters y Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Ciudadano getCiudadano() { return ciudadano; }
    public void setCiudadano(Ciudadano ciudadano) { this.ciudadano = ciudadano; }

    public String getNivelAlcanzado() { return nivelAlcanzado; }
    public void setNivelAlcanzado(String nivelAlcanzado) { this.nivelAlcanzado = nivelAlcanzado; }

    public String getTituloObtenido() { return tituloObtenido; }
    public void setTituloObtenido(String tituloObtenido) { this.tituloObtenido = tituloObtenido; }

    public String getInstitucion() { return institucion; }
    public void setInstitucion(String institucion) { this.institucion = institucion; }

    public Boolean getFinalizado() { return finalizado; }
    public void setFinalizado(Boolean finalizado) { this.finalizado = finalizado; }

    public Integer getAnioUltimoAprobado() { return anioUltimoAprobado; }
    public void setAnioUltimoAprobado(Integer anioUltimoAprobado) { this.anioUltimoAprobado = anioUltimoAprobado; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
