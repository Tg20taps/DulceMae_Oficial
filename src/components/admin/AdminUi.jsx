export function MetricCard({ label, value, Icon }) {
  return (
    <div className="rounded-3xl border border-[#efc6d8] bg-white p-3 shadow-[0_16px_38px_rgba(63,33,40,0.08)] backdrop-blur sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase leading-snug tracking-[0.12em] text-[#be185d]/54 sm:text-xs sm:tracking-[0.16em]">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#be185d]/10 sm:h-10 sm:w-10">
          <Icon className="h-3.5 w-3.5 text-[#be185d] sm:h-4 sm:w-4" />
        </span>
      </div>
      <p className="mt-3 font-serif text-2xl font-bold text-[#3f2128] sm:mt-4 sm:text-3xl">{value}</p>
    </div>
  );
}

export function WorkspaceCard({ eyebrow, title, detail, Icon, muted = false }) {
  return (
    <div className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)] backdrop-blur sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#be185d]/10">
          <Icon className="h-4 w-4 text-[#be185d]" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#be185d]/50">{eyebrow}</p>
          <h3 className="mt-1 text-sm font-bold text-[#3f2128]">{title}</h3>
          <p className={`mt-1 text-xs font-medium leading-5 ${muted ? 'text-[#3f2128]/42' : 'text-[#3f2128]/58'}`}>
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}