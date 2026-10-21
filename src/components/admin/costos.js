// Cálculo de costos de recetas. Sin React: se puede probar suelto.
//
// Un ingrediente se anota como se compra (1 kg de harina a $1.290). En la
// receta se dice cuánto se usa en gramos, mililitros o unidades, y de ahí sale
// el costo. Al costo se le suma el tiempo de trabajo y, encima, la ganancia
// del negocio.

export const UNIDADES = {
  kg: { base: 'g', factor: 1000, nombre: 'kg' },
  g: { base: 'g', factor: 1, nombre: 'g' },
  l: { base: 'ml', factor: 1000, nombre: 'litro' },
  ml: { base: 'ml', factor: 1, nombre: 'ml' },
  un: { base: 'un', factor: 1, nombre: 'unidad' },
};

export const AJUSTES_POR_DEFECTO = { valor_hora_clp: 3500, ganancia_pct: 30 };

export function unidadBase(unit) {
  return UNIDADES[unit]?.base ?? 'un';
}

// Precio de un gramo, mililitro o unidad. null si falta el precio de compra.
export function precioPorUnidadBase(ingrediente) {
  const unidad = UNIDADES[ingrediente?.unit];
  const precio = ingrediente?.pack_price_clp;
  const cantidad = Number(ingrediente?.pack_amount);
  if (!unidad || precio === null || precio === undefined || !(cantidad > 0)) return null;
  return precio / (cantidad * unidad.factor);
}

// Texto de ayuda: "$1.290 el kg", "$4.200 por 30 unidades".
export function describirCompra(ingrediente, formato) {
  if (ingrediente.pack_price_clp === null || ingrediente.pack_price_clp === undefined) return 'Falta el precio';
  const cantidad = Number(ingrediente.pack_amount);
  const unidad = UNIDADES[ingrediente.unit]?.nombre ?? ingrediente.unit;
  const plural = cantidad === 1 ? unidad : unidad === 'unidad' ? 'unidades' : unidad === 'litro' ? 'litros' : unidad;
  const cuanto = cantidad === 1 ? `el ${unidad}` : `por ${cantidad.toLocaleString('es-CL')} ${plural}`;
  return `${formato(ingrediente.pack_price_clp)} ${cuanto}`;
}

export function redondearHaciaArriba(valor, paso = 500) {
  if (!(valor > 0)) return 0;
  return Math.ceil(valor / paso) * paso;
}

export function costoDeLinea(linea, ingredientesPorId) {
  if (!linea.ingredient_id) {
    return { costo: Number(linea.cost_clp) || 0, faltaPrecio: false, nombre: linea.label };
  }
  const ingrediente = ingredientesPorId.get(linea.ingredient_id);
  const precio = precioPorUnidadBase(ingrediente);
  const cantidad = Number(linea.amount) || 0;
  return {
    costo: precio === null ? 0 : Math.round(precio * cantidad),
    faltaPrecio: precio === null,
    nombre: ingrediente?.name ?? 'Ingrediente borrado',
  };
}

export function calcularReceta(receta, ingredientesPorId, ajustes = AJUSTES_POR_DEFECTO) {
  let ingredientes = 0;
  let otros = 0;
  const faltanPrecios = [];

  for (const linea of receta.items ?? []) {
    const { costo, faltaPrecio, nombre } = costoDeLinea(linea, ingredientesPorId);
    if (linea.ingredient_id) ingredientes += costo;
    else otros += costo;
    if (faltaPrecio && !faltanPrecios.includes(nombre)) faltanPrecios.push(nombre);
  }

  const minutos = Number(receta.work_minutes) || 0;
  const valorHora = Number(ajustes.valor_hora_clp) || 0;
  const gananciaPct = Number(ajustes.ganancia_pct) || 0;
  const materiales = ingredientes + otros;
  const trabajo = Math.round((minutos / 60) * valorHora);
  const costoTotal = materiales + trabajo;
  const sugerido = redondearHaciaArriba(costoTotal * (1 + gananciaPct / 100));
  const rinde = Math.max(1, Number(receta.yield_count) || 1);
  const venta = receta.sale_price_clp ? Number(receta.sale_price_clp) : null;

  return {
    ingredientes,
    otros,
    materiales,
    trabajo,
    minutos,
    costoTotal,
    sugerido,
    rinde,
    costoPorPorcion: Math.round(materiales / rinde),
    sugeridoPorPorcion: Math.round(sugerido / rinde),
    faltanPrecios,
    veredicto: venta === null ? null : veredictoDePrecio({ venta, materiales, costoTotal, sugerido, minutos }),
  };
}

// Qué significa vender a ese precio, en palabras.
export function veredictoDePrecio({ venta, materiales, costoTotal, sugerido, minutos }) {
  if (venta < materiales) {
    return {
      tono: 'rojo',
      titulo: 'Pierdes plata',
      detalle: 'Ese precio no alcanza ni para los ingredientes y gastos.',
    };
  }
  if (venta < costoTotal) {
    const porHora = minutos > 0 ? Math.round((venta - materiales) / (minutos / 60)) : 0;
    return {
      tono: 'naranjo',
      titulo: 'Tu trabajo queda mal pagado',
      detalle: minutos > 0
        ? `Cubres los ingredientes, pero tu hora queda pagada a $${porHora.toLocaleString('es-CL')}.`
        : 'Cubres los ingredientes, pero no tu tiempo.',
      porHora,
    };
  }
  if (venta < sugerido) {
    return {
      tono: 'amarillo',
      titulo: 'Cubres todo, pero ganas poco',
      detalle: `Te queda $${(venta - costoTotal).toLocaleString('es-CL')} de ganancia además de tu trabajo.`,
    };
  }
  return {
    tono: 'verde',
    titulo: 'Buen precio',
    detalle: `Cubres todo y te quedan $${(venta - costoTotal).toLocaleString('es-CL')} de ganancia además de tu trabajo.`,
  };
}

export function textoListaDeCompras(ingredientes, nombreNegocio) {
  const faltan = ingredientes.filter(i => i.stock_level === 'out');
  const poco = ingredientes.filter(i => i.stock_level === 'low');
  const lineas = [`Lista de compras ${nombreNegocio}`];
  if (faltan.length) lineas.push('', 'Se acabó:', ...faltan.map(i => `- ${i.name}`));
  if (poco.length) lineas.push('', 'Queda poco:', ...poco.map(i => `- ${i.name}`));
  return lineas.join('\n');
}

export const INGREDIENTES_COMUNES = [
  { name: 'Harina', unit: 'kg', pack_amount: 1 },
  { name: 'Azúcar', unit: 'kg', pack_amount: 1 },
  { name: 'Huevos', unit: 'un', pack_amount: 30 },
  { name: 'Mantequilla', unit: 'g', pack_amount: 250 },
  { name: 'Leche', unit: 'l', pack_amount: 1 },
  { name: 'Crema', unit: 'l', pack_amount: 1 },
  { name: 'Manjar', unit: 'kg', pack_amount: 1 },
  { name: 'Chocolate cobertura', unit: 'kg', pack_amount: 1 },
  { name: 'Polvos de hornear', unit: 'g', pack_amount: 100 },
  { name: 'Caja de torta', unit: 'un', pack_amount: 1 },
];
