import React, { useState, useEffect, useRef } from 'react';
import { Car, Plus, Search, FileText, Download, Trash2, Edit2, X, Check, ChevronLeft, ChevronRight, Calendar, Building2, Wrench, ClipboardList, PenLine, Eye, AlertCircle, CheckCircle2, Clock, Loader2, Cloud, CloudOff, FolderOpen, AlertTriangle } from 'lucide-react';
import { supabase } from './supabase';

const SERVICIOS_CATALOGO = [
  'Lavado Full (exterior, interior y chasis)',
  'Lavado Exterior Completo (exterior y chasis)',
  'Limpieza Interior',
  'Lavado Exterior (sin chasis)',
  'Lavado de Tapiz',
  'Instalación de Fundas Asientos',
  'Recarga de Adblue',
  'Torqueo de Neumáticos',
  'Mantención Aire Acondicionado'
];

const EQUIPAMIENTO_CATALOGO = [
  'Pertiga Normal',
  'Pertiga Full Led',
  'Cuñas',
  'Piola para cuñas',
  'Porta cuñas',
  'Checkpoint tipo gota',
  'Baliza',
  'Focos Mineros',
  'Mallas elásticas'
];

const TIPOS_VEHICULO = ['Camioneta', 'Camión', 'Bus', 'Minibus', 'Automóvil', 'SUV', 'Furgón', 'Maquinaria'];

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getPeriodoKey(fecha) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getPeriodoLabel(periodoKey) {
  const [year, month] = periodoKey.split('-');
  return `${MESES[parseInt(month) - 1]} ${year}`;
}

function dbToApp(row) {
  return {
    id: row.id,
    n_control: row.n_control,
    nombre_empresa: row.nombre_empresa || '',
    patente: row.patente || '',
    tipo_vehiculo: row.tipo_vehiculo || '',
    marca: row.marca || '',
    modelo: row.modelo || '',
    kilometraje: row.kilometraje || '',
    servicios: row.servicios || [],
    servicios_otros: row.servicios_otros || '',
    equipamiento: row.equipamiento || [],
    equipamiento_otros: row.equipamiento_otros || '',
    cliente_entrega_fecha: row.cliente_entrega_fecha || '',
    cliente_entrega_hora: row.cliente_entrega_hora ? row.cliente_entrega_hora.slice(0, 5) : '',
    cliente_entrega_persona: row.cliente_entrega_persona || '',
    cliente_entrega_firma: row.cliente_entrega_firma || '',
    cliente_entrega_sin_firma: row.cliente_entrega_sin_firma || false,
    cliente_entrega_motivo_sin_firma: row.cliente_entrega_motivo_sin_firma || '',
    luandi_recibe_fecha: row.luandi_recibe_fecha || '',
    luandi_recibe_hora: row.luandi_recibe_hora ? row.luandi_recibe_hora.slice(0, 5) : '',
    luandi_recibe_persona: row.luandi_recibe_persona || '',
    luandi_entrega_fecha: row.luandi_entrega_fecha || '',
    luandi_entrega_hora: row.luandi_entrega_hora ? row.luandi_entrega_hora.slice(0, 5) : '',
    luandi_entrega_persona: row.luandi_entrega_persona || '',
    cliente_recibe_fecha: row.cliente_recibe_fecha || '',
    cliente_recibe_hora: row.cliente_recibe_hora ? row.cliente_recibe_hora.slice(0, 5) : '',
    cliente_recibe_persona: row.cliente_recibe_persona || '',
    cliente_recibe_firma: row.cliente_recibe_firma || '',
    observaciones: row.observaciones || '',
    observaciones_entrega: row.observaciones_entrega || '',
    estado: row.estado || 'en_proceso',
    fecha_creacion: row.fecha_creacion
  };
}

function appToDb(data) {
  const clean = { ...data };
  const dateFields = ['cliente_entrega_fecha', 'luandi_recibe_fecha', 'luandi_entrega_fecha', 'cliente_recibe_fecha'];
  const timeFields = ['cliente_entrega_hora', 'luandi_recibe_hora', 'luandi_entrega_hora', 'cliente_recibe_hora'];
  [...dateFields, ...timeFields].forEach(f => {
    if (clean[f] === '') clean[f] = null;
  });
  return clean;
}

function SignaturePad({ value, onChange, label }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;

    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
      setHasSignature(true);
    }
  }, []);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onChange(dataUrl);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        {hasSignature && (
          <button type="button" onClick={clear} className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
            <Trash2 size={12} /> Limpiar
          </button>
        )}
      </div>
      <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-32 touch-none cursor-crosshair rounded-lg"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm">
            <PenLine size={16} className="mr-2" /> Firme aquí
          </div>
        )}
      </div>
    </div>
  );
}

// Modal de alerta para validaciones
function AlertModal({ title, message, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-amber-600" size={22} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{message}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-full btn-primary justify-center">
          Entendido
        </button>
      </div>
    </div>
  );
}

