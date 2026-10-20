CREATE DATABASE IF NOT EXISTS oficina_empleo_sanjose;
USE oficina_empleo_sanjose;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABLAS MAESTRAS
---------------------------------------------------
CREATE TABLE IF NOT EXISTS barrios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rubros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cursos_ofrecidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_curso VARCHAR(255) NOT NULL,
    institucion VARCHAR(255) DEFAULT 'Oficina de Empleo San Jos├®',
    estado VARCHAR(50) DEFAULT 'ACTIVO', 
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 2. USUARIOS DEL SISTEMA (Staff)
---------------------------------------------------
CREATE TABLE IF NOT EXISTS personal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    rol ENUM('SuperAdmin', 'Entrevistador', 'Administrativo') NOT NULL,
    ultimo_acceso DATETIME,
    activo BOOLEAN DEFAULT TRUE,
    deleted_at DATETIME DEFAULT NULL 
) ENGINE=InnoDB;

-- 3. CIUDADANOS (Postulantes)
---------------------------------------------------
CREATE TABLE IF NOT EXISTS ciudadanos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(15) NOT NULL UNIQUE,
    cuil VARCHAR(15) NOT NULL UNIQUE,
    apellido VARCHAR(100) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('Masculino', 'Femenino', 'No Binario', 'Otro', 'Prefiero no decirlo'), 
    id_barrio INT,
    direccion VARCHAR(255),
    puntos_referencia_domicilio TEXT, -- ├Ütil para zonas rurales o barrios nuevos
    telefono_primario VARCHAR(50) NOT NULL,
    telefono_secundario VARCHAR(50),
    email VARCHAR(150),
    estado_civil VARCHAR(50),
    hijos_a_cargo INT DEFAULT 0,
    cud_discapacidad BOOLEAN DEFAULT FALSE,
    tipo_discapacidad VARCHAR(100),
    cud_vencimiento DATE DEFAULT NULL, -- Para seguimiento de tr├ímites
    movilidad_propia BOOLEAN DEFAULT FALSE,
    licencia_conducir VARCHAR(50) DEFAULT 'NO_POSEE',
    cv_url VARCHAR(255),
    tipo_empleo_buscado VARCHAR(100) DEFAULT 'Cualquiera',
    situacion_monotributo BOOLEAN DEFAULT FALSE,
    situacion_responsable_inscripto BOOLEAN DEFAULT FALSE,
    situacion_ater BOOLEAN DEFAULT FALSE,
    situacion_habilitacion_municipal BOOLEAN DEFAULT FALSE,
    situacion_registro_especifico VARCHAR(255) DEFAULT NULL,
    tiene_obra_social BOOLEAN DEFAULT FALSE,
    plan_social_activo VARCHAR(150) DEFAULT NULL,
    observaciones_generales TEXT,
    habilidades VARCHAR(500),
    calificacion INT DEFAULT 0,
    notas_privadas TEXT,
    foto LONGTEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado_laboral ENUM('DESEMPLEADO', 'EMPLEADO', 'EN_BUSQUEDA_ACTIVA', 'PROGRAMA_SOCIAL') DEFAULT 'DESEMPLEADO',
    activo BOOLEAN DEFAULT TRUE,
    deleted_at DATETIME DEFAULT NULL, -- Soft delete
    FOREIGN KEY (id_barrio) REFERENCES barrios(id),
    INDEX idx_busqueda (apellido, dni)
) ENGINE=InnoDB;

-- 4. FORMACI├ôN Y EXPERIENCIA
---------------------------------------------------
CREATE TABLE IF NOT EXISTS educacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_ciudadano INT NOT NULL,
    nivel_alcanzado VARCHAR(100) NOT NULL, 
    titulo_obtenido VARCHAR(255),
    institucion VARCHAR(255),
    finalizado BOOLEAN DEFAULT TRUE,
    anio_ultimo_aprobado INT, -- Para universitarios/secundarios incompletos
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_ciudadano) REFERENCES ciudadanos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS experiencia_laboral (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_ciudadano INT NOT NULL,
    empresa VARCHAR(150) NOT NULL,
    puesto VARCHAR(150) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    actualmente_trabajando BOOLEAN DEFAULT FALSE, -- Diferenciar empleos activos
    tareas_realizadas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_ciudadano) REFERENCES ciudadanos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. RELACIONES Y CAPACITACIONES
