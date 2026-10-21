import { useEffect, useState } from 'react';
import { Search, Eye, Edit2, Trash2, Loader2, AlertCircle, ChevronLeft, ChevronRight, Sliders, X, ChevronDown, RotateCcw } from 'lucide-react';

interface Rubro {
  id: number;
  nombre: string;
  activo: boolean;
}

interface Candidate {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  estadoLaboral: string;
  fechaRegistro: string;
  rubros?: Rubro[];
  telefonoPrimario?: string;
  foto?: string;
}

interface DashboardProps {
  token: string;
  userRole?: string;
  rubrosChangedCount?: number;
  onNewCandidate: () => void;
  onEditCandidate: (id: number) => void;
  onViewCV: (id: number, ids?: number[]) => void;
}

const getAvatarGradient = (id: number) => {
  const gradients = [
    'linear-gradient(135deg, #3b82f6, #1d4ed8)', // Azul
    'linear-gradient(135deg, #10b981, #047857)', // Verde
    'linear-gradient(135deg, #ea580c, #c2410c)', // Naranja
    'linear-gradient(135deg, #8b5cf6, #6d28d9)', // Violeta
    'linear-gradient(135deg, #ec4899, #be185d)', // Rosa
    'linear-gradient(135deg, #06b6d4, #0891b2)', // Celeste
  ];
  return gradients[id % gradients.length];
};

const getAvatarInitials = (nombre: string, apellido: string) => {
  const first = nombre ? nombre.trim().charAt(0) : '';
  const last = apellido ? apellido.trim().charAt(0) : '';
  return (first + last).toUpperCase();
};

