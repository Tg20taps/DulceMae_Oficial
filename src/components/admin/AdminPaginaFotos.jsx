import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, HelpCircle, ImageOff, RefreshCw, Share2 } from 'lucide-react';
import {
  adminRest,
  deleteProductImage,
  sharePhotoUrl,
  uploadProductPhoto,
  uploadSharePhoto,
} from '../../lib/adminApi';
import { EmptyState, PrimaryButton, SecondaryButton, SectionTitle } from './AdminUi';
import EncuadreFoto from './EncuadreFoto';
import GuiaFotos from './GuiaFotos';
import { Thumbnail } from './AdminCatalog';

const SLOT_LABELS = {
  nosotros_1: 'Foto 1',
  nosotros_2: 'Foto 2',
  nosotros_3: 'Foto 3',
};
const SHARE_SLOT = 'compartir';
// Proporción que usan WhatsApp, Facebook y Google para la vista previa de un link.
const SHARE_ASPECT = 1200 / 630;

function SlotCard({ slot, onPick, onRemove, onSaveCaption, busy }) {
  const [caption, setCaption] = useState(slot.caption ?? '');
  const changed = caption.trim() !== (slot.caption ?? '');

  useEffect(() => setCaption(slot.caption ?? ''), [slot.caption]);

  return (
    <li className="rounded-[1.6rem] border border-[#efc6d8] bg-white p-3">
      <div className="flex gap-3">
        <Thumbnail url={slot.image_url} name={SLOT_LABELS[slot.slot]} className="h-24 w-24" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-sm font-bold text-[#3f2128]">{SLOT_LABELS[slot.slot] ?? slot.slot}</p>
          <SecondaryButton onClick={() => onPick(slot.slot)} disabled={busy}>
            <Camera className="h-4 w-4 text-[#be185d]" />
            {slot.image_url ? 'Cambiar foto' : 'Elegir foto'}
          </SecondaryButton>
          {slot.image_url && (
            <button
              type="button"
              onClick={() => onRemove(slot)}
              disabled={busy}
              className="min-h-[40px] rounded-2xl text-sm font-bold text-[#3f2128]/55 disabled:opacity-50"
            >
              Quitar foto
            </button>
          )}
        </div>
      </div>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-bold text-[#3f2128]/60">Texto bajo la foto</span>
        <span className="flex gap-2">
          <input
            value={caption}
            maxLength={60}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Ej. Hecho con amor"
            className="min-h-[48px] min-w-0 flex-1 rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-3 text-base font-semibold text-[#3f2128] outline-none focus:border-[#be185d]/50"
          />
          {changed && (
            <button
              type="button"
              onClick={() => onSaveCaption(slot, caption.trim())}
              disabled={busy}
              className="min-h-[48px] shrink-0 rounded-2xl bg-[#be185d] px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              Guardar
            </button>
          )}
        </span>
      </label>
    </li>
  );
}

export default function AdminPaginaFotos({ session, showNotice }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [target, setTarget] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [busySlot, setBusySlot] = useState(null);
  const [guide, setGuide] = useState(null);
  const [shareVersion, setShareVersion] = useState(() => Date.now());
  const [hasShare, setHasShare] = useState(true);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const { data, error } = await adminRest(session, 'site_photos?select=*&order=slot.asc');
    if (error) setLoadError(error);
    else setSlots((data ?? []).filter(row => SLOT_LABELS[row.slot]));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  function pick(slot) {
    setTarget(slot);
    fileRef.current?.click();
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) setPendingFile(file);
  }

  async function patchSlot(slot, body) {
    return adminRest(session, `site_photos?slot=eq.${slot}`, { method: 'PATCH', body, prefer: 'return=minimal' });
  }

  async function savePhoto(photo) {
    const slotName = target;
    setPendingFile(null);
    setBusySlot(slotName);

    if (slotName === SHARE_SLOT) {
      const { error } = await uploadSharePhoto(session, photo.blob);
      setBusySlot(null);
      if (error) {
        showNotice(`No se pudo subir: ${error}`, 'error');
        return;
      }
      setHasShare(true);
      setShareVersion(Date.now());
      showNotice('Lista. Cuando alguien comparta el link de la página, aparecerá esta foto.');
      return;
    }

    const previous = slots.find(s => s.slot === slotName);
    const { data, error } = await uploadProductPhoto(session, photo);
    if (error) {
      setBusySlot(null);
      showNotice(`No se pudo subir: ${error}`, 'error');
      return;
    }
    const { error: saveError } = await patchSlot(slotName, { image_url: data.url, image_path: data.path });
    setBusySlot(null);
    if (saveError) {
      deleteProductImage(session, data.path);
      showNotice(`No se pudo guardar: ${saveError}`, 'error');
      return;
    }
    if (previous?.image_path) deleteProductImage(session, previous.image_path);
    showNotice('Foto guardada. Ya se ve en "Sobre nosotros".');
    await load();
  }

  async function removePhoto(slot) {
    setBusySlot(slot.slot);
    const { error } = await patchSlot(slot.slot, { image_url: null, image_path: null });
    setBusySlot(null);
    if (error) {
      showNotice(`No se pudo quitar: ${error}`, 'error');
      return;
    }
    if (slot.image_path) deleteProductImage(session, slot.image_path);
    showNotice('Foto quitada.');
    await load();
  }

  async function saveCaption(slot, caption) {
    setBusySlot(slot.slot);
    const { error } = await patchSlot(slot.slot, { caption: caption || null });
    setBusySlot(null);
    if (error) showNotice(`No se pudo guardar: ${error}`, 'error');
    else {
      showNotice('Texto guardado.');
      await load();
    }
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <SectionTitle
        title="Sobre nosotros"
        subtitle="Tres fotos tuyas que aparecen en la sección “Sobre nosotros”. Mientras no haya ninguna, esa parte muestra sólo el texto."
        action={(
          <SecondaryButton onClick={() => setGuide('nosotros')} className="w-full sm:w-auto">
            <HelpCircle className="h-4 w-4 text-[#be185d]" />
            Ideas para estas fotos
          </SecondaryButton>
        )}
      />

      {loading && !slots.length ? (
        <div className="flex justify-center py-12"><RefreshCw className="h-7 w-7 animate-spin text-[#be185d]" /></div>
      ) : loadError ? (
        <EmptyState Icon={ImageOff} title="No se pudieron cargar las fotos" detail={loadError}>
          <SecondaryButton onClick={load}><RefreshCw className="h-4 w-4" /> Reintentar</SecondaryButton>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {slots.map(slot => (
            <SlotCard
              key={slot.slot}
              slot={slot}
              busy={busySlot === slot.slot}
              onPick={pick}
              onRemove={removePhoto}
              onSaveCaption={saveCaption}
            />
          ))}
        </ul>
      )}

      <div className="mt-8">
        <SectionTitle
          title="Foto para compartir"
          subtitle="Es la imagen que aparece cuando alguien manda el link de la página por WhatsApp o Instagram. Ideal: tu mejor torta o una mesa con varios productos."
        />
        <div className="overflow-hidden rounded-[1.6rem] border border-[#efc6d8] bg-white">
          <div className="relative w-full bg-[#fde7f1]" style={{ aspectRatio: String(SHARE_ASPECT) }}>
            {hasShare ? (
              <img
                src={`${sharePhotoUrl()}?v=${shareVersion}`}
                alt="Foto para compartir el link"
                onError={() => setHasShare(false)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm font-bold text-[#be185d]/55">
                <Share2 className="h-7 w-7" />
                Todavía no hay foto para compartir
              </span>
            )}
            {busySlot === SHARE_SLOT && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                <RefreshCw className="h-7 w-7 animate-spin text-[#be185d]" />
              </span>
            )}
          </div>
          <div className="p-3">
            <PrimaryButton onClick={() => pick(SHARE_SLOT)} disabled={busySlot === SHARE_SLOT} className="w-full">
              <Camera className="h-5 w-5" />
              {hasShare ? 'Cambiar foto para compartir' : 'Elegir foto para compartir'}
            </PrimaryButton>
            <p className="mt-2 text-xs font-medium text-[#3f2128]/50">
              WhatsApp guarda la vista previa un tiempo: si cambias la foto, puede tardar unos días en verse la nueva.
            </p>
          </div>
        </div>
      </div>

      {pendingFile && (
        <EncuadreFoto
          file={pendingFile}
          aspect={target === SHARE_SLOT ? SHARE_ASPECT : 1}
          formato={target === SHARE_SLOT ? 'jpeg' : 'webp'}
          miniatura={target !== SHARE_SLOT}
          title={target === SHARE_SLOT ? 'Encuadrar foto para compartir' : 'Encuadrar foto'}
          onCancel={() => setPendingFile(null)}
          onDone={savePhoto}
        />
      )}
      {guide && <GuiaFotos temaInicial={guide} onClose={() => setGuide(null)} />}
    </div>
  );
}
