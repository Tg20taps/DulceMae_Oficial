import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Minus, Plus, RefreshCw } from 'lucide-react';
import {
  exportarRecorte,
  FILTRO_LUZ,
  LADO_FOTO,
  LADO_MINIMO_RECOMENDADO,
  leerFoto,
  PUEDE_FILTRAR,
} from '../../lib/imagenes';
import { PrimaryButton, SecondaryButton, Sheet, Switch } from './AdminUi';

const ZOOM_MAXIMO = 3;

// Encuadre de la foto: se mueve con el dedo y se acerca con el control.
// Todas las fotos salen con la misma forma y tamaño, así el catálogo se ve
// parejo aunque vengan de Instagram, del celular o de una captura.
export default function EncuadreFoto({ file, aspect = 1, title = 'Encuadrar la foto', formato = 'webp', miniatura = true, onCancel, onDone }) {
  const [foto, setFoto] = useState(null);
  const [error, setError] = useState('');
  const [marco, setMarco] = useState({ ancho: 0, alto: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [luz, setLuz] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const marcoRef = useRef(null);
  const arrastre = useRef(null);

  useEffect(() => {
    let vigente = true;
    let url = null;
    leerFoto(file)
      .then(({ imagen, url: objectUrl }) => {
        url = objectUrl;
        if (vigente) setFoto({ imagen, url: objectUrl, ancho: imagen.naturalWidth, alto: imagen.naturalHeight });
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(readError => vigente && setError(readError.message));
    return () => {
      vigente = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  useLayoutEffect(() => {
    const element = marcoRef.current;
    if (!element) return undefined;
    const medir = () => {
      const ancho = element.clientWidth;
      setMarco({ ancho, alto: Math.round(ancho / aspect) });
    };
    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(element);
    return () => observer.disconnect();
  }, [aspect, foto]);

  const escalaBase = foto && marco.ancho ? Math.max(marco.ancho / foto.ancho, marco.alto / foto.alto) : 1;
  const escala = escalaBase * zoom;
  const visibleAncho = foto ? foto.ancho * escala : 0;
  const visibleAlto = foto ? foto.alto * escala : 0;

  const limitar = useCallback((x, y, ancho = visibleAncho, alto = visibleAlto) => ({
    x: Math.min(0, Math.max(marco.ancho - ancho, x)),
    y: Math.min(0, Math.max(marco.alto - alto, y)),
  }), [marco.ancho, marco.alto, visibleAncho, visibleAlto]);

  // Centrar al cargar la foto o cambiar el tamaño del marco.
  useEffect(() => {
    if (!foto || !marco.ancho) return;
    const base = Math.max(marco.ancho / foto.ancho, marco.alto / foto.alto);
    setZoom(1);
    setPos({ x: (marco.ancho - foto.ancho * base) / 2, y: (marco.alto - foto.alto * base) / 2 });
  }, [foto, marco.ancho, marco.alto]);

  function cambiarZoom(nuevo) {
    const valor = Math.min(ZOOM_MAXIMO, Math.max(1, nuevo));
    // Acercar sobre el centro del marco, no sobre la esquina.
    const centroX = (marco.ancho / 2 - pos.x) / escala;
    const centroY = (marco.alto / 2 - pos.y) / escala;
    const nuevaEscala = escalaBase * valor;
    setZoom(valor);
    setPos(limitar(
      marco.ancho / 2 - centroX * nuevaEscala,
      marco.alto / 2 - centroY * nuevaEscala,
      foto.ancho * nuevaEscala,
      foto.alto * nuevaEscala,
    ));
  }

  function centrar() {
    setZoom(1);
    setPos({ x: (marco.ancho - foto.ancho * escalaBase) / 2, y: (marco.alto - foto.alto * escalaBase) / 2 });
  }

  function alPresionar(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    arrastre.current = { x: event.clientX, y: event.clientY, inicio: pos };
  }

  function alMover(event) {
    if (!arrastre.current) return;
    const { x, y, inicio } = arrastre.current;
    setPos(limitar(inicio.x + event.clientX - x, inicio.y + event.clientY - y));
  }

  function alSoltar() {
    arrastre.current = null;
  }

  // Recorte en píxeles de la foto original.
  const recorte = foto ? { sx: -pos.x / escala, sy: -pos.y / escala, sw: marco.ancho / escala, sh: marco.alto / escala } : null;
  const fotoChica = recorte && recorte.sw < LADO_MINIMO_RECOMENDADO;

  async function usarFoto() {
    setGuardando(true);
    try {
      const resultado = await exportarRecorte(foto.imagen, recorte, {
        ancho: LADO_FOTO,
        alto: Math.round(LADO_FOTO / aspect),
        luz,
        formato,
        miniatura,
      });
      onDone(resultado);
    } catch (exportError) {
      setError(exportError.message);
      setGuardando(false);
    }
  }

  return (
    <Sheet
      title={title}
      onClose={guardando ? () => {} : onCancel}
      footer={(
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <SecondaryButton onClick={onCancel} disabled={guardando}>Cancelar</SecondaryButton>
          <PrimaryButton onClick={usarFoto} disabled={!foto || guardando}>
            {guardando ? 'Preparando...' : 'Usar esta foto'}
          </PrimaryButton>
        </div>
      )}
    >
      <p className="mb-3 text-sm font-semibold text-[#3f2128]/65">
        Mueve la foto con el dedo y acércala hasta que el producto quede al centro, con un poco de aire alrededor.
      </p>

      <div
        ref={marcoRef}
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl bg-[#3f2128]/10"
        style={{ height: marco.alto || undefined, aspectRatio: marco.alto ? undefined : String(aspect) }}
        onPointerDown={foto ? alPresionar : undefined}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
      >
        {foto ? (
          <img
            src={foto.url}
            alt="Foto a encuadrar"
            draggable={false}
            className="absolute left-0 top-0 max-w-none cursor-grab"
            style={{
              width: visibleAncho,
              height: visibleAlto,
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              filter: luz ? FILTRO_LUZ : undefined,
            }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            {error ? <span className="px-6 text-center text-sm font-bold text-red-600">{error}</span> : <RefreshCw className="h-7 w-7 animate-spin text-[#be185d]" />}
          </span>
        )}
        {/* Líneas guía: el producto se ve mejor cerca del cruce central. */}
        <span className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }, (_, i) => <span key={i} className="border border-white/35" />)}
        </span>
      </div>

      {foto && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => cambiarZoom(zoom - 0.25)}
              aria-label="Alejar"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#efc6d8] bg-white text-[#3f2128]"
            >
              <Minus className="h-5 w-5" />
            </button>
            <label className="flex-1">
              <span className="sr-only">Acercar</span>
              <input
                type="range"
                min="1"
                max={ZOOM_MAXIMO}
                step="0.01"
                value={zoom}
                onChange={(event) => cambiarZoom(Number(event.target.value))}
                className="h-12 w-full accent-[#be185d]"
              />
            </label>
            <button
              type="button"
              onClick={() => cambiarZoom(zoom + 0.25)}
              aria-label="Acercar"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#efc6d8] bg-white text-[#3f2128]"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <SecondaryButton onClick={centrar} className="w-full">Volver a centrar</SecondaryButton>
          {PUEDE_FILTRAR && (
            <Switch
              checked={luz}
              onChange={setLuz}
              label="Dar más luz"
              detail="Aclara un poco la foto. Úsalo si se ve oscura; si ya se ve bien, déjalo apagado."
            />
          )}
          {fotoChica && (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Esta foto es chica o está muy acercada: puede verse un poco borrosa. Si tienes la original, mejor usa esa.
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}