---------------------------------------------------
CREATE TABLE IF NOT EXISTS ciudadano_rubros (
    id_ciudadano INT,
    id_rubro INT,
    PRIMARY KEY (id_ciudadano, id_rubro),
    FOREIGN KEY (id_ciudadano) REFERENCES ciudadanos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_rubro) REFERENCES rubros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS capacitaciones_ciudadano (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_ciudadano INT NOT NULL,
    id_curso INT NOT NULL,
    fecha_inscripcion DATE DEFAULT NULL,
    fecha_finalizacion DATE,
    estado_asistencia ENUM('INSCRIPTO', 'CURSANDO', 'FINALIZADO', 'DESERTO') DEFAULT 'INSCRIPTO', 
    observaciones_rendimiento VARCHAR(255), 
    certificado_url VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    deleted_at DATETIME DEFAULT NULL,

    CONSTRAINT fk_ciudadano_cap FOREIGN KEY (id_ciudadano) 
        REFERENCES ciudadanos(id) ON DELETE CASCADE,
    CONSTRAINT fk_curso_cap FOREIGN KEY (id_curso) 
        REFERENCES cursos_ofrecidos(id) ON DELETE CASCADE,
    UNIQUE KEY uq_ciudadano_curso (id_ciudadano, id_curso)
) ENGINE=InnoDB;

-- 6. GESTI├ôN DE EMPRESAS Y VACANTES
---------------------------------------------------
-- Empresas relevadas por la oficina (s├│lo ficha de datos: NO acceden al sistema)
CREATE TABLE IF NOT EXISTS empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Identificaci├│n
    razon_social VARCHAR(200) NOT NULL,
    nombre_fantasia VARCHAR(150),
    cuit VARCHAR(20) UNIQUE,
    id_rubro INT,
    actividad_principal VARCHAR(255),
    cantidad_empleados VARCHAR(20), -- 1-5, 6-10, 11-50, 51-200, +200
    -- Ubicaci├│n
    direccion VARCHAR(255),
    id_barrio INT,
    localidad VARCHAR(100) DEFAULT 'San Jos├®',
    -- Contacto
    contacto_nombre VARCHAR(100),
    contacto_cargo VARCHAR(100),
    telefono VARCHAR(50),
    telefono_secundario VARCHAR(50),
    email VARCHAR(150),
    sitio_web VARCHAR(255),
    -- Relevamiento
    interes_incorporar VARCHAR(20) DEFAULT 'SIN_DATO', -- SI, NO, A_FUTURO, SIN_DATO
    perfiles_demandados TEXT,
    interes_programas_empleo BOOLEAN DEFAULT FALSE,
    fecha_relevamiento DATE,
    id_personal_relevo INT, -- Trazabilidad: entrevistador que carg├│ el relevamiento
    observaciones TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY (id_rubro) REFERENCES rubros(id),
    FOREIGN KEY (id_barrio) REFERENCES barrios(id),
    FOREIGN KEY (id_personal_relevo) REFERENCES personal(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vacantes_laborales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    puesto_nombre VARCHAR(150) NOT NULL,
    id_rubro INT,
    descripcion_puesto TEXT,
    requisitos_educativos VARCHAR(100),
    rango_etario_min INT,
    rango_etario_max INT,
    estado ENUM('ABIERTA', 'CERRADA', 'PAUSADA', 'CUBIERTA') DEFAULT 'ABIERTA',
    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_empresa) REFERENCES empresas(id),
    FOREIGN KEY (id_rubro) REFERENCES rubros(id)
) ENGINE=InnoDB;

-- 7. ENTREVISTAS Y VINCULACIONES
---------------------------------------------------
CREATE TABLE IF NOT EXISTS entrevistas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_ciudadano INT NOT NULL,
    id_personal INT NOT NULL,
    fecha_entrevista DATETIME NOT NULL,
    objetivo_consulta VARCHAR(255),
    observaciones_tecnicas TEXT,
    prioridad_insercion VARCHAR(50) DEFAULT 'MEDIA',
    estado_tramite VARCHAR(50) DEFAULT 'PENDIENTE',
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_ciudadano) REFERENCES ciudadanos(id),
    FOREIGN KEY (id_personal) REFERENCES personal(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS derivaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_ciudadano INT NOT NULL,
    id_vacante INT NOT NULL,
    id_personal_deriva INT, -- Trazabilidad de qui├®n hizo la derivaci├│n
    fecha_derivacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    resultado ENUM('EN_PROCESO', 'CONTRATADO', 'RECHAZADO', 'NO_ASISTIO') DEFAULT 'EN_PROCESO',
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_ciudadano) REFERENCES ciudadanos(id),
    FOREIGN KEY (id_vacante) REFERENCES vacantes_laborales(id),
    FOREIGN KEY (id_personal_deriva) REFERENCES personal(id)
) ENGINE=InnoDB;

