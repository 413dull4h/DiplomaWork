export function dt(v?:string|null,l='en'){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat(l,{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d)}
export function d(v?:string|null,l='en'){if(!v)return '—';const x=new Date(v);return Number.isNaN(x.getTime())?'—':new Intl.DateTimeFormat(l,{year:'numeric',month:'short',day:'2-digit'}).format(x)}
export function n(v?:number|null,l='en'){return new Intl.NumberFormat(l).format(v??0)}
export function addr(a?:{line1?:string|null;city?:string|null;state?:string|null;country?:string|null}|null){return a?[a.line1,a.city,a.state,a.country].filter(Boolean).join(', ')||'—':'—'}
export function today(){return new Date().toISOString().slice(0,10)}
export function initials(name?:string|null){return name?.split(' ').filter(Boolean).slice(0,2).map(p=>p[0]?.toUpperCase()).join('')||'P'}
