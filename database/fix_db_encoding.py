import os
import mysql.connector

# Database Connection Details
DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "user": os.environ.get("DB_USERNAME", "root"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME", "oficina_empleo_sanjose")
}

def fix_text(val):
    if not val or not isinstance(val, str):
        return val
    
    # Check if the text contains characters typical of a UTF-8 to Latin-1/Windows-1252 misdecoding
    # Character 'Ã' (0xC3) is the leading byte for many accented Spanish characters in UTF-8
    if 'Ã' in val or 'â€' in val or 'Â' in val:
        try:
            # Re-encode as latin1 (or windows-1252) and decode back as UTF-8
            fixed = val.encode('latin1').decode('utf-8')
            if fixed != val:
                return fixed
        except Exception:
            # Fallback try with cp1252 if latin1 fails in some edge cases
            try:
                fixed = val.encode('cp1252').decode('utf-8')
                if fixed != val:
                    return fixed
            except Exception:
                pass
    return val

def main():
    print("=" * 60)
    print("STARTING ENCODING REPAIR ON MYSQL DATABASE")
    print("=" * 60)

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("Connected to MySQL successfully.")
    except Exception as e:
        print("Error: Could not connect to MySQL database.", e)
        return

    # Dictionary of tables and columns to check and repair
    TABLES_AND_COLUMNS = {
        "barrios": ["nombre"],
        "rubros": ["nombre"],
        "personal": ["nombre_completo"],
        "ciudadanos": [
            "apellido", "nombre", "direccion", "puntos_referencia_domicilio",
            "tipo_discapacidad", "tipo_empleo_buscado", "situacion_registro_especifico",
            "plan_social_activo", "observaciones_generales", "habilidades"
        ],
        "educacion": ["nivel_alcanzado", "titulo_obtenido", "institucion"],
        "experiencia_laboral": ["empresa", "puesto", "tareas_realizadas"],
        "entrevistas": ["objetivo_consulta", "observaciones_tecnicas", "prioridad_insercion", "estado_tramite"]
    }

    for table, columns in TABLES_AND_COLUMNS.items():
        print(f"\nProcessing table: '{table}'...")
        try:
            # Fetch primary key name (usually 'id' in our schema)
            pk = "id"
            
            # Fetch all rows with their PK and targeted columns
            cols_str = ", ".join(columns)
            query = f"SELECT {pk}, {cols_str} FROM {table}"
            cursor.execute(query)
            rows = cursor.fetchall()
            
            updated_count = 0
            for row in rows:
                row_id = row[0]
                updates = []
                params = []
                
                for idx, col in enumerate(columns):
                    original_val = row[idx + 1]
                    if original_val:
                        fixed_val = fix_text(original_val)
                        if fixed_val != original_val:
                            updates.append(f"{col} = %s")
                            params.append(fixed_val)
                
                if updates:
                    update_query = f"UPDATE {table} SET {', '.join(updates)} WHERE {pk} = %s"
                    params.append(row_id)
                    cursor.execute(update_query, params)
                    updated_count += 1
            
            conn.commit()
            print(f" -> Table '{table}' finished. Updated {updated_count} rows.")
            
        except Exception as e:
            print(f" -> Error processing table '{table}': {e}")
            conn.rollback()

    cursor.close()
    conn.close()
    print("\n" + "=" * 60)
    print("DATABASE ENCODING REPAIR COMPLETED!")
    print("=" * 60)

if __name__ == "__main__":
    main()