-- 8. AUDITOR├ìA
---------------------------------------------------
CREATE TABLE IF NOT EXISTS logs_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_personal INT,
    tipo_evento ENUM('LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT') NOT NULL,
    accion VARCHAR(255),
    tabla_afectada VARCHAR(50),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_origen VARCHAR(45),
    FOREIGN KEY (id_personal) REFERENCES personal(id)
) ENGINE=InnoDB;

-- 9. MIGRACIONES / ACTUALIZACIONES (Para bases de datos existentes)
---------------------------------------------------
-- Ejecutar estos comandos ALTER TABLE si ya ten├¡as la base de datos creada previamente:
-- ALTER TABLE ciudadanos ADD COLUMN tipo_empleo_buscado VARCHAR(100) DEFAULT 'Cualquiera';
-- ALTER TABLE ciudadanos ADD COLUMN situacion_monotributo BOOLEAN DEFAULT FALSE;
-- ALTER TABLE ciudadanos ADD COLUMN situacion_responsable_inscripto BOOLEAN DEFAULT FALSE;
-- ALTER TABLE ciudadanos ADD COLUMN situacion_ater BOOLEAN DEFAULT FALSE;
-- ALTER TABLE ciudadanos ADD COLUMN situacion_habilitacion_municipal BOOLEAN DEFAULT FALSE;
-- ALTER TABLE ciudadanos ADD COLUMN situacion_registro_especifico VARCHAR(255) DEFAULT NULL;
-- ALTER TABLE ciudadanos ADD COLUMN tiene_obra_social BOOLEAN DEFAULT FALSE;
-- ALTER TABLE ciudadanos ADD COLUMN plan_social_activo VARCHAR(150) DEFAULT NULL;
-- ALTER TABLE ciudadanos ADD COLUMN calificacion INT DEFAULT 0;
-- ALTER TABLE ciudadanos ADD COLUMN notas_privadas TEXT;
-- ALTER TABLE ciudadanos ADD COLUMN foto LONGTEXT;

-- Para migrar la tabla empresas al nuevo esquema de relevamiento:
-- ALTER TABLE empresas ADD COLUMN nombre_fantasia VARCHAR(150);
-- ALTER TABLE empresas ADD COLUMN id_rubro INT, ADD CONSTRAINT fk_empresa_rubro FOREIGN KEY (id_rubro) REFERENCES rubros(id);
-- ALTER TABLE empresas ADD COLUMN actividad_principal VARCHAR(255);
-- ALTER TABLE empresas ADD COLUMN cantidad_empleados VARCHAR(20);
-- ALTER TABLE empresas ADD COLUMN id_barrio INT, ADD CONSTRAINT fk_empresa_barrio FOREIGN KEY (id_barrio) REFERENCES barrios(id);
-- ALTER TABLE empresas ADD COLUMN localidad VARCHAR(100) DEFAULT 'San Jos├®';
-- ALTER TABLE empresas ADD COLUMN contacto_cargo VARCHAR(100);
-- ALTER TABLE empresas ADD COLUMN telefono_secundario VARCHAR(50);
-- ALTER TABLE empresas ADD COLUMN sitio_web VARCHAR(255);
-- ALTER TABLE empresas ADD COLUMN interes_incorporar VARCHAR(20) DEFAULT 'SIN_DATO';
-- ALTER TABLE empresas ADD COLUMN perfiles_demandados TEXT;
-- ALTER TABLE empresas ADD COLUMN interes_programas_empleo BOOLEAN DEFAULT FALSE;
-- ALTER TABLE empresas ADD COLUMN fecha_relevamiento DATE;
-- ALTER TABLE empresas ADD COLUMN id_personal_relevo INT, ADD CONSTRAINT fk_empresa_personal FOREIGN KEY (id_personal_relevo) REFERENCES personal(id);
-- ALTER TABLE empresas ADD COLUMN observaciones TEXT;
-- ALTER TABLE empresas ADD COLUMN fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP;

SET FOREIGN_KEY_CHECKS = 1;
