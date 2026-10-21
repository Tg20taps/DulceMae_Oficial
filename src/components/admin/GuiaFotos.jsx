import { useState } from 'react';
import { Camera, Instagram, Heart } from 'lucide-react';
import { Sheet } from './AdminUi';

const TEMAS = [
  {
    value: 'productos',
    label: 'Fotos de productos',
    Icon: Camera,
    intro: 'Para que el catálogo se vea parejo y bonito, todas las fotos se toman igual:',
    puntos: [
      ['De día, junto a una ventana', 'Luz natural, sin flash y sin la luz amarilla de la ampolleta.'],
      ['Siempre el mismo fondo', 'Una cartulina, mantel o mesa clara y lisa. Usar el mismo para todo es lo que hace que el catálogo se vea profesional.'],
      ['Celular a la altura del producto', 'Un poco desde arriba, como lo vería alguien sentado a la mesa. Para tortas altas, más de frente.'],
      ['Producto al centro y completo', 'Con espacio alrededor. Después la app la recorta cuadrada.'],
      ['Sin zoom', 'Acércate con el celular. Toca la pantalla sobre la torta para enfocar y espera un segundo.'],
      ['Sólo el producto', 'Sin manos, bolsas ni otras cosas alrededor.'],
    ],
    cierre: 'Al elegir la foto, la app te deja moverla y acercarla para que quede centrada. Todas salen del mismo tamaño.',
  },
  {
    value: 'instagram',
    label: 'Desde Instagram',
    Icon: Instagram,
    intro: 'Si la foto ya está publicada en Instagram, en este orden:',
    puntos: [
      ['1. Búscala en la galería del celular', 'Casi siempre la foto original sigue ahí (Fotos en iPhone, Galería o Google Fotos en Android). Es la de mejor calidad.'],
      ['2. Descárgala desde Instagram', 'Configuración → Centro de cuentas → Tu información y permisos → Descargar tu información. Elige "Publicaciones" y calidad alta. Instagram avisa cuando está lista (puede tardar unas horas).'],
      ['3. Último recurso: captura de pantalla', 'Abre la publicación, haz zoom para que la foto llene la pantalla y toma una captura. Al subirla, encuádrala para sacar los bordes.'],
    ],
    cierre: 'Si la foto tiene texto, stickers o mucho fondo, mejor sacar una nueva para el catálogo y dejar la de Instagram para Instagram.',
  },
  {
    value: 'nosotros',
    label: 'Sobre nosotros',
    Icon: Heart,
    intro: 'Estas fotos cuentan quién está detrás. Funcionan mejor si son reales y cálidas:',
    puntos: [
      ['Tú con una torta terminada', 'Sonriendo, en la cocina o junto a una ventana. Es la foto que más confianza da.'],
      ['Tus manos trabajando', 'Decorando, rellenando o poniendo las frutas. No hace falta que se vea la cara.'],
      ['Un momento del proceso', 'La masa, el horno, ingredientes ordenados, la mesa lista para empezar.'],
      ['Un pedido entregado', 'Una torta en una celebración real (con permiso del cliente).'],
    ],
    cierre: 'Evita fotos de internet: los clientes notan cuando no son tuyas. Tres fotos bastan.',
  },
];

export default function GuiaFotos({ temaInicial = 'productos', onClose }) {
  const [tema, setTema] = useState(temaInicial);
  const actual = TEMAS.find(t => t.value === tema) ?? TEMAS[0];

  return (
    <Sheet title="Guía de fotos" onClose={onClose}>
      <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-[#3f2128]/6 p-1">
        {TEMAS.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTema(t.value)}
            className={`min-h-[48px] rounded-xl px-1 text-xs font-bold leading-tight sm:text-sm ${
              tema === t.value ? 'bg-white text-[#3f2128] shadow' : 'text-[#3f2128]/55'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-base font-semibold text-[#3f2128]">{actual.intro}</p>
      <ol className="mt-4 space-y-3">
        {actual.puntos.map(([titulo, detalle]) => (
          <li key={titulo} className="rounded-2xl border border-[#efc6d8] bg-white px-4 py-3">
            <p className="text-base font-bold text-[#3f2128]">{titulo}</p>
            <p className="mt-0.5 text-sm font-medium leading-6 text-[#3f2128]/65">{detalle}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-2xl bg-[#be185d]/8 px-4 py-3 text-sm font-semibold leading-6 text-[#3f2128]/80">{actual.cierre}</p>
    </Sheet>
  );
}