export default function LuandiApp() {
  const [view, setView] = useState('home');
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conectado, setConectado] = useState(true);
  const [selectedIngreso, setSelectedIngreso] = useState(null);
  const [filterPatente, setFilterPatente] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(getPeriodoKey(new Date()));
  const [mostrarSelectorPeriodo, setMostrarSelectorPeriodo] = useState(false);
  const [toast, setToast] = useState(null);
  const [alertModal, setAlertModal] = useState(null);

  const cargarIngresos = async () => {
    try {
      const { data, error } = await supabase
        .from('ingresos')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      
      if (error) throw error;
      setIngresos((data || []).map(dbToApp));
      setConectado(true);
    } catch (e) {
      console.error('Error cargando ingresos:', e);
      setConectado(false);
      showToast('Error al cargar datos. Revise su conexión.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarIngresos();
    const subscription = supabase
      .channel('ingresos_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ingresos' },
        () => { cargarIngresos(); }
      )
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const showAlert = (title, message) => {
    setAlertModal({ title, message });
  };

  const obtenerSiguienteNumero = async () => {
    const { data, error } = await supabase.rpc('siguiente_n_control');
    if (error) throw error;
    return data;
  };

  const guardarIngreso = async (data) => {
    setSaving(true);
    try {
      if (data.id) {
        const { id, ...resto } = data;
        const { error } = await supabase
          .from('ingresos')
          .update(appToDb(resto))
          .eq('id', id);
        if (error) throw error;
        showToast('Registro actualizado correctamente');
      } else {
        const n_control = await obtenerSiguienteNumero();
        const nuevo = appToDb({
          ...data,
          n_control,
          estado: 'en_proceso'
        });
        const { error } = await supabase.from('ingresos').insert(nuevo);
        if (error) throw error;
        showToast(`Ingreso N°${n_control} registrado correctamente`);
      }
      await cargarIngresos();
      setView('historial');
    } catch (e) {
      console.error('Error guardando:', e);
      showToast('Error al guardar: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const cerrarEntrega = async (data) => {
    setSaving(true);
    try {
      const { id, ...resto } = data;
      const { error } = await supabase
        .from('ingresos')
        .update(appToDb({ ...resto, estado: 'entregado' }))
        .eq('id', id);
      if (error) throw error;
      showToast(`Entrega N°${data.n_control} registrada correctamente`);
      await cargarIngresos();
      setView('historial');
    } catch (e) {
      console.error('Error en entrega:', e);
      showToast('Error al registrar entrega: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const eliminarIngreso = async (id) => {
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await supabase.from('ingresos').delete().eq('id', id);
      if (error) throw error;
      showToast('Registro eliminado', 'info');
      await cargarIngresos();
    } catch (e) {
      console.error('Error eliminando:', e);
      showToast('Error al eliminar: ' + e.message, 'error');
    }
  };

  const periodosDisponibles = (() => {
    const map = new Map();
    ingresos.forEach(i => {
      const key = getPeriodoKey(i.fecha_creacion);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([key, count]) => ({ key, count, label: getPeriodoLabel(key) }))
      .sort((a, b) => b.key.localeCompare(a.key));
  })();

  const ingresosDelPeriodo = ingresos.filter(i => getPeriodoKey(i.fecha_creacion) === periodoSeleccionado);

  const ingresosFiltrados = ingresosDelPeriodo.filter(i => {
    const matchPatente = !filterPatente || (i.patente || '').toLowerCase().includes(filterPatente.toLowerCase());
    const matchEmpresa = !filterEmpresa || (i.nombre_empresa || '').toLowerCase().includes(filterEmpresa.toLowerCase());
    const matchEstado = filterEstado === 'todos' || i.estado === filterEstado;
    return matchPatente && matchEmpresa && matchEstado;
  });

  const exportarExcelPeriodo = () => {
    if (ingresosDelPeriodo.length === 0) {
      showToast('No hay registros en este período para exportar', 'info');
      return;
    }
    const headers = ['N°Control', 'Fecha Creación', 'Estado', 'Empresa', 'Patente', 'Tipo Vehículo', 'Marca', 'Modelo', 'Kilometraje', 'Servicios', 'Equipamiento', 'Fecha Ingreso Cliente', 'Hora Ingreso Cliente', 'Entregado por (cliente)', 'Recibido por (Luandi)', 'Fecha Entrega Cliente', 'Hora Entrega Cliente', 'Entregado por (Luandi)', 'Recibido por (cliente)', 'Observaciones'];
    
    const rows = ingresosDelPeriodo.map(i => [
      i.n_control,
      new Date(i.fecha_creacion).toLocaleDateString('es-CL'),
      i.estado === 'entregado' ? 'Entregado' : 'En proceso',
      i.nombre_empresa || '',
      i.patente || '',
      i.tipo_vehiculo || '',
      i.marca || '',
      i.modelo || '',
      i.kilometraje || '',
      [...(i.servicios || []), i.servicios_otros].filter(Boolean).join('; '),
      [...(i.equipamiento || []), i.equipamiento_otros].filter(Boolean).join('; '),
      i.cliente_entrega_fecha || '',
      i.cliente_entrega_hora || '',
      i.cliente_entrega_persona || '',
      i.luandi_recibe_persona || '',
      i.luandi_entrega_fecha || '',
      i.luandi_entrega_hora || '',
      i.luandi_entrega_persona || '',
      i.cliente_recibe_persona || '',
      (i.observaciones || '').replace(/\n/g, ' ')
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const periodoLabel = getPeriodoLabel(periodoSeleccionado).replace(' ', '_');
    a.download = `Luandi_Ingresos_${periodoLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${ingresosDelPeriodo.length} registros exportados (${getPeriodoLabel(periodoSeleccionado)})`);
  };

  const exportarExcelTodo = () => {
    if (ingresos.length === 0) {
      showToast('No hay registros para exportar', 'info');
      return;
    }
    const headers = ['N°Control', 'Fecha Creación', 'Estado', 'Empresa', 'Patente', 'Tipo Vehículo', 'Marca', 'Modelo', 'Kilometraje', 'Servicios', 'Equipamiento', 'Fecha Ingreso Cliente', 'Hora Ingreso Cliente', 'Entregado por (cliente)', 'Recibido por (Luandi)', 'Fecha Entrega Cliente', 'Hora Entrega Cliente', 'Entregado por (Luandi)', 'Recibido por (cliente)', 'Observaciones'];
    
    const rows = ingresos.map(i => [
      i.n_control,
      new Date(i.fecha_creacion).toLocaleDateString('es-CL'),
      i.estado === 'entregado' ? 'Entregado' : 'En proceso',
      i.nombre_empresa || '',
      i.patente || '',
      i.tipo_vehiculo || '',
      i.marca || '',
      i.modelo || '',
      i.kilometraje || '',
      [...(i.servicios || []), i.servicios_otros].filter(Boolean).join('; '),
      [...(i.equipamiento || []), i.equipamiento_otros].filter(Boolean).join('; '),
      i.cliente_entrega_fecha || '',
      i.cliente_entrega_hora || '',
      i.cliente_entrega_persona || '',
      i.luandi_recibe_persona || '',
      i.luandi_entrega_fecha || '',
      i.luandi_entrega_hora || '',
      i.luandi_entrega_persona || '',
      i.cliente_recibe_persona || '',
      (i.observaciones || '').replace(/\n/g, ' ')
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Luandi_Ingresos_Completo_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${ingresos.length} registros exportados`);
  };

  const generarPDF = (ingreso) => {
    const win = window.open('', '_blank');
    if (!win) {
      showToast('Permita ventanas emergentes para descargar el PDF', 'error');
      return;
    }
    const html = generarHTMLReporte(ingreso);
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const generarPDFRespaldosMes = () => {
    if (ingresosDelPeriodo.length === 0) {
      showToast('No hay registros en este período para generar PDF', 'info');
      return;
    }
    const win = window.open('', '_blank');
    if (!win) {
      showToast('Permita ventanas emergentes para descargar el PDF', 'error');
      return;
    }
    // Ordenar por número de control ascendente
    const ordenados = [...ingresosDelPeriodo].sort((a, b) => a.n_control - b.n_control);
    const html = generarHTMLRespaldosMes(ordenados, getPeriodoLabel(periodoSeleccionado));
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-blue-700 mb-3" size={32} />
          <p className="text-slate-600 text-sm">Cargando datos desde la nube...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <Car className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">LUANDI SERVICIOS</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Control de Ingreso y Entrega de Vehículos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 text-xs ${conectado ? 'text-green-600' : 'text-red-600'}`} title={conectado ? 'Conectado a la nube' : 'Sin conexión'}>
              {conectado ? <Cloud size={14} /> : <CloudOff size={14} />}
              <span className="hidden sm:inline">{conectado ? 'En línea' : 'Sin conexión'}</span>
            </div>
            {view !== 'home' && (
              <button onClick={() => setView('home')} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1">
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Inicio</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium max-w-md ${
          toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'error' ? 'bg-red-600 text-white' :
          'bg-slate-700 text-white'
        }`}>
          {toast.type === 'success' && <CheckCircle2 size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {saving && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg bg-blue-700 text-white text-sm flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Guardando...
        </div>
      )}

      {alertModal && (
        <AlertModal title={alertModal.title} message={alertModal.message} onClose={() => setAlertModal(null)} />
      )}

      {mostrarSelectorPeriodo && (
        <SelectorPeriodo
          periodos={periodosDisponibles}
          periodoActual={periodoSeleccionado}
          onSelect={(p) => { setPeriodoSeleccionado(p); setMostrarSelectorPeriodo(false); }}
          onClose={() => setMostrarSelectorPeriodo(false)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {view === 'home' && (
          <HomeView
            ingresos={ingresos}
            ingresosDelPeriodo={ingresosDelPeriodo}
            periodoLabel={getPeriodoLabel(periodoSeleccionado)}
            onNuevo={() => { setSelectedIngreso(null); setView('nuevo'); }}
            onHistorial={() => setView('historial')}
            onExportar={exportarExcelTodo}
          />
        )}
        {view === 'nuevo' && (
          <FormularioIngreso
            ingreso={selectedIngreso}
            onGuardar={guardarIngreso}
            onCancelar={() => setView(selectedIngreso ? 'historial' : 'home')}
            saving={saving}
            showAlert={showAlert}
          />
        )}
        {view === 'historial' && (
          <HistorialView
            ingresos={ingresosFiltrados}
            totalDelPeriodo={ingresosDelPeriodo.length}
            periodoLabel={getPeriodoLabel(periodoSeleccionado)}
            esMesActual={periodoSeleccionado === getPeriodoKey(new Date())}
            filterPatente={filterPatente}
            filterEmpresa={filterEmpresa}
            filterEstado={filterEstado}
            setFilterPatente={setFilterPatente}
            setFilterEmpresa={setFilterEmpresa}
            setFilterEstado={setFilterEstado}
            onAbrirSelector={() => setMostrarSelectorPeriodo(true)}
            onVer={(i) => { setSelectedIngreso(i); setView('detalle'); }}
            onEntregar={(i) => { setSelectedIngreso(i); setView('entrega'); }}
            onEditar={(i) => { setSelectedIngreso(i); setView('nuevo'); }}
            onEliminar={eliminarIngreso}
            onExportarPeriodo={exportarExcelPeriodo}
            onPDFRespaldos={generarPDFRespaldosMes}
            onNuevo={() => { setSelectedIngreso(null); setView('nuevo'); }}
          />
        )}
        {view === 'detalle' && selectedIngreso && (
          <DetalleView
            ingreso={selectedIngreso}
            onVolver={() => setView('historial')}
            onPDF={() => generarPDF(selectedIngreso)}
            onEntregar={() => setView('entrega')}
          />
        )}
        {view === 'entrega' && selectedIngreso && (
          <FormularioEntrega
            ingreso={selectedIngreso}
            onGuardar={cerrarEntrega}
            onCancelar={() => setView('historial')}
            saving={saving}
            showAlert={showAlert}
          />
        )}
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-500">
          <p className="font-medium">Luandi Servicios SPA</p>
          <p>Manzana 10, Sitio 11, Barrio Industrial Puerto Seco · Fono: 963458567</p>
          <p>contacto@luandiservicios.com · www.luandiservicios.com</p>
        </div>
      </footer>
    </div>
  );
}

function SelectorPeriodo({ periodos, periodoActual, onSelect, onClose }) {
  const porAnio = {};
  periodos.forEach(p => {
    const anio = p.key.split('-')[0];
    if (!porAnio[anio]) porAnio[anio] = [];
    porAnio[anio].push(p);
  });
  const anios = Object.keys(porAnio).sort((a, b) => b.localeCompare(a));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Seleccionar período</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-3">
          {periodos.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">No hay registros aún</p>
          ) : (
            anios.map(anio => (
              <div key={anio} className="mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2">Año {anio}</p>
                <div className="space-y-1">
                  {porAnio[anio].map(p => (
                    <button
                      key={p.key}
                      onClick={() => onSelect(p.key)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors ${
                        p.key === periodoActual ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <span className="font-medium text-sm">{p.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.key === periodoActual ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                        {p.count} {p.count === 1 ? 'ingreso' : 'ingresos'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function HomeView({ ingresos, ingresosDelPeriodo, periodoLabel, onNuevo, onHistorial, onExportar }) {
  const enProceso = ingresos.filter(i => i.estado === 'en_proceso').length;
  const entregados = ingresos.filter(i => i.estado === 'entregado').length;
  const hoy = ingresos.filter(i => {
    const fecha = new Date(i.fecha_creacion).toDateString();
    return fecha === new Date().toDateString();
  }).length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Sistema de Control Operativo</h2>
        <p className="text-blue-100 text-sm sm:text-base">Gestione ingresos, servicios y entregas de vehículos en tiempo real.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="En proceso" value={enProceso} color="amber" icon={<Clock size={20} />} />
        <StatCard label="Entregados" value={entregados} color="green" icon={<CheckCircle2 size={20} />} />
        <StatCard label="Hoy" value={hoy} color="blue" icon={<Calendar size={20} />} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionCard
          onClick={onNuevo}
          icon={<Plus size={28} />}
          title="Nuevo Ingreso"
          description="Registrar un nuevo vehículo ingresando al taller"
          primary
        />
        <ActionCard
          onClick={onHistorial}
          icon={<ClipboardList size={28} />}
          title="Historial"
          description={`${ingresosDelPeriodo.length} ingresos en ${periodoLabel}`}
        />
        <ActionCard
          onClick={onExportar}
          icon={<Download size={28} />}
          title="Exportar Todo"
          description="Descargar consolidado completo de todos los registros"
        />
      </div>

      {ingresos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-900 text-sm">Últimos ingresos</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {ingresos.slice(0, 5).map(i => (
              <div key={i.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                    #{i.n_control}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{i.nombre_empresa || 'Sin empresa'}</p>
                    <p className="text-xs text-slate-500 truncate">{i.patente} · {i.marca} {i.modelo}</p>
                  </div>
                </div>
                <EstadoBadge estado={i.estado} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  const colors = {
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700'
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-xl sm:text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs sm:text-sm text-slate-500">{label}</p>
    </div>
  );
}

function ActionCard({ onClick, icon, title, description, primary }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${
        primary ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white border-blue-700' : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-3 ${primary ? 'bg-white/20' : 'bg-blue-50 text-blue-700'}`}>
        {icon}
      </div>
      <h3 className={`font-bold mb-1 ${primary ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <p className={`text-xs sm:text-sm ${primary ? 'text-blue-100' : 'text-slate-500'}`}>{description}</p>
    </button>
  );
}

function EstadoBadge({ estado }) {
  if (estado === 'entregado') {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 size={12} /> Entregado</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock size={12} /> En proceso</span>;
}

function FormularioIngreso({ ingreso, onGuardar, onCancelar, saving, showAlert }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(ingreso || {
    nombre_empresa: '',
    patente: '',
    tipo_vehiculo: '',
    marca: '',
    modelo: '',
    kilometraje: '',
    servicios: [],
    servicios_otros: '',
    equipamiento: [],
    equipamiento_otros: '',
    cliente_entrega_fecha: new Date().toISOString().split('T')[0],
    cliente_entrega_hora: new Date().toTimeString().slice(0, 5),
    cliente_entrega_persona: '',
    cliente_entrega_firma: '',
    cliente_entrega_sin_firma: false,
    cliente_entrega_motivo_sin_firma: '',
    luandi_recibe_fecha: new Date().toISOString().split('T')[0],
    luandi_recibe_hora: new Date().toTimeString().slice(0, 5),
    luandi_recibe_persona: '',
    observaciones: ''
  });

  const update = (field, value) => setData({ ...data, [field]: value });

  const toggleServicio = (s) => {
    const arr = data.servicios || [];
    update('servicios', arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]);
  };

  const toggleEquipamiento = (s) => {
    const arr = data.equipamiento || [];
    update('equipamiento', arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]);
  };

  const puedeAvanzar = () => {
    if (step === 1) return data.nombre_empresa && data.patente && data.tipo_vehiculo && data.marca;
    if (step === 2) return true;
    if (step === 3) return data.cliente_entrega_persona && data.luandi_recibe_persona;
    return true;
  };

  // Validación antes de guardar
  const intentarGuardar = () => {
    // Validar firma de ingreso
    const tieneFirma = !!data.cliente_entrega_firma;
    const marcoSinFirma = !!data.cliente_entrega_sin_firma;
    const tieneMotivo = !!(data.cliente_entrega_motivo_sin_firma && data.cliente_entrega_motivo_sin_firma.trim());

    if (!tieneFirma && !marcoSinFirma) {
      showAlert(
        'Falta la firma del cliente',
        'Por favor solicite la firma del cliente en el paso 3 (Recepción).\n\nSi el cliente no puede firmar en este momento, marque la casilla "El cliente no firmó" e indique el motivo.'
      );
      setStep(3);
      return;
    }

    if (marcoSinFirma && !tieneMotivo) {
      showAlert(
        'Indique el motivo',
        'Marcó que el cliente no firmó. Debe indicar el motivo por el cual no se obtuvo la firma de ingreso.'
      );
      setStep(3);
      return;
    }

    onGuardar(data);
  };

  const steps = [
    { num: 1, label: 'Vehículo', icon: <Car size={16} /> },
    { num: 2, label: 'Servicios', icon: <Wrench size={16} /> },
    { num: 3, label: 'Recepción', icon: <PenLine size={16} /> },
    { num: 4, label: 'Observaciones', icon: <FileText size={16} /> }
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {ingreso ? `Editar ingreso N°${ingreso.n_control}` : `Nuevo Ingreso`}
          </h2>
          <p className="text-sm text-slate-500">Complete los datos del vehículo y servicios</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => setStep(s.num)}
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 flex-shrink-0"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s.num ? 'bg-blue-600 text-white' :
                  step > s.num ? 'bg-green-600 text-white' :
                  'bg-slate-200 text-slate-600'
                }`}>
                  {step > s.num ? <Check size={14} /> : s.num}
                </div>
                <span className={`text-xs sm:text-sm font-medium ${step === s.num ? 'text-slate-900' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </button>
              {idx < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 sm:mx-2 ${step > s.num ? 'bg-green-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <SectionTitle icon={<Building2 size={18} />} title="Datos de Ingreso" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre Empresa *">
              <input type="text" value={data.nombre_empresa} onChange={e => update('nombre_empresa', e.target.value)} className="input" placeholder="Ej: Minera Los Pelambres" />
            </Field>
            <Field label="N° Patente *">
              <input type="text" value={data.patente} onChange={e => update('patente', e.target.value.toUpperCase())} className="input" placeholder="AB-CD-12" />
            </Field>
            <Field label="Tipo de Vehículo *">
              <select value={data.tipo_vehiculo} onChange={e => update('tipo_vehiculo', e.target.value)} className="input">
                <option value="">Seleccione...</option>
                {TIPOS_VEHICULO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Marca *">
              <input type="text" value={data.marca} onChange={e => update('marca', e.target.value)} className="input" placeholder="Ej: Toyota" />
            </Field>
            <Field label="Modelo">
              <input type="text" value={data.modelo} onChange={e => update('modelo', e.target.value)} className="input" placeholder="Ej: Hilux 2023" />
            </Field>
            <Field label="Kilometraje">
              <input type="number" value={data.kilometraje} onChange={e => update('kilometraje', e.target.value)} className="input" placeholder="Ej: 45000" />
            </Field>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <SectionTitle icon={<Wrench size={18} />} title="Servicios Realizados" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {SERVICIOS_CATALOGO.map(s => (
                <CheckItem key={s} label={s} checked={(data.servicios || []).includes(s)} onChange={() => toggleServicio(s)} />
              ))}
            </div>
            <div className="mt-3">
              <Field label="Otros servicios">
                <input type="text" value={data.servicios_otros} onChange={e => update('servicios_otros', e.target.value)} className="input" placeholder="Especifique otros servicios realizados" />
              </Field>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <SectionTitle icon={<Wrench size={18} />} title="Equipamiento (cambio)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {EQUIPAMIENTO_CATALOGO.map(s => (
                <CheckItem key={s} label={s} checked={(data.equipamiento || []).includes(s)} onChange={() => toggleEquipamiento(s)} />
              ))}
            </div>
            <div className="mt-3">
              <Field label="Otro equipamiento">
                <input type="text" value={data.equipamiento_otros} onChange={e => update('equipamiento_otros', e.target.value)} className="input" placeholder="Especifique otro equipamiento cambiado o instalado" />
              </Field>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <SectionTitle icon={<Building2 size={18} />} title="Cliente entrega el vehículo" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <Field label="Fecha">
                <input type="date" value={data.cliente_entrega_fecha} onChange={e => update('cliente_entrega_fecha', e.target.value)} className="input" />
              </Field>
              <Field label="Hora">
                <input type="time" value={data.cliente_entrega_hora} onChange={e => update('cliente_entrega_hora', e.target.value)} className="input" />
              </Field>
              <Field label="Entregado por (cliente) *" className="sm:col-span-2">
                <input type="text" value={data.cliente_entrega_persona} onChange={e => update('cliente_entrega_persona', e.target.value)} className="input" placeholder="Nombre completo de quien entrega" />
              </Field>
              <div className="sm:col-span-2">
                {!data.cliente_entrega_sin_firma ? (
                  <>
                    <SignaturePad
                      label="Firma del cliente (entrega) *"
                      value={data.cliente_entrega_firma}
                      onChange={(v) => update('cliente_entrega_firma', v)}
                    />
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.cliente_entrega_sin_firma}
                          onChange={e => {
                            update('cliente_entrega_sin_firma', e.target.checked);
                            if (e.target.checked) update('cliente_entrega_firma', '');
                          }}
                          className="mt-0.5"
                        />
                        <div className="text-xs text-amber-900">
                          <span className="font-medium">El cliente no firmó en el momento del ingreso</span>
                          <p className="text-amber-700 mt-0.5">Marque esta casilla solo si no fue posible obtener la firma. Deberá indicar el motivo.</p>
                        </div>
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900">Ingreso sin firma del cliente</p>
                        <p className="text-xs text-amber-700 mt-1">Indique el motivo por el cual no se obtuvo la firma de ingreso.</p>
                      </div>
                    </div>
                    <Field label="Motivo *">
                      <textarea
                        value={data.cliente_entrega_motivo_sin_firma}
                        onChange={e => update('cliente_entrega_motivo_sin_firma', e.target.value)}
                        className="input min-h-[80px] resize-y"
                        placeholder="Ej: El chofer dejó el vehículo y se retiró sin esperar el registro. / Cliente envió vehículo por terceros sin acompañante."
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => {
                        update('cliente_entrega_sin_firma', false);
                        update('cliente_entrega_motivo_sin_firma', '');
                      }}
                      className="text-xs text-amber-800 hover:text-amber-900 underline"
                    >
                      ← Volver a solicitar firma
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <SectionTitle icon={<Wrench size={18} />} title="Personal Luandi recibe el vehículo" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <Field label="Fecha">
                <input type="date" value={data.luandi_recibe_fecha} onChange={e => update('luandi_recibe_fecha', e.target.value)} className="input" />
              </Field>
              <Field label="Hora">
                <input type="time" value={data.luandi_recibe_hora} onChange={e => update('luandi_recibe_hora', e.target.value)} className="input" />
              </Field>
              <Field label="Recibido por (Luandi) *" className="sm:col-span-2">
                <input type="text" value={data.luandi_recibe_persona} onChange={e => update('luandi_recibe_persona', e.target.value)} className="input" placeholder="Nombre del personal Luandi que recibe" />
              </Field>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionTitle icon={<FileText size={18} />} title="Observaciones" />
          <Field label="Comentarios o detalles adicionales">
            <textarea
              value={data.observaciones}
              onChange={e => update('observaciones', e.target.value)}
              className="input min-h-[140px] resize-y"
              placeholder="Anote cualquier observación relevante: estado del vehículo, hallazgos, recomendaciones, etc."
            />
          </Field>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-900 font-medium mb-2">Resumen del ingreso</p>
            <div className="text-xs text-blue-800 space-y-1">
              <p>• Empresa: <span className="font-medium">{data.nombre_empresa || '—'}</span></p>
              <p>• Vehículo: <span className="font-medium">{data.patente} · {data.marca} {data.modelo}</span></p>
              <p>• Servicios: <span className="font-medium">{(data.servicios || []).length + (data.servicios_otros ? 1 : 0)} marcados</span></p>
              <p>• Equipamiento: <span className="font-medium">{(data.equipamiento || []).length + (data.equipamiento_otros ? 1 : 0)} marcados</span></p>
              <p>• Firma cliente: <span className="font-medium">{data.cliente_entrega_firma ? '✓ Registrada' : (data.cliente_entrega_sin_firma ? '⚠ Sin firma (con motivo)' : '✗ Pendiente')}</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
        <button onClick={onCancelar} disabled={saving} className="btn-secondary order-2 sm:order-1 disabled:opacity-50">Cancelar</button>
        <div className="flex gap-2 order-1 sm:order-2">
          {step > 1 && <button onClick={() => setStep(step - 1)} disabled={saving} className="btn-secondary flex-1 sm:flex-none disabled:opacity-50"><ChevronLeft size={16} /> Anterior</button>}
          {step < 4 && (
            <button
              onClick={() => puedeAvanzar() && setStep(step + 1)}
              disabled={!puedeAvanzar() || saving}
              className="btn-primary flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          )}
          {step === 4 && (
            <button onClick={intentarGuardar} disabled={saving} className="btn-primary flex-1 sm:flex-none disabled:opacity-50">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><Check size={16} /> Guardar ingreso</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FormularioEntrega({ ingreso, onGuardar, onCancelar, saving, showAlert }) {
  const [data, setData] = useState({
    ...ingreso,
    luandi_entrega_fecha: ingreso.luandi_entrega_fecha || new Date().toISOString().split('T')[0],
    luandi_entrega_hora: ingreso.luandi_entrega_hora || new Date().toTimeString().slice(0, 5),
    luandi_entrega_persona: ingreso.luandi_entrega_persona || '',
    cliente_recibe_fecha: ingreso.cliente_recibe_fecha || new Date().toISOString().split('T')[0],
    cliente_recibe_hora: ingreso.cliente_recibe_hora || new Date().toTimeString().slice(0, 5),
    cliente_recibe_persona: ingreso.cliente_recibe_persona || '',
    cliente_recibe_firma: ingreso.cliente_recibe_firma || '',
    observaciones_entrega: ingreso.observaciones_entrega || ''
  });
  const update = (field, value) => setData({ ...data, [field]: value });

  const intentarGuardar = () => {
    if (!data.luandi_entrega_persona) {
      showAlert('Falta información', 'Indique el nombre del personal Luandi que entrega el vehículo.');
      return;
    }
    if (!data.cliente_recibe_persona) {
      showAlert('Falta información', 'Indique el nombre del cliente que recibe el vehículo.');
      return;
    }
    if (!data.cliente_recibe_firma) {
      showAlert(
        'Falta la firma de conformidad',
        'La firma del cliente al recibir el vehículo es obligatoria. Por favor solicite la firma antes de confirmar la entrega.\n\nLa firma de retiro es el respaldo de conformidad con los servicios realizados.'
      );
      return;
    }
    onGuardar(data);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Entrega del vehículo N°{ingreso.n_control}</h2>
        <p className="text-sm text-slate-500">{ingreso.nombre_empresa} · {ingreso.patente} · {ingreso.marca} {ingreso.modelo}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <SectionTitle icon={<Wrench size={18} />} title="Personal Luandi entrega el vehículo" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <Field label="Fecha">
            <input type="date" value={data.luandi_entrega_fecha} onChange={e => update('luandi_entrega_fecha', e.target.value)} className="input" />
          </Field>
          <Field label="Hora">
            <input type="time" value={data.luandi_entrega_hora} onChange={e => update('luandi_entrega_hora', e.target.value)} className="input" />
          </Field>
          <Field label="Entregado por (Luandi) *" className="sm:col-span-2">
            <input type="text" value={data.luandi_entrega_persona} onChange={e => update('luandi_entrega_persona', e.target.value)} className="input" placeholder="Nombre del personal Luandi" />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <SectionTitle icon={<Building2 size={18} />} title="Cliente recibe el vehículo" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <Field label="Fecha">
            <input type="date" value={data.cliente_recibe_fecha} onChange={e => update('cliente_recibe_fecha', e.target.value)} className="input" />
          </Field>
          <Field label="Hora">
            <input type="time" value={data.cliente_recibe_hora} onChange={e => update('cliente_recibe_hora', e.target.value)} className="input" />
          </Field>
          <Field label="Recibido por (cliente) *" className="sm:col-span-2">
            <input type="text" value={data.cliente_recibe_persona} onChange={e => update('cliente_recibe_persona', e.target.value)} className="input" placeholder="Nombre completo de quien retira el vehículo" />
          </Field>
          <div className="sm:col-span-2">
            <SignaturePad
              label="Firma del cliente (conformidad de retiro) *"
              value={data.cliente_recibe_firma}
              onChange={(v) => update('cliente_recibe_firma', v)}
            />
            <p className="text-xs text-slate-500 mt-1">La firma del cliente confirma la conformidad con los servicios realizados y el estado del vehículo al retirarlo. <strong>Esta firma es obligatoria.</strong></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <SectionTitle icon={<FileText size={18} />} title="Observaciones de entrega" />
        <Field label="Observaciones adicionales al momento del retiro">
          <textarea
            value={data.observaciones_entrega}
            onChange={e => update('observaciones_entrega', e.target.value)}
            className="input min-h-[100px] resize-y"
            placeholder="Anote cualquier detalle relevante al momento de la entrega"
          />
        </Field>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
        <button onClick={onCancelar} disabled={saving} className="btn-secondary order-2 sm:order-1 disabled:opacity-50">Cancelar</button>
        <button
          onClick={intentarGuardar}
          disabled={saving}
          className="btn-primary order-1 sm:order-2 disabled:opacity-50"
        >
          {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><Check size={16} /> Confirmar entrega</>}
        </button>
      </div>
    </div>
  );
}

function HistorialView({ ingresos, totalDelPeriodo, periodoLabel, esMesActual, filterPatente, filterEmpresa, filterEstado, setFilterPatente, setFilterEmpresa, setFilterEstado, onAbrirSelector, onVer, onEntregar, onEditar, onEliminar, onExportarPeriodo, onPDFRespaldos, onNuevo }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Historial de Ingresos</h2>
            <p className="text-sm text-slate-500">{ingresos.length} de {totalDelPeriodo} registros</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={onPDFRespaldos} className="btn-secondary" title="Generar PDF con todos los respaldos firmados del mes">
              <FileText size={16} /> <span className="hidden sm:inline">PDF respaldos</span>
            </button>
            <button onClick={onExportarPeriodo} className="btn-secondary">
              <Download size={16} /> <span className="hidden sm:inline">Excel mes</span>
            </button>
            <button onClick={onNuevo} className="btn-primary"><Plus size={16} /> Nuevo</button>
          </div>
        </div>

        <button
          onClick={onAbrirSelector}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between hover:from-blue-100 hover:to-indigo-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">{esMesActual ? 'Mes actual' : 'Período seleccionado'}</p>
              <p className="font-bold text-blue-900">{periodoLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <span className="text-sm font-medium hidden sm:inline">Cambiar período</span>
            <FolderOpen size={18} />
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterPatente}
              onChange={e => setFilterPatente(e.target.value)}
              placeholder="Buscar por patente..."
              className="input pl-9"
            />
          </div>
          <div className="relative">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterEmpresa}
              onChange={e => setFilterEmpresa(e.target.value)}
              placeholder="Buscar por empresa..."
              className="input pl-9"
            />
          </div>
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input">
            <option value="todos">Todos los estados</option>
            <option value="en_proceso">En proceso</option>
            <option value="entregado">Entregados</option>
          </select>
        </div>
      </div>

      {ingresos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <ClipboardList className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium">
            {totalDelPeriodo === 0 ? `No hay registros en ${periodoLabel}` : 'No hay registros que coincidan'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {totalDelPeriodo === 0 ? 'Cambie de período o cree un nuevo ingreso' : 'Pruebe ajustar los filtros'}
          </p>
          {totalDelPeriodo === 0 && (
            <button onClick={onAbrirSelector} className="btn-secondary mt-4">
              <FolderOpen size={16} /> Ver otros períodos
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">N°</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Empresa</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Vehículo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Patente</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ingresos.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-blue-700">#{i.n_control}</td>
                    <td className="px-4 py-3 text-slate-900">{i.nombre_empresa}</td>
                    <td className="px-4 py-3 text-slate-600">{i.marca} {i.modelo}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{i.patente}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(i.fecha_creacion).toLocaleDateString('es-CL')}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={i.estado} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <IconBtn onClick={() => onVer(i)} icon={<Eye size={14} />} title="Ver" />
                        {i.estado === 'en_proceso' && (
                          <>
                            <IconBtn onClick={() => onEditar(i)} icon={<Edit2 size={14} />} title="Editar" />
                            <IconBtn onClick={() => onEntregar(i)} icon={<Check size={14} />} title="Registrar entrega" color="green" />
                          </>
                        )}
                        <IconBtn onClick={() => onEliminar(i.id)} icon={<Trash2 size={14} />} title="Eliminar" color="red" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {ingresos.map(i => (
              <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-slate-500">N°{i.n_control} · {new Date(i.fecha_creacion).toLocaleDateString('es-CL')}</p>
                    <p className="font-bold text-slate-900">{i.nombre_empresa}</p>
                    <p className="text-sm text-slate-600">{i.marca} {i.modelo} · <span className="font-mono">{i.patente}</span></p>
                  </div>
                  <EstadoBadge estado={i.estado} />
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => onVer(i)} className="flex-1 text-xs py-2 px-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">Ver</button>
                  {i.estado === 'en_proceso' && (
                    <>
                      <button onClick={() => onEditar(i)} className="flex-1 text-xs py-2 px-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">Editar</button>
                      <button onClick={() => onEntregar(i)} className="flex-1 text-xs py-2 px-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium">Entregar</button>
                    </>
                  )}
                  <button onClick={() => onEliminar(i.id)} className="text-xs py-2 px-3 rounded-md bg-red-50 hover:bg-red-100 text-red-700 font-medium"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DetalleView({ ingreso, onVolver, onPDF, onEntregar }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Ingreso N°{ingreso.n_control}</h2>
            <EstadoBadge estado={ingreso.estado} />
          </div>
          <p className="text-sm text-slate-500">Creado el {new Date(ingreso.fecha_creacion).toLocaleString('es-CL')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onVolver} className="btn-secondary"><ChevronLeft size={16} /> Volver</button>
          <button onClick={onPDF} className="btn-secondary"><FileText size={16} /> PDF</button>
          {ingreso.estado === 'en_proceso' && (
            <button onClick={onEntregar} className="btn-primary"><Check size={16} /> Entregar</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DetalleCard title="Datos del vehículo" icon={<Car size={18} />}>
          <DetalleRow label="Empresa" value={ingreso.nombre_empresa} />
          <DetalleRow label="Patente" value={ingreso.patente} />
          <DetalleRow label="Tipo" value={ingreso.tipo_vehiculo} />
          <DetalleRow label="Marca" value={ingreso.marca} />
          <DetalleRow label="Modelo" value={ingreso.modelo} />
          <DetalleRow label="Kilometraje" value={ingreso.kilometraje ? `${Number(ingreso.kilometraje).toLocaleString('es-CL')} km` : '—'} />
        </DetalleCard>

        <DetalleCard title="Servicios y equipamiento" icon={<Wrench size={18} />}>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Servicios realizados</p>
            {(ingreso.servicios || []).length === 0 && !ingreso.servicios_otros ? (
              <p className="text-sm text-slate-400">Ninguno marcado</p>
            ) : (
              <ul className="text-sm text-slate-700 space-y-0.5">
                {(ingreso.servicios || []).map(s => <li key={s}>• {s}</li>)}
                {ingreso.servicios_otros && <li>• {ingreso.servicios_otros}</li>}
              </ul>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-1">Equipamiento (cambio)</p>
            {(ingreso.equipamiento || []).length === 0 && !ingreso.equipamiento_otros ? (
              <p className="text-sm text-slate-400">Ninguno marcado</p>
            ) : (
              <ul className="text-sm text-slate-700 space-y-0.5">
                {(ingreso.equipamiento || []).map(s => <li key={s}>• {s}</li>)}
                {ingreso.equipamiento_otros && <li>• {ingreso.equipamiento_otros}</li>}
              </ul>
            )}
          </div>
        </DetalleCard>

        <DetalleCard title="Recepción (cliente → Luandi)" icon={<Building2 size={18} />}>
          <DetalleRow label="Cliente entrega" value={`${ingreso.cliente_entrega_fecha || '—'} ${ingreso.cliente_entrega_hora || ''}`} />
          <DetalleRow label="Entregado por" value={ingreso.cliente_entrega_persona} />
          <DetalleRow label="Luandi recibe" value={`${ingreso.luandi_recibe_fecha || '—'} ${ingreso.luandi_recibe_hora || ''}`} />
          <DetalleRow label="Recibido por" value={ingreso.luandi_recibe_persona} />
          {ingreso.cliente_entrega_firma && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2">Firma de entrega (cliente)</p>
              <img src={ingreso.cliente_entrega_firma} alt="Firma" className="border border-slate-200 rounded-lg bg-white max-h-24" />
            </div>
          )}
          {ingreso.cliente_entrega_sin_firma && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                <p className="font-medium text-amber-900">⚠ Ingreso sin firma del cliente</p>
                <p className="text-amber-700 mt-1"><strong>Motivo:</strong> {ingreso.cliente_entrega_motivo_sin_firma}</p>
              </div>
            </div>
          )}
        </DetalleCard>

        <DetalleCard title="Entrega (Luandi → cliente)" icon={<PenLine size={18} />}>
          {ingreso.estado === 'entregado' ? (
            <>
              <DetalleRow label="Luandi entrega" value={`${ingreso.luandi_entrega_fecha || '—'} ${ingreso.luandi_entrega_hora || ''}`} />
              <DetalleRow label="Entregado por" value={ingreso.luandi_entrega_persona} />
              <DetalleRow label="Cliente recibe" value={`${ingreso.cliente_recibe_fecha || '—'} ${ingreso.cliente_recibe_hora || ''}`} />
              <DetalleRow label="Recibido por" value={ingreso.cliente_recibe_persona} />
              {ingreso.cliente_recibe_firma && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2">Firma de conformidad (cliente)</p>
                  <img src={ingreso.cliente_recibe_firma} alt="Firma" className="border border-slate-200 rounded-lg bg-white max-h-24" />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <Clock className="mx-auto text-amber-500 mb-2" size={32} />
              <p className="text-sm text-slate-600">Pendiente de entrega</p>
              <button onClick={onEntregar} className="btn-primary mt-3"><Check size={16} /> Registrar entrega</button>
            </div>
          )}
        </DetalleCard>
      </div>

      {(ingreso.observaciones || ingreso.observaciones_entrega) && (
        <DetalleCard title="Observaciones" icon={<FileText size={18} />}>
          {ingreso.observaciones && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Al ingreso</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{ingreso.observaciones}</p>
            </div>
          )}
          {ingreso.observaciones_entrega && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-1">A la entrega</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{ingreso.observaciones_entrega}</p>
            </div>
          )}
        </DetalleCard>
      )}
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
      <div className="text-blue-700">{icon}</div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
    </div>
  );
}

function CheckItem({ label, checked, onChange }) {
  return (
    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
      checked ? 'bg-blue-50 border-blue-200' : 'border-slate-200 hover:bg-slate-50'
    }`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded text-blue-600" />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function IconBtn({ onClick, icon, title, color = 'slate' }) {
  const colors = {
    slate: 'text-slate-600 hover:bg-slate-100',
    green: 'text-green-700 hover:bg-green-50',
    red: 'text-red-600 hover:bg-red-50'
  };
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-md ${colors[color]}`}>{icon}</button>
  );
}

function DetalleCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <SectionTitle icon={icon} title={title} />
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function DetalleRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value || '—'}</span>
    </div>
  );
}

// Generar HTML de un solo ingreso (formato completo)
function generarBloqueReporteIndividual(i, pageBreakAntes = false) {
  const servicios = SERVICIOS_CATALOGO.map(s => `
    <tr><td>${s}</td><td style="text-align:center;width:30px">${(i.servicios || []).includes(s) ? '✓' : ''}</td></tr>
  `).join('');
  const equipos = EQUIPAMIENTO_CATALOGO.map(s => `
    <tr><td>${s}</td><td style="text-align:center;width:30px">${(i.equipamiento || []).includes(s) ? '✓' : ''}</td></tr>
  `).join('');

  const firmaIngresoHTML = i.cliente_entrega_firma
    ? `<img src="${i.cliente_entrega_firma}" class="firma-img" />`
    : (i.cliente_entrega_sin_firma
        ? `<div style="font-size:9px;color:#92400e;padding:2px;text-align:center;line-height:1.2"><b>SIN FIRMA</b><br/><span style="font-size:8px">${(i.cliente_entrega_motivo_sin_firma || '').substring(0, 100)}</span></div>`
        : `<span style="color:#94a3b8;font-size:10px">Firma cliente - Ingreso</span>`);

  const firmaRetiroHTML = i.cliente_recibe_firma
    ? `<img src="${i.cliente_recibe_firma}" class="firma-img" />`
    : `<span style="color:#94a3b8;font-size:10px">Firma cliente - Retiro</span>`;

  return `
<div class="reporte-container" ${pageBreakAntes ? 'style="page-break-before:always"' : ''}>
  <div class="header">
    <div class="header-title">CONTROL DE INGRESO Y ENTREGA DE VEHICULO</div>
    <div class="logo">LUANDI SERVICIOS SPA<br><span style="font-size:9px;font-weight:normal">SERVICIOS INTEGRALES</span></div>
  </div>
  <div class="n-control">N°${i.n_control}</div>
  <div class="section-title">DATOS DE INGRESO</div>
  <table>
    <tr><td class="label">NOMBRE EMPRESA:</td><td>${i.nombre_empresa || ''}</td><td class="label">N° PATENTE:</td><td>${i.patente || ''}</td></tr>
    <tr><td class="label">TIPO DE VEHICULO:</td><td>${i.tipo_vehiculo || ''}</td><td class="label">MODELO VEHICULO:</td><td>${i.modelo || ''}</td></tr>
    <tr><td class="label">MARCA DE VEHICULO:</td><td>${i.marca || ''}</td><td class="label">KILOMETRAJE:</td><td>${i.kilometraje || ''}</td></tr>
  </table>
  <div class="section-title">SERVICIOS REALIZADOS</div>
  <table class="checkbox-table">
    <tr>
      <td style="width:50%;padding:0;vertical-align:top">
        <table style="border:none">
          <tr><td style="font-weight:bold;text-align:center;background:#f1f5f9">SERVICIOS</td><td style="font-weight:bold;text-align:center;background:#f1f5f9;width:30px">(x)</td></tr>
          ${servicios}
          <tr><td>Otros: ${i.servicios_otros || ''}</td><td></td></tr>
        </table>
      </td>
      <td style="width:50%;padding:0;vertical-align:top">
        <table style="border:none">
          <tr><td style="font-weight:bold;text-align:center;background:#f1f5f9">EQUIPAMIENTO (cambio)</td><td style="font-weight:bold;text-align:center;background:#f1f5f9;width:30px">(x)</td></tr>
          ${equipos}
          <tr><td>Otros: ${i.equipamiento_otros || ''}</td><td></td></tr>
        </table>
      </td>
    </tr>
  </table>
  <div class="section-title">CLIENTE</div>
  <table>
    <tr>
      <td class="label">FECHA:</td><td>${i.cliente_entrega_fecha || ''}</td>
      <td class="label">HORA:</td><td>${i.cliente_entrega_hora || ''}</td>
      <td class="label">FECHA:</td><td>${i.cliente_recibe_fecha || ''}</td>
      <td class="label">HORA:</td><td>${i.cliente_recibe_hora || ''}</td>
    </tr>
    <tr>
      <td class="label">ENTREGADO POR:</td><td colspan="3">${i.cliente_entrega_persona || ''}</td>
      <td class="label">RECIBIDO POR:</td><td colspan="3">${i.cliente_recibe_persona || ''}</td>
    </tr>
    <tr>
      <td colspan="4" class="firma-box">${firmaIngresoHTML}</td>
      <td colspan="4" class="firma-box">${firmaRetiroHTML}</td>
    </tr>
  </table>
  <div class="section-title">PERSONAL LUANDI</div>
  <table>
    <tr>
      <td class="label">FECHA:</td><td>${i.luandi_recibe_fecha || ''}</td>
      <td class="label">HORA:</td><td>${i.luandi_recibe_hora || ''}</td>
      <td class="label">FECHA:</td><td>${i.luandi_entrega_fecha || ''}</td>
      <td class="label">HORA:</td><td>${i.luandi_entrega_hora || ''}</td>
    </tr>
    <tr>
      <td class="label">RECIBIDO POR:</td><td colspan="3">${i.luandi_recibe_persona || ''}</td>
      <td class="label">ENTREGADO POR:</td><td colspan="3">${i.luandi_entrega_persona || ''}</td>
    </tr>
  </table>
  <table>
    <tr><td class="label">OBSERVACIONES</td></tr>
    <tr><td style="height:60px;vertical-align:top">${(i.observaciones || '').replace(/\n/g, '<br>')}${i.observaciones_entrega ? '<br><br><b>Entrega:</b> ' + i.observaciones_entrega.replace(/\n/g, '<br>') : ''}</td></tr>
  </table>
  <div class="footer">
    <b>Luandi Servicios SPA</b> · Manzana 10, Sitio 11, Barrio Industrial Puerto Seco · Fono: 963458567 · contacto@luandiservicios.com
  </div>
</div>`;
}

function getEstilosReporte() {
  return `
@page { size: A4; margin: 1cm; }
* { box-sizing: border-box; }
body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 0; }
.reporte-container { max-width: 800px; margin: 0 auto 0 auto; border: 2px solid #1e293b; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 2px solid #1e293b; }
.header-title { font-size: 16px; font-weight: bold; color: #1e40af; letter-spacing: 1px; }
.logo { font-size: 12px; font-weight: bold; color: #1e40af; text-align: right; }
.n-control { text-align: center; padding: 8px; font-size: 14px; font-weight: bold; border-bottom: 2px solid #1e293b; }
.section-title { background: #64748b; color: white; padding: 6px 12px; font-weight: bold; text-align: center; font-size: 12px; }
table { width: 100%; border-collapse: collapse; }
td { border: 1px solid #1e293b; padding: 6px 8px; }
.label { font-weight: bold; width: 25%; }
.checkbox-table td { padding: 4px 8px; }
.firma-box { border: 1px solid #1e293b; height: 80px; padding: 4px; text-align: center; vertical-align: middle; }
.firma-img { max-height: 70px; max-width: 100%; }
.footer { text-align: center; padding: 8px; font-size: 9px; border-top: 2px solid #1e293b; }
@media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
`;
}

function generarHTMLReporte(i) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Ingreso N°${i.n_control} - Luandi Servicios</title>
<style>${getEstilosReporte()}</style></head><body>
${generarBloqueReporteIndividual(i, false)}
</body></html>`;
}

function generarHTMLRespaldosMes(ingresos, periodoLabel) {
  const bloques = ingresos.map((i, idx) => generarBloqueReporteIndividual(i, idx > 0)).join('\n');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Respaldos ${periodoLabel} - Luandi Servicios</title>
<style>${getEstilosReporte()}</style></head><body>
${bloques}
</body></html>`;
}
