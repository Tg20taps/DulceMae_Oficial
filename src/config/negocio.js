// Datos del negocio en un solo lugar. Los leen la portada, el checkout, la
// ubicación y el pie de página, así no vuelven a quedar contradicciones.
// Productos, precios y zonas de delivery NO van aquí: viven en Supabase y se
// editan desde el admin.

export const NEGOCIO = {
  nombre: 'DulceMae',
  descripcion: 'Tortas, kuchen y postres hechos a mano en Alerce, Puerto Montt. Pide por WhatsApp con retiro o delivery.',
  whatsapp: '56975562291',
  telefonoVisible: '+56 9 7556 2291',
  instagram: 'https://www.instagram.com/dulcemaeoficial/',
  instagramUsuario: '@dulcemaeoficial',
  tiktok: 'https://www.tiktok.com/@claudia.andrea2',
  sector: 'Alerce, Puerto Montt',
  direccion: 'Pje. Nueva 1, Casa 117, Alerce, Puerto Montt',
  mapa: { lat: -41.399373, lng: -72.9068 },
  // Mismo horario para atender y para elegir hora de entrega en el checkout.
  horario: {
    texto: 'Todos los días · 10:00 a 22:00',
    apertura: 10,
    cierre: 22,
    diasCerrados: [], // 0 = domingo, 6 = sábado
  },
  // Debe coincidir con create_order() en supabase/catalogo_y_costos.sql.
  anticipacionDias: 2,
};

export function enlaceWhatsApp(texto = '') {
  const base = `https://wa.me/${NEGOCIO.whatsapp}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}
