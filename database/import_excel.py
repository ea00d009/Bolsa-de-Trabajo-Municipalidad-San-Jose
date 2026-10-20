import csv
import os
import mysql.connector
from datetime import datetime

# Database Connection Details
DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "user": os.environ.get("DB_USERNAME", "root"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME", "oficina_empleo_sanjose")
}

def parse_date(date_str):
    if not date_str or date_str.strip() == "":
        return None
    date_str = date_str.strip()
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%d/%m/%y'):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None

def parse_timestamp(ts_str):
    if not ts_str or ts_str.strip() == "":
        return None
    ts_str = ts_str.strip()
    for fmt in ('%d/%m/%Y %H:%M:%S', '%d/%m/%Y %H:%M', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
        try:
            return datetime.strptime(ts_str, fmt)
        except ValueError:
            continue
    return None

def is_truthy(val):
    if not val:
        return False
    val_clean = val.strip().lower()
    if val_clean in ['sí', 'si', 's', 'yes', 'true', 'x', '1', 'activa', 'activo']:
        return True
    if val_clean.startswith('si') or val_clean.startswith('sí'):
        return True
    return False

def calculate_cuil(dni, gender):
    # Ensure DNI has 8 digits
    dni = dni.zfill(8)
    # Default prefix based on gender
    if gender == 'Femenino':
        prefix = '27'
    else:
        prefix = '20'
    
    # Calculate checksum digit
    # Multipliers for CUIL: 5, 4, 3, 2, 7, 6, 5, 4, 3, 2
    multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    full_str = prefix + dni
    total_sum = sum(int(full_str[i]) * multipliers[i] for i in range(10))
    rest = total_sum % 11
    
    if rest == 0:
        z = '0'
    elif rest == 1:
        if prefix == '20':
            prefix = '23'
            z = '9'
        else:
            prefix = '23'
            z = '4'
    else:
        z = str(11 - rest)
        
    return f"{prefix}{dni}{z}"

def clean_doc_number(doc_str, gender, idx):
    if not doc_str or doc_str.strip() == "":
        # Generate dummy DNI and CUIL to avoid constraint failures
        dummy_dni = f"999{idx:05d}"
        dummy_cuil = f"20{dummy_dni}1"
        return dummy_dni, dummy_cuil
        
    # Keep only digits
    cleaned = "".join(c for c in doc_str if c.isdigit())
    
    if len(cleaned) == 11:
        # It's a CUIL
        cuil = cleaned
        dni = cleaned[2:10]
        return dni, cuil
    elif len(cleaned) in (7, 8):
        # It's a DNI
        dni = cleaned.zfill(8)
        cuil = calculate_cuil(dni, gender)
        return dni, cuil
    else:
        # Unexpected length: fallback to treating it as DNI or generating a dummy
        if len(cleaned) > 0:
            dni = cleaned[:8].zfill(8)
            cuil = calculate_cuil(dni, gender)
            return dni, cuil
        else:
            dummy_dni = f"999{idx:05d}"
            dummy_cuil = f"20{dummy_dni}1"
            return dummy_dni, dummy_cuil

def main():
    print("="*60)
    print("STARTING HISTORICAL EXCEL MIGRATION TO MYSQL")
    print("="*60)

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("Connected to MySQL successfully.")
    except Exception as e:
        print("Error: Could not connect to MySQL database.", e)
        return

    # 1. Fetch or initialize lookup tables to avoid duplicate entries
    # 1.1 Barrios
    cursor.execute("SELECT id, nombre FROM barrios")
    barrios_db = {r[1].lower().strip(): r[0] for r in cursor.fetchall()}
    
    # 1.2 Rubros
    cursor.execute("SELECT id, nombre FROM rubros")
    rubros_db = {r[1].lower().strip(): r[0] for r in cursor.fetchall()}
    
    # 1.3 Personal
    cursor.execute("SELECT id, nombre_completo, usuario FROM personal")
    personal_db = {}
    for r in cursor.fetchall():
        name = r[1] if r[1] is not None else r[2]
        if name:
            personal_db[name.lower().strip()] = r[0]
    
    # 1.4 Existing Citizens (to avoid DNI/CUIL duplicate keys)
    cursor.execute("SELECT dni, cuil FROM ciudadanos")
    existing_records = cursor.fetchall()
    inserted_dnis = {r[0] for r in existing_records if r[0]}
    inserted_cuils = {r[1] for r in existing_records if r[1]}

    print(f"Loaded existing data from DB:")
    print(f" - {len(barrios_db)} Barrios")
    print(f" - {len(rubros_db)} Rubros")
    print(f" - {len(personal_db)} Personal")
    print(f" - {len(inserted_dnis)} Citizens in DB")

    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file = os.path.join(script_dir, 'Entrevistas Final (2024, 2025, 2026) - Respuestas de formulario 1.csv')
    
    # Pre-scan CSV to insert missing Barrios, Rubros, and Personal
    print("\n[STEP 1] Scanning CSV for master data (Barrios, Rubros, Interviewers)...")
    
    unique_barrios = set()
    unique_rubros = set()
    unique_interviewers = set()
    
    with open(csv_file, mode='r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        headers = next(reader)
        for row in reader:
            if len(row) > 11:
                b = row[11].strip()
                if b: unique_barrios.add(b)
            if len(row) > 19:
                r = row[19].strip()
                if r: unique_rubros.add(r)
            if len(row) > 1:
                p = row[1].strip()
                if p: unique_interviewers.add(p)
                
    # Insert new Barrios
    new_barrios_count = 0
    for b in sorted(list(unique_barrios)):
        b_key = b.lower().strip()
        if b_key not in barrios_db:
            cursor.execute("INSERT INTO barrios (nombre, activo) VALUES (%s, %s)", (b, True))
            barrios_db[b_key] = cursor.lastrowid
            new_barrios_count += 1
            
    # Insert new Rubros
    new_rubros_count = 0
    for r in sorted(list(unique_rubros)):
        r_key = r.lower().strip()
        if r_key not in rubros_db:
            cursor.execute("INSERT INTO rubros (nombre, activo) VALUES (%s, %s)", (r, True))
            rubros_db[r_key] = cursor.lastrowid
            new_rubros_count += 1
            
    # Insert new Personal (Interviewers)
    new_personal_count = 0
    default_bcrypt_hash = os.environ.get("DEFAULT_STAFF_HASH", "DISABLED_ACCOUNT_CHANGE_ME")
    for p in sorted(list(unique_interviewers)):
        p_key = p.lower().strip()
        if p_key not in personal_db:
            cursor.execute(
                "INSERT INTO personal (usuario, password_hash, nombre_completo, rol, activo) VALUES (%s, %s, %s, %s, %s)",
                (p.lower(), default_bcrypt_hash, p, "Entrevistador", True)
            )
            personal_db[p_key] = cursor.lastrowid
            new_personal_count += 1
            
    conn.commit()
    print(f"Master Data Migration Completed:")
    print(f" - Added {new_barrios_count} new barrios (Total: {len(barrios_db)})")
    print(f" - Added {new_rubros_count} new rubros (Total: {len(rubros_db)})")
    print(f" - Added {new_personal_count} new personal (Total: {len(personal_db)})")

    # 2. Process and insert citizens and their relationships
    print("\n[STEP 2] Migrating Citizens and detailed relationships...")
    
    total_rows = 0
    citizens_inserted = 0
    duplicates_skipped = 0
    educaciones_inserted = 0
    experiences_inserted = 0
    interviews_inserted = 0
    
    with open(csv_file, mode='r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        headers = next(reader)
        
        for idx, row in enumerate(reader, start=1):
            total_rows += 1
            
            # Map elements carefully, handling potential missing columns
            def get_val(col_idx):
                return row[col_idx].strip() if col_idx < len(row) else ""
            
            timestamp_str = get_val(0)
            interviewer_name = get_val(1)
            nombre = get_val(2)
            apellido = get_val(3)
            perfil = get_val(4)
            doc_str = get_val(5)
            tipo_empleo_buscado = get_val(6)
            genero_str = get_val(7)
            fecha_nacimiento_str = get_val(8)
            hijos_str = get_val(9)
            direccion = get_val(10)
            barrio_name = get_val(11)
            telefono = get_val(12)
            correo = get_val(13)
            educacion_ultimo = get_val(14)
            educacion_inicio_otro = get_val(15)
            educacion_estudiando = get_val(16)
            cursos_realizados = get_val(17)
            experiencia_laboral_desc = get_val(18)
            rubro_name = get_val(19)
            monotributo_str = get_val(20)
            resp_inscripto_str = get_val(21)
            ater_str = get_val(22)
            habilitacion_mun_str = get_val(23)
            registro_especifico = get_val(24)
            obra_social_str = get_val(25)
            movilidad_str = get_val(26)
            plan_social_str = get_val(27)
            solucion_brindada = get_val(28)
            prioridad_str = get_val(29)
            comentario_1 = get_val(30)
            comentario_2 = get_val(31)

            # Skip rows with no name and surname to avoid empty inserts
            if not nombre and not apellido:
                continue

            # Determine Gender for DNI/CUIL generation
            # Possible CSV values: 'F', 'M', 'LGBTIQ+'
            # DB values: 'Masculino', 'Femenino', 'No Binario', 'Otro', 'Prefiero no decirlo'
            if genero_str == 'F':
                genero = 'Femenino'
            elif genero_str == 'M':
                genero = 'Masculino'
            elif genero_str == 'LGBTIQ+':
                genero = 'No Binario'
            else:
                genero = 'Prefiero no decirlo'

            # Clean and get DNI/CUIL
            dni, cuil = clean_doc_number(doc_str, genero, idx)

            # Check for duplicate DNI/CUIL
            if dni in inserted_dnis or cuil in inserted_cuils:
                duplicates_skipped += 1
                continue

            # Parse Birthdate (Fallback to default if invalid)
            birthdate = parse_date(fecha_nacimiento_str)
            if not birthdate:
                birthdate = parse_date("1990-01-01")

            # Parse Registration Timestamp
            reg_time = parse_timestamp(timestamp_str)
            if not reg_time:
                reg_time = datetime.now()

            # Map Hijos
            try:
                hijos = int(hijos_str) if hijos_str else 0
            except ValueError:
                hijos = 0

            # Map Barrio ID
            id_barrio = barrios_db.get(barrio_name.lower().strip()) if barrio_name else None

            # Map Habilitaciones / Booleans
            situacion_monotributo = is_truthy(monotributo_str)
            situacion_responsable_inscripto = is_truthy(resp_inscripto_str)
            situacion_ater = is_truthy(ater_str)
            situacion_habilitacion_municipal = is_truthy(habilitacion_mun_str)
            tiene_obra_social = is_truthy(obra_social_str)
            movilidad_propia = is_truthy(movilidad_str)

            # Map Estado Laboral
            # Options: 'DESEMPLEADO', 'EMPLEADO', 'EN_BUSQUEDA_ACTIVA', 'PROGRAMA_SOCIAL'
            if is_truthy(plan_social_str):
                estado_laboral = 'PROGRAMA_SOCIAL'
            else:
                estado_laboral = 'EN_BUSQUEDA_ACTIVA'

            # Consolidate Observaciones Generales
            obs_parts = []
            if perfil:
                obs_parts.append(perfil)
            if solucion_brindada:
                obs_parts.append(f"Solución brindada: {solucion_brindada}")
            if comentario_1:
                obs_parts.append(f"Comentario 1: {comentario_1}")
            if comentario_2:
                obs_parts.append(f"Comentario 2: {comentario_2}")
            observaciones_generales = "\n".join(obs_parts) if obs_parts else None

            # Primary Phone
            telefono_primario = telefono if telefono else "S/D"

            # Insert Ciudadano
            ciudadano_sql = """
                INSERT INTO ciudadanos (
                    dni, cuil, apellido, nombre, fecha_nacimiento, genero, id_barrio, direccion,
                    telefono_primario, email, hijos_a_cargo, movilidad_propia, 
                    tipo_empleo_buscado, situacion_monotributo, situacion_responsable_inscripto,
                    situacion_ater, situacion_habilitacion_municipal, situacion_registro_especifico,
                    tiene_obra_social, plan_social_activo, observaciones_generales, habilidades,
                    fecha_registro, estado_laboral, activo
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s
                )
            """
            ciudadano_vals = (
                dni, cuil, apellido if apellido else "S/D", nombre if nombre else "S/D", birthdate, genero, id_barrio, direccion,
                telefono_primario, correo if correo else None, hijos, movilidad_propia,
                tipo_empleo_buscado if tipo_empleo_buscado else "Cualquiera", situacion_monotributo, situacion_responsable_inscripto,
                situacion_ater, situacion_habilitacion_municipal, registro_especifico if registro_especifico else None,
                tiene_obra_social, plan_social_str if plan_social_str else None, observaciones_generales, cursos_realizados if cursos_realizados else None,
                reg_time, estado_laboral, True
            )

            try:
                cursor.execute(ciudadano_sql, ciudadano_vals)
                id_ciudadano = cursor.lastrowid
                
                # Update our duplicate-prevention sets
                inserted_dnis.add(dni)
                inserted_cuils.add(cuil)
                citizens_inserted += 1
            except Exception as insert_err:
                print(f"Error inserting citizen at row {idx} (DNI: {dni}, Name: {nombre} {apellido}):", insert_err)
                continue

            # Relation: Rubro (ciudadano_rubros join table)
            if rubro_name:
                id_rubro = rubros_db.get(rubro_name.lower().strip())
                if id_rubro:
                    try:
                        cursor.execute(
                            "INSERT INTO ciudadano_rubros (id_ciudadano, id_rubro) VALUES (%s, %s)",
                            (id_ciudadano, id_rubro)
                        )
                    except Exception as rubro_err:
                        # Silently skip if duplicate relation
                        pass

            # Relation: Educacion
            if educacion_ultimo:
                finalizado = not is_truthy(educacion_estudiando)
                educacion_sql = """
                    INSERT INTO educacion (
                        id_ciudadano, nivel_alcanzado, titulo_obtenido, finalizado, activo
                    ) VALUES (%s, %s, %s, %s, %s)
                """
                titulo_val = (cursos_realizados[:252] + "...") if len(cursos_realizados) > 255 else (cursos_realizados if cursos_realizados else "Estudios registrados")
                educacion_vals = (
                    id_ciudadano, educacion_ultimo, 
                    titulo_val,
                    finalizado, True
                )
                try:
                    cursor.execute(educacion_sql, educacion_vals)
                    educaciones_inserted += 1
                except Exception as edu_err:
                    pass

                # If they also started another level, add it as unfinished
                if educacion_inicio_otro and educacion_inicio_otro.lower().strip() != educacion_ultimo.lower().strip():
                    try:
                        cursor.execute(educacion_sql, (id_ciudadano, educacion_inicio_otro, "Iniciado", False, True))
                        educaciones_inserted += 1
                    except Exception as edu_err2:
                        pass

            # Relation: Experiencia Laboral
            if experiencia_laboral_desc:
                exp_sql = """
                    INSERT INTO experiencia_laboral (
                        id_ciudadano, empresa, puesto, tareas_realizadas, actualmente_trabajando, activo
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """
                exp_vals = (
                    id_ciudadano, "Histórico Excel (2024-2026)", "Puestos Varios",
                    experiencia_laboral_desc, False, True
                )
                try:
                    cursor.execute(exp_sql, exp_vals)
                    experiences_inserted += 1
                except Exception as exp_err:
                    pass

            # Relation: Entrevistas (Link to interviewer and record solution/priority)
            id_personal = personal_db.get(interviewer_name.lower().strip(), 1) if interviewer_name else 1 # Default to superadmin if none
            
            # Priority insercion mapping
            # "1" -> ALTA, "2" -> MEDIA, "3" -> BAJA, default -> MEDIA
            if prioridad_str == '1':
                prioridad = 'ALTA'
            elif prioridad_str == '3':
                prioridad = 'BAJA'
            else:
                prioridad = 'MEDIA'

            entrevista_sql = """
                INSERT INTO entrevistas (
                    id_ciudadano, id_personal, fecha_entrevista, objetivo_consulta, 
                    observaciones_tecnicas, prioridad_insercion, estado_tramite, activo
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            entrevista_vals = (
                id_ciudadano, id_personal, reg_time, 
                solucion_brindada if solucion_brindada else "Carga histórica",
                comentario_1 if comentario_1 else "Importado de planilla de respuestas",
                prioridad, "COMPLETADO", True
            )
            try:
                cursor.execute(entrevista_sql, entrevista_vals)
                interviews_inserted += 1
            except Exception as ent_err:
                pass

            # Periodically commit and show status
            if citizens_inserted % 100 == 0 and citizens_inserted > 0:
                conn.commit()
                print(f" ... processed {total_rows} rows, inserted {citizens_inserted} citizens so far ...")

        conn.commit()

    print("\n" + "="*60)
    print("MIGRATION COMPLETED SUCCESSFULLY!")
    print("="*60)
    print(f"Total Rows Scanned:      {total_rows}")
    print(f"New Citizens Inserted:   {citizens_inserted}")
    print(f"Duplicates Skipped:      {duplicates_skipped}")
    print(f"Educations Registered:   {educaciones_inserted}")
    print(f"Experiences Registered:  {experiences_inserted}")
    print(f"Interviews Linked:       {interviews_inserted}")
    print("="*60)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