export default function Dashboard({ token, userRole, rubrosChangedCount, onNewCandidate, onEditCandidate, onViewCV }: DashboardProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [selectedRubroId, setSelectedRubroId] = useState<number | null>(null);
  const [selectedEstadoLaboral, setSelectedEstadoLaboral] = useState<string>('');

  const [barrios, setBarrios] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterAgeRange, setFilterAgeRange] = useState('');
  const [filterHasCud, setFilterHasCud] = useState<boolean | null>(null);
  const [filterEducationLevel, setFilterEducationLevel] = useState('');
  const [filterBarrioId, setFilterBarrioId] = useState<number | null>(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [openRubrosCandidateId, setOpenRubrosCandidateId] = useState<number | null>(null);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<number | null>(null);

  const [fetchTimeMs, setFetchTimeMs] = useState<number | null>(null);

  const fetchRubros = async () => {
    try {
      const response = await fetch('/api/rubros', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRubros(data);
      }
    } catch (err) {
      console.error('Error fetching rubros:', err);
    }
  };

  const fetchBarrios = async () => {
    try {
      const response = await fetch('/api/barrios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBarrios(data);
      }
    } catch (err) {
      console.error('Error fetching barrios:', err);
    }
  };

  const fetchCandidates = async (silent = false) => {
    const t0 = performance.now();
    if (!silent) {
      setLoading(true);
    }
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.append('buscar', search.trim());
      }
      if (selectedRubroId !== null) {
        params.append('rubroId', selectedRubroId.toString());
      }
      if (selectedEstadoLaboral) {
        params.append('estadoLaboral', selectedEstadoLaboral);
      }
      if (filterAgeRange) {
        params.append('rangoEdad', filterAgeRange);
      }
      if (filterHasCud !== null) {
        params.append('cudDiscapacidad', filterHasCud.toString());
      }
      if (filterEducationLevel) {
        params.append('nivelEducativo', filterEducationLevel);
      }
      if (filterBarrioId !== null) {
        params.append('barrioId', filterBarrioId.toString());
      }
      params.append('page', page.toString());
      params.append('size', '20');
      
      const url = `/api/ciudadanos?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          throw new Error('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.');
        }
        throw new Error('Error al obtener la lista de postulantes.');
      }

      const data = await response.json();
      setCandidates(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setFetchTimeMs(Math.round(performance.now() - t0));
    } catch (err: any) {
      if (!silent) {
        setError(err.message || 'Error de conexión.');
        setFetchTimeMs(null);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRubros();
    fetchBarrios();
  }, [rubrosChangedCount]);

  useEffect(() => {
    fetchCandidates();
  }, [search, selectedRubroId, selectedEstadoLaboral, page, filterAgeRange, filterHasCud, filterEducationLevel, filterBarrioId]);

  // Sincronización automática en red LAN cada 30s y al recuperar foco (para 2-3 entrevistadores en simultáneo)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCandidates(true);
    }, 30000);
    const onFocus = () => {
      fetchCandidates(true);
      fetchRubros();
      fetchBarrios();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [search, selectedRubroId, selectedEstadoLaboral, page, filterAgeRange, filterHasCud, filterEducationLevel, filterBarrioId]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.status-dropdown-container')) {
        setOpenStatusDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleDelete = (id: number, name: string) => {
    window.showConfirm({
      title: 'Dar de baja postulante',
      message: `¿Estás seguro de que deseas dar de baja al postulante "${name}"?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/ciudadanos/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('No se pudo eliminar al postulante.');
          }

          setCandidates(prev => prev.filter(c => c.id !== id));
          window.showToast('Postulante dado de baja con éxito.', 'success');
        } catch (err: any) {
          window.showToast(err.message || 'Error al eliminar postulante.', 'error');
        }
      }
    });
  };

  const handleRestore = (id: number, name: string) => {
    window.showConfirm({
      title: 'Restaurar postulante',
      message: `¿Estás seguro de que deseas restaurar y activar al postulante "${name}"?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/ciudadanos/${id}/restaurar`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'No se pudo restaurar al postulante.');
          }

          setCandidates(prev => prev.filter(c => c.id !== id));
          window.showToast('Postulante restaurado con éxito.', 'success');
        } catch (err: any) {
          window.showToast(err.message || 'Error al restaurar postulante.', 'error');
        }
      }
    });
  };

  const updateCandidateStatus = async (id: number, nextStatus: string) => {
    try {
      const response = await fetch(`/api/ciudadanos/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estadoLaboral: nextStatus })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al actualizar el estado.');
      }

      // Actualizar el estado localmente
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, estadoLaboral: nextStatus } : c));
      window.showToast('Estado laboral actualizado con éxito.', 'success');
    } catch (err: any) {
      window.showToast(err.message || 'Error de conexión al actualizar el estado.', 'error');
    }
  };

  const getBadgeClass = (status: string) => {
    const s = status ? status.toUpperCase() : 'DESEMPLEADO';
    switch (s) {
      case 'EN_BUSQUEDA_ACTIVA':
      case 'ENTREVISTA':
        return 'badge-entrevista';
      case 'EMPLEADO':
      case 'CONTRATADO':
        return 'badge-contratado';
      case 'PROGRAMA_SOCIAL':
      case 'RECIBIDO':
        return 'badge-recibido';
      case 'DESEMPLEADO':
      case 'RECHAZADO':
        return 'badge-rechazado';
      default:
        return 'badge-recibido';
    }
  };

  const formatStatusText = (status: string) => {
    if (!status) return 'DESEMPLEADO';
    const s = status.toUpperCase();
    
    try {
      const catalog = JSON.parse(localStorage.getItem('oficina_empleo_estados_laborales') || '["Entrevista", "Empleado", "En búsqueda activa", "Rechazado", "Programa Social", "Desempleado"]');
      for (const estado of catalog) {
        const normalized = estado.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
        if (normalized === s) {
          return estado.toUpperCase();
        }
      }
    } catch (e) {
      console.error(e);
    }

    switch (s) {
      case 'EN_BUSQUEDA_ACTIVA': return 'EN BÚSQUEDA ACTIVA';
      case 'EMPLEADO': return 'EMPLEADO';
      case 'PROGRAMA_SOCIAL': return 'PROGRAMA SOCIAL';
      case 'DESEMPLEADO': return 'DESEMPLEADO';
      default: return s.replace(/_/g, ' ');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '12/05/2024'; // Valor por defecto
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return '12/05/2024';
    }
  };

  return (
    <>
      <div className="fade-in" style={{ padding: '40px', maxWidth: '100%', margin: '0 auto', width: '100%' }}>
      {/* Search and Action Bar (Mockup Style) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '28px',
        marginBottom: '32px',
        backgroundColor: 'var(--card-bg-hex)',
        padding: '20px 32px',
        borderRadius: '18px',
        border: '2px solid hsl(var(--primary))',
        boxShadow: '0 12px 30px -10px hsl(var(--primary) / 0.22), 0 4px 12px -5px hsl(var(--primary) / 0.15), var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '520px' }}>
            <Search size={22} style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--primary))'
            }} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              style={{
                paddingLeft: '52px',
                border: 'none',
                backgroundColor: 'transparent',
                boxShadow: 'none',
                width: '100%',
                fontSize: '18px',
                fontWeight: 500,
                color: 'var(--text-main-hex)'
              }}
            />
          </div>

          <div style={{ width: '1.5px', height: '36px', backgroundColor: 'var(--border-hex)' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={selectedRubroId || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedRubroId(val === 'all' ? null : Number(val));
                setPage(0);
              }}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '17px',
                fontWeight: 600,
                color: 'var(--text-main-hex)',
                cursor: 'pointer',
                width: 'auto',
                paddingRight: '24px',
                outline: 'none'
              }}
            >
              <option value="all" style={{ backgroundColor: 'var(--card-bg-hex)', color: 'var(--text-main-hex)' }}>Todos los rubros</option>
              {rubros.map((rubro) => (
                <option key={rubro.id} value={rubro.id} style={{ backgroundColor: 'var(--card-bg-hex)', color: 'var(--text-main-hex)' }}>
                  {rubro.nombre}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={selectedEstadoLaboral}
              onChange={(e) => {
                setSelectedEstadoLaboral(e.target.value);
                setPage(0);
              }}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '17px',
                fontWeight: 600,
                color: 'var(--text-main-hex)',
                cursor: 'pointer',
                width: 'auto',
                paddingRight: '24px',
                outline: 'none'
              }}
            >
              <option value="" style={{ backgroundColor: 'var(--card-bg-hex)', color: 'var(--text-main-hex)' }}>Todos los estados</option>
              {JSON.parse(localStorage.getItem('oficina_empleo_estados_laborales') || '["Entrevista", "Empleado", "En búsqueda activa", "Rechazado", "Programa Social", "Desempleado"]').map((estado: string) => {
                const val = estado.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
                return (
                  <option key={val} value={val} style={{ backgroundColor: 'var(--card-bg-hex)', color: 'var(--text-main-hex)' }}>
                    {estado}
                  </option>
                );
              })}
              <option value="ELIMINADO" style={{ backgroundColor: 'var(--card-bg-hex)', color: 'var(--text-main-hex)' }}>Inactivos / Eliminados</option>
            </select>
          </div>

          <div style={{ width: '1.5px', height: '36px', backgroundColor: 'var(--border-hex)' }}></div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: showAdvancedFilters ? 'var(--bg-app-hex)' : 'var(--bg-alt-hex)',
              border: '1px solid var(--border-hex)',
              color: showAdvancedFilters ? 'var(--text-main-hex)' : 'var(--text-muted-hex)',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-app-hex)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = showAdvancedFilters ? 'var(--bg-app-hex)' : 'var(--bg-alt-hex)'}
            title="Filtros Avanzados"
          >
            <Sliders size={18} />
            Filtros
          </button>

          {(search || selectedRubroId !== null || selectedEstadoLaboral || filterAgeRange || filterEducationLevel || filterBarrioId !== null || filterHasCud !== null) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedRubroId(null);
                setSelectedEstadoLaboral('');
                setFilterAgeRange('');
                setFilterEducationLevel('');
                setFilterBarrioId(null);
                setFilterHasCud(null);
                setPage(0);
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-alt-hex)',
                border: '1px solid var(--border-hex)',
                color: 'var(--text-muted-hex)',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-app-hex)';
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.borderColor = '#fca5a5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-alt-hex)';
                e.currentTarget.style.color = 'var(--text-muted-hex)';
                e.currentTarget.style.borderColor = 'var(--border-hex)';
              }}
              title="Limpiar todos los filtros"
            >
              <X size={18} />
              Limpiar Filtros
            </button>
          )}
        </div>

        <button 
          onClick={onNewCandidate}
          style={{
            padding: '14px 32px',
            borderRadius: '12px',
            fontSize: '17px',
            fontWeight: 700,
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Nuevo
        </button>
      </div>

      {/* Collapsible Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div style={{
          backgroundColor: 'var(--advanced-filters-bg)',
          borderRadius: '16px',
          border: '1px solid var(--advanced-filters-border)',
          padding: '20px 24px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'var(--transition)'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            alignItems: 'flex-end',
            width: '100%'
          }}>
            {/* Rango de Edad */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px', minWidth: '150px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted-hex)' }}>Rango de Edad</label>
              <select
                value={filterAgeRange}
                onChange={(e) => {
                  setFilterAgeRange(e.target.value);
                  setPage(0);
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-hex)',
                  backgroundColor: 'var(--card-bg-hex)',
                  color: 'var(--text-main-hex)',
                  fontSize: '13px',
                  outline: 'none',
                  width: '100%',
                  transition: 'var(--transition)'
                }}
              >
                <option value="">Todos los rangos</option>
                <option value="18-25">18 a 25 años</option>
                <option value="26-35">26 a 35 años</option>
                <option value="36-45">36 a 45 años</option>
                <option value="46+">46 años o más</option>
              </select>
            </div>

            {/* Nivel Educativo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px', minWidth: '150px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted-hex)' }}>Nivel Educativo</label>
              <select
                value={filterEducationLevel}
                onChange={(e) => {
                  setFilterEducationLevel(e.target.value);
                  setPage(0);
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-hex)',
                  backgroundColor: 'var(--card-bg-hex)',
                  color: 'var(--text-main-hex)',
                  fontSize: '13px',
                  outline: 'none',
                  width: '100%',
                  transition: 'var(--transition)'
                }}
              >
                <option value="">Todos los niveles</option>
                {JSON.parse(localStorage.getItem('oficina_empleo_niveles_educativos') || '["Primario", "Secundario", "Terciario", "Universitario", "Posgrado"]').map((nivel: string) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
            </div>

            {/* Barrio / Zona */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px', minWidth: '150px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted-hex)' }}>Barrio / Zona</label>
              <select
                value={filterBarrioId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterBarrioId(val ? Number(val) : null);
                  setPage(0);
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-hex)',
                  backgroundColor: 'var(--card-bg-hex)',
                  color: 'var(--text-main-hex)',
                  fontSize: '13px',
                  outline: 'none',
                  width: '100%',
                  transition: 'var(--transition)'
                }}
              >
                <option value="">Todos los barrios</option>
                {barrios.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Posee CUD */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px', paddingBottom: '2px', flex: '0 0 auto' }}>
              <input
                type="checkbox"
                id="filterHasCud"
                checked={filterHasCud === true}
                onChange={(e) => {
                  setFilterHasCud(e.target.checked ? true : null);
                  setPage(0);
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: 'hsl(var(--primary))'
                }}
              />
              <label htmlFor="filterHasCud" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main-hex)', cursor: 'pointer', userSelect: 'none' }}>
                Posee CUD (Discapacidad)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Card Container */}
      <div style={{
        backgroundColor: 'var(--card-bg-hex)',
        borderRadius: '16px',
        border: '1px solid var(--border-hex)',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden'
      }}>
        {loading && candidates.length === 0 ? (
          <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
            <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 500 }}>Cargando postulantes...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'hsl(var(--color-rechazado))' }}>
            <AlertCircle size={36} />
            <span style={{ fontWeight: 500 }}>{error}</span>
            <button className="btn-secondary" onClick={() => fetchCandidates()}>Reintentar</button>
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <AlertCircle size={36} style={{ color: 'hsl(var(--text-muted))' }} />
            <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 500 }}>No se encontraron postulantes.</span>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: 'var(--bg-table-header)', 
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '1px', width: '32%', minWidth: '250px' }}>Postulante</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '1px', width: '30%', minWidth: '240px' }}>Rubro</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '1px', width: '8%', minWidth: '95px' }}>Fecha</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '1px', width: '16%', minWidth: '165px' }}>Estado</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', width: '8%', minWidth: '100px' }}>CV</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right', width: '6%', minWidth: '85px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate, idx) => (
                    <tr 
                      key={candidate.id} 
                      className="table-row-hover"
                      style={{ 
                        borderBottom: idx === candidates.length - 1 ? 'none' : '1px solid hsl(var(--border) / 0.7)',
                        transition: 'var(--transition)',
                        backgroundColor: idx % 2 === 1 ? 'var(--row-zebra)' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--row-hover)';
                        const actions = e.currentTarget.querySelector('.row-actions') as HTMLElement;
                        if (actions) actions.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = idx % 2 === 1 ? 'var(--row-zebra)' : 'transparent';
                        const actions = e.currentTarget.querySelector('.row-actions') as HTMLElement;
                        if (actions) actions.style.opacity = '0';
                      }}
                    >
                      {/* Postulante Column */}
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            background: candidate.foto ? 'transparent' : getAvatarGradient(candidate.id)
                          }}>
                            {candidate.foto ? (
                              <img 
                                src={candidate.foto} 
                                alt={`${candidate.nombre} ${candidate.apellido}`} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <span style={{ color: 'white', fontWeight: 700, fontSize: '22px', letterSpacing: '0.5px' }}>
                                {getAvatarInitials(candidate.nombre, candidate.apellido)}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }} title={`${candidate.nombre} ${candidate.apellido}`}>
                            <div style={{ 
                              fontWeight: 700, 
                              color: 'var(--text-main-hex)', 
                              fontSize: '16px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              maxWidth: '380px',
                              width: '100%'
                            }}>
                              <span 
                                style={{ 
                                  whiteSpace: 'nowrap', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis',
                                  flex: 1
                                }}
                                title={`${candidate.nombre} ${candidate.apellido}`}
                              >
                                {candidate.nombre} {candidate.apellido}
                              </span>
                              <span style={{ 
                                fontSize: '11px', 
                                fontWeight: 600, 
                                backgroundColor: 'var(--bg-alt-hex)', 
                                color: 'var(--text-muted-hex)', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                border: '1px solid var(--border-hex)',
                                flexShrink: 0
                              }}>
                                DNI {candidate.dni}
                              </span>
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted-hex)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--text-muted-hex)', fontSize: '13px' }}>✉</span> {candidate.email || 'Sin correo electrónico'}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted-hex)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--text-muted-hex)', fontSize: '13px' }}>☎</span> {candidate.telefonoPrimario || 'Sin teléfono'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rubro Column */}
                      <td style={{ padding: '20px 24px' }}>
                        {candidate.rubros && candidate.rubros.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '100%' }}>
                            {/* Fila 1: primeros dos rubros */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {candidate.rubros.slice(0, 2).map((rubro) => (
                                <span
                                  key={rubro.id}
                                  className="rubro-tag"
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.2px',
                                    whiteSpace: 'nowrap',
                                    '--rubro-hue': `${(rubro.id * 137) % 360}deg`
                                  } as React.CSSProperties}
                                  title={rubro.nombre}
                                >
                                  {rubro.nombre}
                                </span>
                              ))}
                            </div>

                            {/* Fila 2: si hay más de 2 rubros */}
                            {candidate.rubros.length > 2 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {/* Mostrar rubros de la segunda fila: el 3ro (y el 4to si hay hasta 4) */}
                                {(candidate.rubros.length <= 4
                                  ? candidate.rubros.slice(2, 4)
                                  : candidate.rubros.slice(2, 3)
                                ).map((rubro) => (
                                  <span
                                    key={rubro.id}
                                    className="rubro-tag"
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.2px',
                                      whiteSpace: 'nowrap',
                                      '--rubro-hue': `${(rubro.id * 137) % 360}deg`
                                    } as React.CSSProperties}
                                    title={rubro.nombre}
                                  >
                                    {rubro.nombre}
                                  </span>
                                ))}

                                {/* Badge si tiene más de 4 rubros */}
                                {candidate.rubros.length > 4 && (
                                  <div 
                                    style={{ position: 'relative', display: 'inline-block' }}
                                    onMouseEnter={() => setOpenRubrosCandidateId(candidate.id)}
                                    onMouseLeave={() => {
                                      setTimeout(() => {
                                        setOpenRubrosCandidateId(prev => prev === candidate.id ? null : prev);
                                      }, 200);
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        backgroundColor: 'var(--rubro-bg)',
                                        color: 'var(--rubro-text)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border-hex)',
                                        cursor: 'default',
                                        transition: 'all 0.2s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        userSelect: 'none'
                                      }}
                                      title="Pasar el ratón para ver todos los rubros"
                                    >
                                      +{candidate.rubros.length - 3}
                                    </span>
                                    
                                    {/* Popover flotante por hover */}
                                    {openRubrosCandidateId === candidate.id && (
                                      <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 6px)',
                                        left: '0',
                                        zIndex: 100,
                                        backgroundColor: 'var(--rubro-popover-bg)',
                                        border: '1px solid var(--rubro-popover-border)',
                                        borderRadius: '10px',
                                        boxShadow: 'var(--rubro-popover-shadow)',
                                        padding: '10px',
                                        minWidth: '180px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        animation: 'fadeIn 0.15s ease-out'
                                      }}>
                                        {candidate.rubros.slice(3).map((rubro) => (
                                          <span
                                            key={rubro.id}
                                            className="rubro-tag"
                                            style={{
                                              fontSize: '11px',
                                              fontWeight: 700,
                                              padding: '4px 8px',
                                              borderRadius: '4px',
                                              textTransform: 'uppercase',
                                              letterSpacing: '0.2px',
                                              whiteSpace: 'nowrap',
                                              '--rubro-hue': `${(rubro.id * 137) % 360}deg`
                                            } as React.CSSProperties}
                                            title={rubro.nombre}
                                          >
                                            {rubro.nombre}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '14px', color: 'var(--text-muted-hex)', fontStyle: 'italic' }}>Sin rubro</span>
                        )}
                      </td>

                      {/* Fecha Column */}
                      <td style={{ padding: '20px 24px', color: 'hsl(var(--text-muted))', fontSize: '15px' }}>
                        {formatDate(candidate.fechaRegistro)}
                      </td>

                      <td style={{ padding: '20px 24px' }}>
                        <div 
                          className="status-dropdown-container" 
                          style={{ position: 'relative', display: 'inline-block' }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenStatusDropdownId(openStatusDropdownId === candidate.id ? null : candidate.id);
                            }}
                            className={`badge ${getBadgeClass(candidate.estadoLaboral)}`}
                            style={{
                              border: 'none',
                              outline: 'none',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontWeight: 600,
                              fontSize: '11px',
                              padding: '5px 12px',
                              borderRadius: '20px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                              userSelect: 'none',
                              height: '26px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.03)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title="Cambiar estado laboral"
                          >
                            <span>{formatStatusText(candidate.estadoLaboral)}</span>
                            <ChevronDown size={12} style={{ opacity: 0.8, transition: 'transform 0.2s ease', transform: openStatusDropdownId === candidate.id ? 'rotate(180deg)' : 'none' }} />
                          </button>

                          {openStatusDropdownId === candidate.id && (
                            <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                              <div 
                                style={{
                                  backgroundColor: 'var(--card-bg-hex)',
                                  border: '1px solid var(--border-hex)',
                                  borderRadius: '12px',
                                  boxShadow: 'var(--rubro-popover-shadow)',
                                  padding: '6px',
                                  minWidth: '175px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  animation: 'fadeIn 0.15s ease-out',
                                  backdropFilter: 'blur(8px)'
                                }}
                              >
                                {JSON.parse(localStorage.getItem('oficina_empleo_estados_laborales') || '["Entrevista", "Empleado", "En búsqueda activa", "Rechazado", "Programa Social", "Desempleado"]').map((estado: string) => {
                                  const val = estado.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
                                  const isCurrent = candidate.estadoLaboral === val;
                                  
                                  return (
                                    <button
                                      key={val}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateCandidateStatus(candidate.id, val);
                                        setOpenStatusDropdownId(null);
                                      }}
                                      style={{
                                        border: 'none',
                                        background: isCurrent ? 'var(--sidebar-item-active-bg)' : 'transparent',
                                        color: isCurrent ? 'var(--sidebar-item-active-color)' : 'var(--text-main-hex)',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: isCurrent ? 700 : 500,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isCurrent) {
                                          e.currentTarget.style.backgroundColor = 'var(--bg-alt-hex)';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isCurrent) {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                      }}
                                    >
                                      <span>{estado.toUpperCase()}</span>
                                      {isCurrent && (
                                        <span style={{ fontSize: '10px', color: 'var(--sidebar-item-active-color)' }}>✓</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Ver CV column (Vibrant Premium Style) */}
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <button 
                          onClick={() => onViewCV(candidate.id, candidates.map(c => c.id))}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            backgroundColor: 'var(--primary-light)',
                            border: '1px solid var(--border-hex)',
                            color: 'var(--sidebar-item-active-color)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 2px rgba(37, 99, 235, 0.05)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--primary)';
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                            e.currentTarget.style.borderColor = 'var(--border-hex)';
                            e.currentTarget.style.color = 'var(--sidebar-item-active-color)';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(37, 99, 235, 0.05)';
                          }}
                        >
                          <Eye size={14} />
                          Ver CV
                        </button>
                      </td>

                      {/* Actions column (With borders and hover animations) */}
                      {/* Actions column — hidden until row hover */}
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <div 
                          className="row-actions"
                          style={{ 
                            display: 'inline-flex', 
                            gap: '8px', 
                            opacity: 0, 
                            transition: 'opacity 0.2s ease' 
                          }}
                        >
                          <button 
                            onClick={() => onEditCandidate(candidate.id)}
                            style={{
                              padding: '6px',
                              border: '1px solid var(--border-hex)',
                              backgroundColor: 'var(--card-bg-hex)',
                              color: 'var(--text-muted-hex)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'var(--transition)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.color = '#3b82f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-hex)';
                              e.currentTarget.style.color = 'var(--text-muted-hex)';
                            }}
                            title="Editar Postulante"
                          >
                            <Edit2 size={15} />
                          </button>
                          {userRole === 'SuperAdmin' && (
                            selectedEstadoLaboral === 'ELIMINADO' ? (
                              <button 
                                onClick={() => handleRestore(candidate.id, `${candidate.nombre} ${candidate.apellido}`)}
                                style={{
                                  padding: '6px',
                                  border: '1px solid var(--border-hex)',
                                  backgroundColor: 'var(--card-bg-hex)',
                                  color: 'var(--text-muted-hex)',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'var(--transition)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#10b981';
                                  e.currentTarget.style.color = '#10b981';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--border-hex)';
                                  e.currentTarget.style.color = 'var(--text-muted-hex)';
                                }}
                                title="Restaurar Postulante"
                              >
                                <RotateCcw size={15} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleDelete(candidate.id, `${candidate.nombre} ${candidate.apellido}`)}
                                style={{
                                  padding: '6px',
                                  border: '1px solid var(--border-hex)',
                                  backgroundColor: 'var(--card-bg-hex)',
                                  color: 'var(--text-muted-hex)',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'var(--transition)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#ef4444';
                                  e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--border-hex)';
                                  e.currentTarget.style.color = 'var(--text-muted-hex)';
                                }}
                                title="Dar de baja Postulante"
                              >
                                <Trash2 size={15} />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderTop: '1px solid hsl(var(--border) / 0.7)',
              backgroundColor: 'var(--bg-table-header)',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
                Mostrando <span style={{ fontWeight: 600, color: 'var(--text-main-hex)' }}>{candidates.length}</span> de <span style={{ fontWeight: 600, color: 'var(--text-main-hex)' }}>{totalElements}</span> postulantes
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-hex)',
                    backgroundColor: page === 0 ? 'var(--bg-alt-hex)' : 'var(--card-bg-hex)',
                    color: page === 0 ? 'var(--text-muted-hex)' : 'var(--text-main-hex)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: page === 0 ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (page > 0) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-app-hex)';
                      e.currentTarget.style.borderColor = 'var(--text-muted-hex)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (page > 0) {
                      e.currentTarget.style.backgroundColor = 'var(--card-bg-hex)';
                      e.currentTarget.style.borderColor = 'var(--border-hex)';
                    }
                  }}
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>

                <div style={{
                  fontSize: '14px',
                  color: 'var(--text-muted-hex)',
                  fontWeight: 600,
                  padding: '0 8px'
                }}>
                  Página <span style={{ color: 'var(--text-main-hex)' }}>{page + 1}</span> de <span style={{ color: 'var(--text-main-hex)' }}>{totalPages || 1}</span>
                </div>

                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-hex)',
                    backgroundColor: page >= totalPages - 1 ? 'var(--bg-alt-hex)' : 'var(--card-bg-hex)',
                    color: page >= totalPages - 1 ? 'var(--text-muted-hex)' : 'var(--text-main-hex)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (page < totalPages - 1) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-app-hex)';
                      e.currentTarget.style.borderColor = 'var(--text-muted-hex)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (page < totalPages - 1) {
                      e.currentTarget.style.backgroundColor = 'var(--card-bg-hex)';
                      e.currentTarget.style.borderColor = 'var(--border-hex)';
                    }
                  }}
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* System Status and Metadata Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '16px',
        padding: '12px 24px',
        backgroundColor: 'var(--card-bg-hex)',
        border: '1px solid var(--border-hex)',
        borderRadius: '12px',
        fontSize: '13px',
        color: 'var(--text-muted-hex)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* API connection and speed info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block',
              boxShadow: '0 0 8px #10b981'
            }}></span>
            <span style={{ fontWeight: 600, color: 'var(--text-main-hex)' }}>Servidor Conectado</span>
          </div>
          {fetchTimeMs !== null && (
            <>
              <span style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-hex)' }}></span>
              <span>Generado en: <strong style={{ color: 'var(--text-main-hex)' }}>{fetchTimeMs} ms</strong></span>
            </>
          )}
        </div>

        {/* Database metadata stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Total Postulantes: <strong style={{ color: 'var(--text-main-hex)' }}>{totalElements}</strong></span>
          <span style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-hex)' }}></span>
          <span>Categorías/Rubros: <strong style={{ color: 'var(--text-main-hex)' }}>{rubros.length}</strong></span>
          {userRole && (
            <>
              <span style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-hex)' }}></span>
              <span>Sesión: <strong style={{ color: 'var(--text-main-hex)' }}>{userRole}</strong></span>
            </>
          )}
        </div>
      </div>

      </div>
    </>
  );
}
