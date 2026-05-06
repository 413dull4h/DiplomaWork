export function fmtDateTime(v?:string|null,locale='en'){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat(locale,{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d)}
export function initials(name?:string|null){if(!name)return 'H';return name.trim().split(/\s+/).slice(0,3).map(w=>w[0]?.toUpperCase()).join('')||'H'}
export function timeOk(a:string,b:string){const [ah,am]=a.split(':').map(Number),[bh,bm]=b.split(':').map(Number);return ah*60+am<bh*60+bm}
