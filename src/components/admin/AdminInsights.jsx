import { Ban, BarChart3, CalendarDays, CheckCircle2, PackageCheck, ReceiptText, TrendingUp, Truck } from 'lucide-react';
import { MetricCard } from './AdminUi';
import { ACTIVE_ORDER_STATUSES, formatCLP, HISTORY_ORDER_STATUSES, STATUS_LABELS, STATUS_STYLES } from './adminData';

function OperationalLoadChart({ counts }) {
  const max = Math.max(1, ...ACTIVE_ORDER_STATUSES.map(status => counts[status] ?? 0));
  const activeTotal = ACTIVE_ORDER_STATUSES.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
  const busiestStatus = ACTIVE_ORDER_STATUSES.reduce((best, status) => (
    (counts[status] ?? 0) > (counts[best] ?? 0) ? status : best
  ), ACTIVE_ORDER_STATUSES[0]);

  return (
    <section className="mt-4 rounded-[2rem] border border-[#efc6d8] bg-white p-4 shadow-[0_18px_48px_rgba(63,33,40,0.09)] backdrop-blur sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#be185d]/50">Carga operativa</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-[#3f2128]">Prioridad del dia</h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">
            {activeTotal ? `${activeTotal} pedidos activos. Mas atencion en ${STATUS_LABELS[busiestStatus]}.` : 'Sin pedidos activos por atender.'}
          </p>
        </div>
        <BarChart3 className="h-5 w-5 text-[#be185d]" />
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-[1.6rem] bg-[#fff7fb] p-3 sm:gap-3">
        {ACTIVE_ORDER_STATUSES.map(status => {
          const count = counts[status] ?? 0;
          const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
          const height = count ? Math.max(12, (count / max) * 100) : 0;
          return (
            <div key={status} className="flex min-w-0 flex-col items-center gap-2">
              <span className={`text-sm font-black ${count ? 'text-[#3f2128]' : 'text-[#3f2128]/36'}`}>{count}</span>
              <span className="flex h-32 w-full max-w-[4.5rem] items-end justify-center rounded-[1.35rem] border border-[#f2d4df] bg-white px-2 pb-2 shadow-inner">
                <span
                  className={`block w-full rounded-[1rem] ${count ? style.dot : 'bg-[#eed2dc]'}`}
                  style={{ height: count ? `${height}%` : '0.4rem' }}
                />
              </span>
              <span className="max-w-full truncate text-[10px] font-bold text-[#3f2128]/62 sm:text-xs">
                {STATUS_LABELS[status]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {HISTORY_ORDER_STATUSES.map(status => {
          const style = STATUS_STYLES[status] ?? STATUS_STYLES.delivered;
          return (
            <div key={status} className="flex items-center justify-between rounded-2xl border border-[#f1d3df] bg-white px-4 py-3 text-sm font-bold text-[#3f2128]/68">
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                {STATUS_LABELS[status]}
              </span>
              <span className="font-black text-[#3f2128]">{counts[status] ?? 0}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatCurrentMonthDay(label) {
  const day = Number(label);
  if (!Number.isFinite(day)) return label;
  const month = new Date().toLocaleDateString('es-CL', { month: 'short' }).replace('.', '');
  return `${day} ${month}`;
}

function InsightCard({ label, value, detail, Icon }) {
  return (
    <div className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#be185d]/62">{label}</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[#3f2128]">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#be185d]/12">
          <Icon className="h-4 w-4 text-[#be185d]" />
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#3f2128]/56">{detail}</p>
    </div>
  );
}

function MiniBarChart({ title, detail, data, valueKey = 'orders', formatValue = value => value }) {
  const max = Math.max(1, ...data.map(item => Number(item[valueKey]) || 0));

  return (
    <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-4 shadow-[0_16px_40px_rgba(63,33,40,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#3f2128]">{title}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">{detail}</p>
        </div>
        <BarChart3 className="h-5 w-5 shrink-0 text-[#be185d]" />
      </div>
      <div className="grid gap-3">
        {data.map(item => {
          const value = Number(item[valueKey]) || 0;
          return (
            <div key={item.label} className="grid grid-cols-[3.2rem_1fr_4.5rem] items-center gap-3 text-xs font-bold text-[#3f2128]/62">
              <span className="truncate">{item.label}</span>
              <span className="h-3 overflow-hidden rounded-full bg-[#f7dce8]">
                <span
                  className="block h-full rounded-full bg-[#be185d]"
                  style={{ width: `${value ? Math.max(7, (value / max) * 100) : 0}%` }}
                />
              </span>
              <span className="text-right text-[#3f2128]">{formatValue(value)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function VerticalBarChart({ title, detail, data, valueKey = 'orders', formatValue = value => value }) {
  const max = Math.max(1, ...data.map(item => Number(item[valueKey]) || 0));

  return (
    <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-4 shadow-[0_16px_40px_rgba(63,33,40,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#3f2128]">{title}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">{detail}</p>
        </div>
        <TrendingUp className="h-5 w-5 shrink-0 text-[#be185d]" />
      </div>
      <div className="flex h-56 items-end gap-3 overflow-x-auto rounded-[1.6rem] bg-[#fff7fb] px-4 pb-4 pt-5">
        {data.map(item => {
          const value = Number(item[valueKey]) || 0;
          const barHeight = value ? Math.max(12, (value / max) * 100) : 0;
          return (
            <div key={item.label} className="flex min-w-[3.8rem] flex-1 flex-col items-center justify-end gap-2">
              <span className={`text-[10px] font-black ${value ? 'text-[#3f2128]' : 'text-[#3f2128]/36'}`}>
                {formatValue(value)}
              </span>
              <span className="flex h-32 w-12 items-end justify-center rounded-full border border-[#f1d3df] bg-white px-2 pb-2 shadow-inner">
                {value ? (
                  <span
                    className="block w-full rounded-full bg-gradient-to-t from-[#be185d] to-[#f472b6] shadow-[0_10px_20px_rgba(190,24,93,0.18)]"
                    style={{ height: `${barHeight}%` }}
                  />
                ) : (
                  <span className="mb-0.5 block h-1.5 w-7 rounded-full bg-[#efd0dc]" />
                )}
              </span>
              <span className="max-w-[4.5rem] truncate text-[10px] font-bold text-[#3f2128]/62">{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SplitBarChart({ title, detail, data }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));

  return (
    <section className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#3f2128]">{title}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">{detail}</p>
        </div>
        <ReceiptText className="h-5 w-5 shrink-0 text-[#be185d]" />
      </div>
      <div className="grid gap-3">
        {data.length ? data.map(item => (
          <div key={item.label} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3 text-xs font-bold text-[#3f2128]/62">
            <span className="truncate">{item.label}</span>
            <span className="h-3 overflow-hidden rounded-full bg-[#f7dce8]">
              <span
                className="block h-full rounded-full bg-[#3f2128]"
                style={{ width: item.value ? `${Math.max(8, (item.value / total) * 100)}%` : '0%' }}
              />
            </span>
            <span className="text-right text-[#3f2128]">{item.value}</span>
          </div>
        )) : (
          <p className="rounded-2xl bg-[#fff7fb] px-4 py-3 text-sm font-semibold text-[#3f2128]/52">
            Aún no hay datos suficientes.
          </p>
        )}
      </div>
    </section>
  );
}

function RankingList({ title, detail, data, valueLabel }) {
  const max = Math.max(1, ...data.map(item => item.quantity ?? item.orders ?? item.value ?? 0));

  return (
    <section className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#3f2128]">{title}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">{detail}</p>
        </div>
        <PackageCheck className="h-5 w-5 shrink-0 text-[#be185d]" />
      </div>
      <div className="grid gap-3">
        {data.length ? data.map(item => {
          const value = item.quantity ?? item.orders ?? item.value ?? 0;
          return (
            <div key={item.label} className="rounded-2xl bg-[#fff7fb] px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-bold text-[#3f2128]">{item.label}</p>
                <p className="shrink-0 text-xs font-bold text-[#be185d]">{valueLabel(item)}</p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#f7dce8]">
                <span
                  className="block h-full rounded-full bg-[#be185d]"
                  style={{ width: value ? `${Math.max(8, (value / max) * 100)}%` : '0%' }}
                />
              </div>
            </div>
          );
        }) : (
          <p className="rounded-2xl bg-[#fff7fb] px-4 py-3 text-sm font-semibold text-[#3f2128]/52">
            Aún no hay datos suficientes.
          </p>
        )}
      </div>
    </section>
  );
}

function InsightsDashboard({ insights }) {
  const monthDaysWithOrders = insights.monthDays.filter(day => day.orders > 0);
  const visibleMonthDays = (monthDaysWithOrders.length ? monthDaysWithOrders : insights.monthDays.slice(0, 10))
    .map(day => ({ ...day, label: formatCurrentMonthDay(day.label) }));

  return (
    <section>
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#be185d]/62">Lectura del negocio</p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Datos para decidir mejor</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Hoy"
          value={`${insights.todayOrders} pedidos`}
          detail={`Ventas visibles: ${formatCLP(insights.todayRevenue)}`}
          Icon={CalendarDays}
        />
        <InsightCard
          label="Esta semana"
          value={`${insights.weekOrders} pedidos`}
          detail={`Ventas visibles: ${formatCLP(insights.weekRevenue)}`}
          Icon={BarChart3}
        />
        <InsightCard
          label="Este mes"
          value={`${insights.monthOrders} pedidos`}
          detail={`Ticket promedio: ${formatCLP(insights.averageTicketMonth)}`}
          Icon={ReceiptText}
        />
        <InsightCard
          label="Cancelación"
          value={`${insights.cancellationRate}%`}
          detail={`${insights.cancelledOrders} cancelados en los datos cargados`}
          Icon={Ban}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <VerticalBarChart
          title="Semana por pedidos"
          detail={`Día más fuerte: ${insights.strongestWeekday?.label ?? 'sin datos'}`}
          data={insights.weekdays}
        />
        <VerticalBarChart
          title="Ventas por dia del mes"
          detail="Muestra que fechas concentraron mas venta visible."
          data={visibleMonthDays}
          valueKey="revenue"
          formatValue={formatCLP}
        />
        <MiniBarChart
          title="Horarios fuertes"
          detail="Ayuda a preparar producción y respuestas por tramo horario."
          data={insights.timeSlots}
        />
        <SplitBarChart
          title="Retiro o delivery"
          detail="Ayuda a ver qué modalidad se usa más."
          data={insights.fulfillment}
        />
        <SplitBarChart
          title="Forma de pago"
          detail="Conteo simple por método registrado."
          data={insights.payments}
        />
        <RankingList
          title="Productos más pedidos"
          detail="Base para decidir stock, fotos y catálogo real."
          data={insights.topProducts}
          valueLabel={item => `${item.quantity} uds · ${formatCLP(item.revenue)}`}
        />
        <RankingList
          title="Zonas de delivery"
          detail="Sirve para entender rutas y posibles costos."
          data={insights.topZones}
          valueLabel={item => `${item.orders} pedidos`}
        />
      </div>
    </section>
  );
}

export default function AdminInsightsTab({ insights, metrics }) {
  return (
    <>
      <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Activos" value={insights.activeOrders} Icon={PackageCheck} />
        <MetricCard label="Listos" value={insights.readyOrders} Icon={CheckCircle2} />
        <MetricCard label="Entregados" value={metrics.counts.delivered ?? 0} Icon={Truck} />
        <MetricCard label="Cancelados" value={metrics.counts.cancelled ?? 0} Icon={Ban} />
        <MetricCard label="Ticket mes" value={formatCLP(insights.averageTicketMonth)} Icon={ReceiptText} />
        <MetricCard label="Ventas visibles" value={formatCLP(metrics.revenue)} Icon={BarChart3} />
      </section>
      <OperationalLoadChart counts={metrics.counts} />
      <section className="mt-5"><InsightsDashboard insights={insights} /></section>
    </>
  );
}
