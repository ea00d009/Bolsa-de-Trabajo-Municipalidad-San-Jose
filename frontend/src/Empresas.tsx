import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Search, Plus, Phone, Mail, MapPin, User, Edit2, Trash2,
  Loader2, AlertCircle, Hash, Globe, Users, Calendar, ClipboardList, Eye,
  ArrowLeft, Save
} from 'lucide-react';

// ---------- Tipos ----------

interface Catalogo { id: number; nombre: string; }

interface Empresa {
  id: number;
  razonSocial: string;
  nombreFantasia: string | null;
  cuit: string | null;
  rubro: Catalogo | null;
  actividadPrincipal: string | null;
  cantidadEmpleados: string | null;
  direccion: string | null;
  barrio: Catalogo | null;
  localidad: string | null;
  contactoNombre: string | null;
  contactoCargo: string | null;
  telefono: string | null;
  telefonoSecundario: string | null;
  email: string | null;
  sitioWeb: string | null;
  interesIncorporar: string | null;
  perfilesDemandados: string | null;
  interesProgramasEmpleo: boolean | null;
  fechaRelevamiento: string | null;
  relevadoPorNombre: string | null;
  observaciones: string | null;
  fechaRegistro: string | null;
}

type EmpresaForm = {
  razonSocial: string;
  nombreFantasia: string;
  cuit: string;
  rubroId: string;
  actividadPrincipal: string;
  cantidadEmpleados: string;
  direccion: string;
  barrioId: string;
  localidad: string;
  contactoNombre: string;
  contactoCargo: string;
  telefono: string;
  telefonoSecundario: string;
  email: string;
  sitioWeb: string;
  interesIncorporar: string;
  perfilesDemandados: string;
  interesProgramasEmpleo: boolean;
  fechaRelevamiento: string;
  observaciones: string;
};

interface EmpresasProps {
  token: string | null;
  userRole?: string;
}

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

// ---------- Constantes ----------

const RANGOS_EMPLEADOS = ['1-5', '6-10', '11-50', '51-200', '+200'];

const INTERES_OPCIONES: Record<string, { label: string; bg: string; color: string }> = {
  SI: { label: 'Busca personal', bg: '#dcfce7', color: '#166534' },
  A_FUTURO: { label: 'Interés a futuro', bg: '#fef9c3', color: '#854d0e' },
  NO: { label: 'Sin búsquedas', bg: '#fee2e2', color: '#991b1b' },
  SIN_DATO: { label: 'Sin dato', bg: '#e2e8f0', color: '#475569' }
};

const todayISO = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const emptyForm = (): EmpresaForm => ({
  razonSocial: '',
  nombreFantasia: '',
  cuit: '',
  rubroId: '',
  actividadPrincipal: '',
  cantidadEmpleados: '',
  direccion: '',
  barrioId: '',
  localidad: 'San José',
  contactoNombre: '',
  contactoCargo: '',
  telefono: '',
  telefonoSecundario: '',
  email: '',
  sitioWeb: '',
  interesIncorporar: 'SIN_DATO',
  perfilesDemandados: '',
  interesProgramasEmpleo: false,
  fechaRelevamiento: todayISO(),
  observaciones: ''
});

// ---------- Utilidades ----------

/** Formatea dígitos de CUIT como XX-XXXXXXXX-X mientras se escribe. */
const formatCuit = (value: string) => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
};

/** Extrae el mensaje de error del backend (JSON {message} o texto plano). */
const readError = async (res: Response, fallback: string) => {
  const text = await res.text();
  if (!text) return fallback;
  try {
    const json = JSON.parse(text);
    return json.message || fallback;
  } catch {
    return text;
  }
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const websiteHref = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
const telHref = (tel: string) => `tel:${tel.replace(/[^\d+]/g, '')}`;

// ---------- Estilos compartidos ----------

const inputStyle: React.CSSProperties = {
  padding: '11px 14px',
  borderRadius: '10px',
  border: '1px solid var(--border-hex)',
  fontSize: '14px',
  backgroundColor: 'var(--card-bg-hex)',
  color: 'var(--text-main-hex)',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'var(--transition)'
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-main-hex)'
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '18px'
};

const iconButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '7px',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  border: '1px solid var(--border-hex)',
  color: 'var(--text-muted-hex)',
  cursor: 'pointer',
  transition: 'var(--transition)'
};

// ---------- Componente principal ----------

export default function Empresas({ token, userRole }: EmpresasProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [rubros, setRubros] = useState<Catalogo[]>([]);
  const [barrios, setBarrios] = useState<Catalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filtroRubro, setFiltroRubro] = useState('');
  const [filtroInteres, setFiltroInteres] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EmpresaForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [detalle, setDetalle] = useState<Empresa | null>(null);

  const isSuperAdmin = userRole === 'SuperAdmin';
  const authHeaders = useMemo(() => ({ 'Authorization': `Bearer ${token}` }), [token]);

  const fetchEmpresas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/empresas', { headers: authHeaders });
      if (!res.ok) throw new Error(await readError(res, 'No se pudieron cargar las empresas.'));
      setEmpresas(await res.json());
    } catch (err: unknown) {
      setError((err as Error).message || 'No se pudieron cargar las empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let isCancelled = false;

    const loadInitialData = async () => {
      setError(null);
      try {
        const [resEmpresas, resRubros, resBarrios] = await Promise.all([
          fetch('/api/empresas', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/rubros', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/barrios', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!isCancelled && resEmpresas.ok) {
          const dataEmpresas = await resEmpresas.json();
          setEmpresas(dataEmpresas);
        } else if (!isCancelled && !resEmpresas.ok) {
          throw new Error(await readError(resEmpresas, 'No se pudieron cargar las empresas.'));
        }

        if (!isCancelled && resRubros.ok) {
          const dataRubros: Catalogo[] = await resRubros.json();
          setRubros([...dataRubros].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        }

        if (!isCancelled && resBarrios.ok) {
          const dataBarrios = await resBarrios.json();
          setBarrios(dataBarrios);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError((err as Error).message || 'No se pudieron cargar las empresas.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return empresas.filter(e => {
      if (filtroRubro && String(e.rubro?.id ?? '') !== filtroRubro) return false;
      if (filtroInteres && (e.interesIncorporar || 'SIN_DATO') !== filtroInteres) return false;
      if (!q) return true;
      return (
        e.razonSocial.toLowerCase().includes(q) ||
        (e.nombreFantasia || '').toLowerCase().includes(q) ||
        (e.contactoNombre || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.direccion || '').toLowerCase().includes(q) ||
        (e.actividadPrincipal || '').toLowerCase().includes(q) ||
        (e.perfilesDemandados || '').toLowerCase().includes(q) ||
        (qDigits.length > 0 && (e.cuit || '').replace(/\D/g, '').includes(qDigits))
      );
    });
  }, [empresas, search, filtroRubro, filtroInteres]);

  const buscandoPersonal = empresas.filter(e => e.interesIncorporar === 'SI').length;

  // ---------- Navegación y Formulario ----------

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setViewMode('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (e: Empresa) => {
    setEditingId(e.id);
    setForm({
      razonSocial: e.razonSocial || '',
      nombreFantasia: e.nombreFantasia || '',
      cuit: e.cuit || '',
      rubroId: e.rubro ? String(e.rubro.id) : '',
      actividadPrincipal: e.actividadPrincipal || '',
      cantidadEmpleados: e.cantidadEmpleados || '',
      direccion: e.direccion || '',
      barrioId: e.barrio ? String(e.barrio.id) : '',
      localidad: e.localidad || 'San José',
      contactoNombre: e.contactoNombre || '',
      contactoCargo: e.contactoCargo || '',
      telefono: e.telefono || '',
      telefonoSecundario: e.telefonoSecundario || '',
      email: e.email || '',
      sitioWeb: e.sitioWeb || '',
      interesIncorporar: e.interesIncorporar || 'SIN_DATO',
      perfilesDemandados: e.perfilesDemandados || '',
      interesProgramasEmpleo: !!e.interesProgramasEmpleo,
      fechaRelevamiento: e.fechaRelevamiento ? e.fechaRelevamiento.slice(0, 10) : todayISO(),
      observaciones: e.observaciones || ''
    });
    setFormError(null);
    setViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDetail = (e: Empresa) => {
    setDetalle(e);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToList = () => {
    setViewMode('list');
    setEditingId(null);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateField = <K extends keyof EmpresaForm>(field: K, value: EmpresaForm[K]) => {
    setForm(prev => ({
      ...prev,
      [field]: field === 'cuit' ? formatCuit(value as string) : value
    }));
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError(null);

    // Validación rápida en cliente
    if (!form.razonSocial.trim()) {
      setFormError('La razón social es obligatoria.');
      return;
    }
    if (!form.telefono.trim() && !form.telefonoSecundario.trim() && !form.email.trim()) {
      setFormError('Indicá al menos un medio de contacto: teléfono o email.');
      return;
    }
    const cuitDigits = form.cuit.replace(/\D/g, '');
    if (cuitDigits.length > 0 && cuitDigits.length !== 11) {
      setFormError('El CUIT debe tener 11 dígitos.');
      return;
    }

    const payload = {
      ...form,
      rubroId: form.rubroId ? Number(form.rubroId) : null,
      barrioId: form.barrioId ? Number(form.barrioId) : null,
      cantidadEmpleados: form.cantidadEmpleados || null,
      fechaRelevamiento: form.fechaRelevamiento || null
    };

    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/empresas/${editingId}` : '/api/empresas', {
        method: editingId ? 'PUT' : 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await readError(res, 'No se pudo guardar la empresa.'));
      window.showToast(editingId ? 'Empresa actualizada con éxito.' : 'Empresa registrada con éxito.', 'success');
      setViewMode('list');
      setEditingId(null);
      fetchEmpresas();
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Ocurrió un error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (empresa: Empresa) => {
    window.showConfirm({
      title: 'Dar de baja empresa',
      message: `¿Seguro que deseas dar de baja a "${empresa.razonSocial}"? Podrás volver a registrarla con el mismo CUIT.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/empresas/${empresa.id}`, { method: 'DELETE', headers: authHeaders });
          if (!res.ok) throw new Error(await readError(res, 'No se pudo dar de baja la empresa.'));
          setEmpresas(prev => prev.filter(e => e.id !== empresa.id));
          if (detalle?.id === empresa.id) {
            setDetalle(null);
            setViewMode('list');
          }
          window.showToast('Empresa dada de baja.', 'success');
        } catch (err: unknown) {
          window.showToast((err as Error).message || 'Ocurrió un error.', 'error');
        }
      }
    });
  };

  // =========================================================================
  // VISTA 1: FORMULARIO INTEGRADO EN PÁGINA (ALTA / EDICIÓN)
  // =========================================================================
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <form onSubmit={handleSubmit} className="fade-in" style={{ padding: '0 20px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* Top Header Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={backToList}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                borderRadius: '12px'
              }}
              title="Volver al listado"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main-hex)' }}>
                {viewMode === 'create' ? 'Alta de Nueva Empresa' : 'Editar Ficha de Empresa'}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted-hex)', marginTop: '2px' }}>
                {viewMode === 'create'
                  ? 'Completa la información institucional, de contacto y demanda laboral.'
                  : `Modifica los datos del relevamiento de ${form.razonSocial || 'la empresa'}.`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={backToList}
              disabled={saving}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Cancelar
            </button>
            <button
              id="btn-guardar-empresa"
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600
              }}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Guardando...' : (viewMode === 'create' ? 'Registrar Empresa' : 'Guardar Cambios')}
            </button>
          </div>
        </div>

        {formError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '14px',
            padding: '16px', marginBottom: '24px', color: '#991b1b', fontSize: '14px', fontWeight: 500
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        {/* SECCIÓN 1: IDENTIFICACIÓN */}
        <FormSectionCard
          title="1. Identificación de la Empresa"
          accent="linear-gradient(90deg, #3b82f6, #00b4d8)"
        >
          <div style={gridStyle}>
            <Field label="Razón Social *" htmlFor="empresa-razon-social">
              <input
                id="empresa-razon-social"
                type="text"
                required
                maxLength={200}
                autoFocus
                placeholder="Ej. Frigorífico San José S.A."
                value={form.razonSocial}
                onChange={(e) => updateField('razonSocial', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Nombre de Fantasía" htmlFor="empresa-fantasia">
              <input
                id="empresa-fantasia"
                type="text"
                maxLength={150}
                placeholder="Nombre comercial o de marca"
                value={form.nombreFantasia}
                onChange={(e) => updateField('nombreFantasia', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="CUIT" htmlFor="empresa-cuit">
              <input
                id="empresa-cuit"
                type="text"
                inputMode="numeric"
                placeholder="30-12345678-9"
                value={form.cuit}
                onChange={(e) => updateField('cuit', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Rubro" htmlFor="empresa-rubro">
              <select
                id="empresa-rubro"
                value={form.rubroId}
                onChange={(e) => updateField('rubroId', e.target.value)}
                style={inputStyle}
              >
                <option value="">Sin especificar</option>
                {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </Field>

            <Field label="Actividad Principal" htmlFor="empresa-actividad">
              <input
                id="empresa-actividad"
                type="text"
                maxLength={255}
                placeholder="Ej. Producción avícola, metalúrgica..."
                value={form.actividadPrincipal}
                onChange={(e) => updateField('actividadPrincipal', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Dotación / Cantidad de Empleados" htmlFor="empresa-empleados">
              <select
                id="empresa-empleados"
                value={form.cantidadEmpleados}
                onChange={(e) => updateField('cantidadEmpleados', e.target.value)}
                style={inputStyle}
              >
                <option value="">Sin dato</option>
                {RANGOS_EMPLEADOS.map(r => <option key={r} value={r}>{r} empleados</option>)}
              </select>
            </Field>
          </div>
        </FormSectionCard>

        {/* SECCIÓN 2: UBICACIÓN */}
        <FormSectionCard
          title="2. Ubicación Geográfica"
          accent="linear-gradient(90deg, #10b981, #059669)"
        >
          <div style={gridStyle}>
            <Field label="Dirección / Calle y Número" htmlFor="empresa-direccion">
              <input
                id="empresa-direccion"
                type="text"
                maxLength={255}
                placeholder="Ej. Urquiza 1234"
                value={form.direccion}
                onChange={(e) => updateField('direccion', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Barrio" htmlFor="empresa-barrio">
              <select
                id="empresa-barrio"
                value={form.barrioId}
                onChange={(e) => updateField('barrioId', e.target.value)}
                style={inputStyle}
              >
                <option value="">Sin especificar</option>
                {barrios.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </Field>

            <Field label="Localidad" htmlFor="empresa-localidad">
              <input
                id="empresa-localidad"
                type="text"
                maxLength={100}
                placeholder="San José"
                value={form.localidad}
                onChange={(e) => updateField('localidad', e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>
        </FormSectionCard>

        {/* SECCIÓN 3: CONTACTO */}
        <FormSectionCard
          title="3. Datos de Contacto y Representación"
          accent="linear-gradient(90deg, #8b5cf6, #6366f1)"
        >
          <div style={gridStyle}>
            <Field label="Persona de Contacto" htmlFor="empresa-contacto">
              <input
                id="empresa-contacto"
                type="text"
                maxLength={100}
                placeholder="Ej. María López"
                value={form.contactoNombre}
                onChange={(e) => updateField('contactoNombre', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Cargo en la Empresa" htmlFor="empresa-contacto-cargo">
              <input
                id="empresa-contacto-cargo"
                type="text"
                maxLength={100}
                placeholder="Ej. Encargada de RR.HH., Dueño..."
                value={form.contactoCargo}
                onChange={(e) => updateField('contactoCargo', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Teléfono Primario" htmlFor="empresa-telefono">
              <input
                id="empresa-telefono"
                type="tel"
                maxLength={50}
                placeholder="Ej. 3447 480000"
                value={form.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Teléfono Alternativo / Celular" htmlFor="empresa-telefono2">
              <input
                id="empresa-telefono2"
                type="tel"
                maxLength={50}
                placeholder="Celular / WhatsApp"
                value={form.telefonoSecundario}
                onChange={(e) => updateField('telefonoSecundario', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Email Institucional" htmlFor="empresa-email">
              <input
                id="empresa-email"
                type="email"
                maxLength={150}
                placeholder="rrhh@empresa.com"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Sitio Web / Red Social" htmlFor="empresa-web">
              <input
                id="empresa-web"
                type="text"
                maxLength={255}
                placeholder="www.empresa.com.ar o instagram.com/empresa"
                value={form.sitioWeb}
                onChange={(e) => updateField('sitioWeb', e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>
        </FormSectionCard>

        {/* SECCIÓN 4: RELEVAMIENTO */}
        <FormSectionCard
          title="4. Relevamiento y Demanda Laboral"
          accent="linear-gradient(90deg, #f59e0b, #d97706)"
        >
          <div style={gridStyle}>
            <Field label="¿Incorpora personal actualmente?" htmlFor="empresa-interes">
              <select
                id="empresa-interes"
                value={form.interesIncorporar}
                onChange={(e) => updateField('interesIncorporar', e.target.value)}
                style={inputStyle}
              >
                <option value="SI">Sí, busca personal actualmente</option>
                <option value="A_FUTURO">Podría incorporar a futuro</option>
                <option value="NO">No por el momento</option>
                <option value="SIN_DATO">Sin dato</option>
              </select>
            </Field>

            <Field label="Fecha de Relevamiento" htmlFor="empresa-fecha">
              <input
                id="empresa-fecha"
                type="date"
                max={todayISO()}
                value={form.fechaRelevamiento}
                onChange={(e) => updateField('fechaRelevamiento', e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ marginTop: '16px' }}>
            <Field label="Perfiles / Puestos que suele demandar" htmlFor="empresa-perfiles">
              <textarea
                id="empresa-perfiles"
                rows={3}
                maxLength={2000}
                placeholder="Ej. Operarios de producción, choferes con licencia profesional, administrativos, técnicos..."
                value={form.perfilesDemandados}
                onChange={(e) => updateField('perfilesDemandados', e.target.value)}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label
              htmlFor="empresa-programas"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-main-hex)',
                userSelect: 'none'
              }}
            >
              <input
                id="empresa-programas"
                type="checkbox"
                checked={form.interesProgramasEmpleo}
                onChange={(e) => updateField('interesProgramasEmpleo', e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
              />
              Interesada en programas de empleo / prácticas laborales municipales
            </label>
          </div>

          <div style={{ marginTop: '16px' }}>
            <Field label="Observaciones Generales" htmlFor="empresa-observaciones">
              <textarea
                id="empresa-observaciones"
                rows={3}
                maxLength={2000}
                placeholder="Horarios de contacto, condiciones, comentarios surgidos de la visita o relevamiento..."
                value={form.observaciones}
                onChange={(e) => updateField('observaciones', e.target.value)}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
          </div>
        </FormSectionCard>

        {/* Barra inferior de acciones */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '16px',
          marginBottom: '40px'
        }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={backToList}
            disabled={saving}
            style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600 }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600
            }}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Guardando...' : (viewMode === 'create' ? 'Registrar Empresa' : 'Guardar Cambios')}
          </button>
        </div>
      </form>
    );
  }

  // =========================================================================
  // VISTA 2: FICHA DE DETALLE INTEGRADA EN PÁGINA
  // =========================================================================
  if (viewMode === 'detail' && detalle) {
    return (
      <div className="fade-in" style={{ padding: '0 20px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* Top Header Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={backToList}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                borderRadius: '12px'
              }}
              title="Volver al listado"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main-hex)' }}>
                  {detalle.razonSocial}
                </h2>
                <InteresBadge value={detalle.interesIncorporar} />
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted-hex)', marginTop: '2px' }}>
                {detalle.nombreFantasia ? `Nombre de fantasía: ${detalle.nombreFantasia}` : 'Ficha completa de relevamiento institucional'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => openEdit(detalle)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              <Edit2 size={16} /> Editar
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => handleDelete(detalle)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1px solid #fee2e2'
                }}
              >
                <Trash2 size={16} /> Dar de baja
              </button>
            )}
          </div>
        </div>

        {/* Bloque 1: Identificación y Ubicación */}
        <div style={{
          backgroundColor: 'var(--card-bg-hex)',
          borderRadius: '20px',
          border: '1px solid var(--border-hex)',
          boxShadow: 'var(--shadow)',
          padding: '32px',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '5px',
            background: 'linear-gradient(90deg, #3b82f6, #00b4d8)'
          }}></div>

          <SectionTitle title="Identificación y Ubicación" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <DetailItem label="Razón Social" value={detalle.razonSocial} />
            <DetailItem label="Nombre de Fantasía" value={detalle.nombreFantasia} />
            <DetailItem label="CUIT" value={detalle.cuit} />
            <DetailItem label="Rubro" value={detalle.rubro?.nombre} />
            <DetailItem label="Actividad Principal" value={detalle.actividadPrincipal} />
            <DetailItem label="Dotación" value={detalle.cantidadEmpleados ? `${detalle.cantidadEmpleados} empleados` : null} />
            <DetailItem label="Dirección" value={detalle.direccion} />
            <DetailItem label="Barrio" value={detalle.barrio?.nombre} />
            <DetailItem label="Localidad" value={detalle.localidad} />
          </div>
        </div>

        {/* Bloque 2: Contacto */}
        <div style={{
          backgroundColor: 'var(--card-bg-hex)',
          borderRadius: '20px',
          border: '1px solid var(--border-hex)',
          boxShadow: 'var(--shadow)',
          padding: '32px',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '5px',
            background: 'linear-gradient(90deg, #8b5cf6, #6366f1)'
          }}></div>

          <SectionTitle title="Datos de Contacto" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <DetailItem label="Persona de Contacto" value={detalle.contactoNombre} />
            <DetailItem label="Cargo" value={detalle.contactoCargo} />
            <DetailItem
              label="Teléfono Primario"
              value={detalle.telefono}
              href={detalle.telefono ? telHref(detalle.telefono) : undefined}
            />
            <DetailItem
              label="Teléfono Secundario / Celular"
              value={detalle.telefonoSecundario}
              href={detalle.telefonoSecundario ? telHref(detalle.telefonoSecundario) : undefined}
            />
            <DetailItem
              label="Email"
              value={detalle.email}
              href={detalle.email ? `mailto:${detalle.email}` : undefined}
            />
            <DetailItem
              label="Sitio Web / Red Social"
              value={detalle.sitioWeb}
              href={detalle.sitioWeb ? websiteHref(detalle.sitioWeb) : undefined}
              external
              icon={<Globe size={13} />}
            />
          </div>
        </div>

        {/* Bloque 3: Demanda y Relevamiento */}
        <div style={{
          backgroundColor: 'var(--card-bg-hex)',
          borderRadius: '20px',
          border: '1px solid var(--border-hex)',
          boxShadow: 'var(--shadow)',
          padding: '32px',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '5px',
            background: 'linear-gradient(90deg, #f59e0b, #d97706)'
          }}></div>

          <SectionTitle title="Relevamiento y Demanda Laboral" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <DetailItem label="Fecha de Relevamiento" value={formatDate(detalle.fechaRelevamiento)} />
            <DetailItem label="Relevada por" value={detalle.relevadoPorNombre} />
            <DetailItem label="Programas de Empleo" value={detalle.interesProgramasEmpleo ? 'Interesada en programas municipales' : 'No indicado'} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <DetailItem label="Perfiles y Puestos Demandados" value={detalle.perfilesDemandados} wide />
            <DetailItem label="Observaciones Generales" value={detalle.observaciones} wide />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA 3: LISTADO DE EMPRESAS (DASHBOARD)
  // =========================================================================
  return (
    <div className="fade-in" style={{ maxWidth: '100%', width: '100%', margin: '0 auto', padding: '0 20px' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '29px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Relevamiento de Empresas</h1>
          <p style={{ color: 'var(--text-muted-hex)', marginTop: '4px' }}>
            Registra empresas de la zona, sus datos de contacto y su demanda de personal.
          </p>
        </div>
        <button
          id="btn-nueva-empresa"
          onClick={openCreate}
          className="btn-primary"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px',
            borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          <Plus size={18} />
          Nueva Empresa
        </button>
      </div>

      {/* Indicadores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon={<Building2 size={18} />} label="Empresas relevadas" value={empresas.length} accent="#3b82f6" />
        <StatCard icon={<Users size={18} />} label="Buscan personal" value={buscandoPersonal} accent="#16a34a" />
        <StatCard
          icon={<ClipboardList size={18} />}
          label="Interés en programas de empleo"
          value={empresas.filter(e => e.interesProgramasEmpleo).length}
          accent="#8b5cf6"
        />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '460px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted-hex)' }} />
          <input
            id="buscar-empresa"
            type="text"
            placeholder="Buscar por nombre, CUIT, contacto, perfiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '40px', borderRadius: '10px' }}
          />
        </div>
        <select
          id="filtro-rubro-empresa"
          value={filtroRubro}
          onChange={(e) => setFiltroRubro(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '180px', borderRadius: '10px' }}
        >
          <option value="">Todos los rubros</option>
          {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
        <select
          id="filtro-interes-empresa"
          value={filtroInteres}
          onChange={(e) => setFiltroInteres(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '180px', borderRadius: '10px' }}
        >
          <option value="">Cualquier demanda</option>
          {Object.entries(INTERES_OPCIONES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize: '13px', color: 'var(--text-muted-hex)', fontWeight: 500 }}>
          {filtered.length} de {empresas.length}
        </span>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '14px', padding: '16px', marginBottom: '24px', color: '#991b1b' }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '15px', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Listado */}
      {loading ? (
        <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#3b82f6' }} />
          <span style={{ color: 'var(--text-muted-hex)', fontWeight: 500 }}>Cargando empresas...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          backgroundColor: 'var(--card-bg-hex)', borderRadius: '20px', border: '1px dashed var(--border-hex)'
        }}>
          <Building2 size={40} style={{ color: 'var(--text-muted-hex)' }} />
          <span style={{ color: 'var(--text-main-hex)', fontWeight: 600 }}>
            {empresas.length === 0 ? 'Todavía no hay empresas relevadas' : 'Ninguna empresa coincide con los filtros'}
          </span>
          {empresas.length === 0 && (
            <button
              onClick={openCreate}
              className="btn-primary"
              style={{
                marginTop: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              <Plus size={16} />
              Cargar primera empresa
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
          {filtered.map(empresa => (
            <EmpresaCard
              key={empresa.id}
              empresa={empresa}
              canDelete={isSuperAdmin}
              onView={() => openDetail(empresa)}
              onEdit={() => openEdit(empresa)}
              onDelete={() => handleDelete(empresa)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Subcomponentes ----------

function FormSectionCard({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: 'var(--card-bg-hex)',
      borderRadius: '20px',
      border: '1px solid var(--border-hex)',
      boxShadow: 'var(--shadow)',
      padding: '32px',
      marginBottom: '28px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '5px',
        background: accent
      }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '6px', height: '22px', borderRadius: '4px', backgroundColor: '#3b82f6' }}></div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main-hex)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </h3>
      </div>

      {children}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
      <div style={{ width: '6px', height: '22px', borderRadius: '4px', backgroundColor: '#3b82f6' }}></div>
      <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main-hex)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </h3>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label htmlFor={htmlFor} style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--card-bg-hex)', borderRadius: '16px', border: '1px solid var(--border-hex)',
      boxShadow: 'var(--shadow)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px'
    }}>
      <div style={{
        width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: `${accent}1a`, color: accent
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main-hex)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted-hex)', marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  );
}

function InteresBadge({ value }: { value: string | null }) {
  const opt = INTERES_OPCIONES[value || 'SIN_DATO'] || INTERES_OPCIONES.SIN_DATO;
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
      backgroundColor: opt.bg, color: opt.color, whiteSpace: 'nowrap'
    }}>
      {opt.label}
    </span>
  );
}

function EmpresaCard({ empresa, canDelete, onView, onEdit, onDelete }: {
  empresa: Empresa; canDelete: boolean; onView: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--card-bg-hex)', borderRadius: '18px', border: '1px solid var(--border-hex)',
        boxShadow: 'var(--shadow)', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px',
        transition: 'var(--transition)'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Building2 size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-main-hex)', wordBreak: 'break-word' }}>
            {empresa.nombreFantasia || empresa.razonSocial}
          </div>
          {empresa.nombreFantasia && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted-hex)' }}>{empresa.razonSocial}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted-hex)', marginTop: '2px' }}>
            <Hash size={11} />
            {empresa.cuit ? `CUIT ${empresa.cuit}` : 'Sin CUIT'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={onView} title="Ver ficha completa" style={iconButtonStyle}><Eye size={15} /></button>
          <button onClick={onEdit} title="Editar empresa" style={iconButtonStyle}><Edit2 size={15} /></button>
          {canDelete && (
            <button onClick={onDelete} title="Dar de baja empresa" style={{ ...iconButtonStyle, border: '1px solid #fee2e2', color: '#ef4444' }}>
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <InteresBadge value={empresa.interesIncorporar} />
        {empresa.rubro && (
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '999px', backgroundColor: 'var(--bg-app-hex)', color: 'var(--text-muted-hex)', border: '1px solid var(--border-hex)' }}>
            {empresa.rubro.nombre}
          </span>
        )}
        {empresa.cantidadEmpleados && (
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '999px', backgroundColor: 'var(--bg-app-hex)', color: 'var(--text-muted-hex)', border: '1px solid var(--border-hex)' }}>
            {empresa.cantidadEmpleados} empleados
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', borderTop: '1px solid var(--border-hex)', paddingTop: '14px' }}>
        <InfoRow
          icon={<User size={14} />}
          value={empresa.contactoNombre ? `${empresa.contactoNombre}${empresa.contactoCargo ? ` · ${empresa.contactoCargo}` : ''}` : null}
          empty="Sin persona de contacto"
        />
        <InfoRow
          icon={<Phone size={14} />}
          value={empresa.telefono || empresa.telefonoSecundario}
          href={(empresa.telefono || empresa.telefonoSecundario) ? telHref((empresa.telefono || empresa.telefonoSecundario)!) : undefined}
          empty="Sin teléfono"
        />
        <InfoRow
          icon={<Mail size={14} />}
          value={empresa.email}
          href={empresa.email ? `mailto:${empresa.email}` : undefined}
          empty="Sin email"
        />
        <InfoRow
          icon={<MapPin size={14} />}
          value={[empresa.direccion, empresa.barrio?.nombre].filter(Boolean).join(' · ') || null}
          empty="Sin dirección"
        />
      </div>

      {empresa.perfilesDemandados && (
        <div style={{ fontSize: '13px', color: 'var(--text-muted-hex)', backgroundColor: 'var(--bg-app-hex)', borderRadius: '10px', padding: '10px 12px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-main-hex)' }}>Demanda: </span>
          {empresa.perfilesDemandados.length > 120 ? `${empresa.perfilesDemandados.slice(0, 120)}…` : empresa.perfilesDemandados}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted-hex)', marginTop: 'auto' }}>
        <Calendar size={12} />
        Relevada el {formatDate(empresa.fechaRelevamiento)}
        {empresa.relevadoPorNombre && <> por {empresa.relevadoPorNombre}</>}
      </div>
    </div>
  );
}

function InfoRow({ icon, value, href, empty }: { icon: React.ReactNode; value: string | null; href?: string; empty: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: value ? 'var(--text-main-hex)' : 'var(--text-muted-hex)', minWidth: 0 }}>
      <span style={{ color: 'var(--text-muted-hex)', display: 'inline-flex', flexShrink: 0 }}>{icon}</span>
      {value && href ? (
        <a href={href} style={{ color: '#3b82f6', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</a>
      ) : (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: value ? 'normal' : 'italic' }}>{value || empty}</span>
      )}
    </div>
  );
}

function DetailItem({ label, value, href, external, icon, wide }: {
  label: string; value?: string | null; href?: string; external?: boolean; icon?: React.ReactNode; wide?: boolean;
}) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined, minWidth: 0 }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted-hex)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
        {label}
      </div>
      {value && href ? (
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '15px', color: '#3b82f6', textDecoration: 'none', wordBreak: 'break-all', fontWeight: 500 }}
        >
          {icon}{value}
        </a>
      ) : (
        <div style={{
          fontSize: '15px', color: value ? 'var(--text-main-hex)' : 'var(--text-muted-hex)',
          fontStyle: value ? 'normal' : 'italic', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontWeight: value ? 500 : 400
        }}>
          {value || 'Sin dato'}
        </div>
      )}
    </div>
  );
}
