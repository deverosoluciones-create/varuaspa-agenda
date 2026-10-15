import {useEffect,useState} from 'react'
import {auth,db,gp} from './firebase'
import {signInWithPopup,signOut,onAuthStateChanged} from 'firebase/auth'
import {ref,onValue,update,push} from 'firebase/database'

const pad=n=>String(n).padStart(2,'0')
const key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
const mins=t=>{const[h,m]=t.split(':');return +h*60+ +m}
const COLORS=['#c9a24b','#b5485d','#3f7f8c','#6b8e4e','#8a5cb5','#d9722b','#2f5fa8','#a0522d']
const wa=(phone,text)=>{let p=(phone||'').replace(/\D/g,'');if(p.length===10)p='57'+p;window.open(`https://wa.me/${p}?text=${encodeURIComponent(text)}`,'_blank')}
function useVal(path){const[v,s]=useState(undefined);useEffect(()=>{if(!path){s(null);return}return onValue(ref(db,path),x=>s(x.val()),()=>s(null))},[path]);return v}
const clash=(S,pid,date,start,dur,skip)=>Object.entries(S).some(([id,s])=>id!==skip&&s.providerId===pid&&s.date===date&&mins(start)<mins(s.start)+s.duration&&mins(s.start)<mins(start)+dur)
const Modal=({children,onClose})=><div className="modal" onClick={onClose}><div className="card" onClick={e=>e.stopPropagation()}>{children}</div></div>

// 🔸 Límite de caracteres para la descripción
const DESC_MAX = 160

export default function App(){
const[user,setUser]=useState(undefined)
useEffect(()=>onAuthStateChanged(auth,setUser),[])
const prov=useVal('providers'),apr=useVal('approved'),sl=useVal('slots')
const admin=useVal(user?`admins/${user.uid}`:null)===true
const P=prov||{},A=apr||{},S=sl||{}
const staff=!!user&&(admin||A[user.uid]===true)
const AP=useVal(staff?'appointments':null)||{}
const[tab,setTab]=useState('cal'),[month,setMonth]=useState(()=>{const d=new Date();d.setDate(1);return d}),[sel,setSel]=useState(key(new Date())),[modal,setModal]=useState(null)

// 🔸 Sistema de alertas bonitas (reemplaza alert/confirm)
const[toast,setToast]=useState(null)
const[confirmBox,setConfirmBox]=useState(null)
const notifyUser=(msg,type='info')=>{setToast({msg,type});setTimeout(()=>setToast(null),3500)}
const askConfirm=(msg,onYes)=>setConfirmBox({msg,onYes})

if(user===undefined||prov===undefined)return <div className="hero"><h2 className="script">Varua Spa</h2></div>
const mine=user&&P[user.uid]
const providers=Object.entries(P).filter(([u])=>A[u])
const pName=u=>P[u]?.name||'—',pCol=u=>P[u]?.color||'#999'
const first=new Date(month.getFullYear(),month.getMonth(),1),off=(first.getDay()+6)%7
const n=new Date(month.getFullYear(),month.getMonth()+1,0).getDate()
const cells=[...Array(off).fill(null),...Array.from({length:n},(_,i)=>key(new Date(month.getFullYear(),month.getMonth(),i+1)))]
const byDay=d=>Object.entries(S).filter(([,s])=>s.date===d).sort((a,b)=>mins(a[1].start)-mins(b[1].start))
const canTouch=s=>admin||s.providerId===user?.uid
const notify=items=>setModal({t:'notify',items})

// 🔸 Cancelar con confirmación bonita
const cancel=(id,s)=>{const a=AP[id]||{}
askConfirm('¿Cancelar esta cita?',()=>{
  update(ref(db),{[`slots/${id}`]:null,[`appointments/${id}`]:null})
  notify([{l:'Avisar al cliente',phone:a.phone,text:`Hola ${a.client}, lamentamos informarte que tu cita en Varua Spa del ${s.date} a las ${s.start} fue cancelada.`}])
  setConfirmBox(null)
  notifyUser('Cita cancelada','ok')
})}

return <>
<header><div><h1>VARUA SPA</h1><small>Agenda de citas</small></div>
<div style={{display:'flex',gap:6}}>{user?<>{mine||admin?<button className="ghost sm" onClick={()=>setModal({t:'profile'})}>Perfil</button>:null}<button className="ghost sm" onClick={()=>signOut(auth)}>Salir</button></>:<button className="gold sm" onClick={()=>signInWithPopup(auth,gp)}>Acceso personal</button>}</div></header>
<main>
{user&&!mine&&!admin&&<Profile user={user} first notifyUser={notifyUser}/>}
{user&&mine&&!staff&&<div className="banner">Tu cuenta está pendiente de aprobación por el administrador.</div>}
{!user&&<div className="hero"><h2 className="script">Amor y Amistad</h2><p>Consulta la agenda y solicita tu reserva.</p></div>}
{admin&&<div className="tabs"><button className={tab==='cal'?'gold':'ghost'} onClick={()=>setTab('cal')}>Calendario</button><button className={tab==='adm'?'gold':'ghost'} onClick={()=>setTab('adm')}>Administración</button></div>}
{tab==='adm'&&admin?<Admin P={P} A={A} S={S} AP={AP}/>:<>
<div className="card"><div className="bar"><button className="sm" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button>
<h2 className="script" style={{fontSize:'1.8rem'}}>{month.toLocaleDateString('es-CO',{month:'long',year:'numeric'})}</h2>
<button className="sm" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div>
<div className="grid">{['L','M','M','J','V','S','D'].map((d,i)=><div key={i} className="dow">{d}</div>)}
{cells.map((d,i)=>d?<button key={i} className={`day ${d===sel?'sel':''} ${d===key(new Date())?'today':''}`} onClick={()=>setSel(d)}>{+d.slice(8)}
<span className="dots">
  {[...new Set(byDay(d).map(([,s])=>s.providerId))].map(u=>
    P[u]?.photo
      ? <img key={u} src={P[u].photo} alt="" className="dot-photo"/>
      : <i key={u} className="dot" style={{background:pCol(u)}}/>
  )}
</span>
</button>:<div key={i}/>)}</div>

{/* 🔸 Leyenda con FOTO, clic abre modal de info */}
<div className="legend">
  {providers.map(([u,p])=>(
    <button key={u} className="legend-chip" onClick={()=>setModal({t:'provider',uid:u,p})}>
      {p.photo
        ? <img src={p.photo} alt={p.name} className="legend-photo"/>
        : <i style={{background:p.color}}/>}
      <span>{p.name}</span>
    </button>
  ))}
</div>
</div>
<div className="card"><div className="bar"><h2 style={{fontSize:'1rem'}}>{new Date(sel+'T12:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}</h2>
{staff?<button className="gold sm" onClick={()=>setModal({t:'form',date:sel})}>+ Agendar cliente</button>:<button className="gold sm" onClick={()=>setModal({t:'req'})}>Solicitar reserva</button>}</div>
{byDay(sel).length===0&&<p>Sin citas este día.</p>}
{byDay(sel).map(([id,s])=>{const a=AP[id],end=mins(s.start)+s.duration
return <div key={id} className="item" style={{borderColor:pCol(s.providerId)}}><b>{s.start} – {pad(Math.floor(end/60)%24)}:{pad(end%60)} · {pName(s.providerId)}</b>
{staff&&a&&<span>{a.client} · {a.phone}{a.service?` · ${a.service}`:''}</span>}{!staff&&<span>Ocupado</span>}
{staff&&canTouch(s)&&<div className="acts"><button className="sm" onClick={()=>setModal({t:'form',id,s,a})}>Editar</button><button className="sm" onClick={()=>setModal({t:'transfer',id,s,a})}>Transferir</button><button className="sm danger" onClick={()=>cancel(id,s)}>Cancelar</button></div>}</div>})}</div></>}
</main>
{modal?.t==='form'&&<Form m={modal} S={S} providers={providers} admin={admin} uid={user.uid} P={P} onClose={()=>setModal(null)} notify={notify}/>}
{modal?.t==='transfer'&&<Transfer m={modal} S={S} providers={providers.filter(([u])=>u!==modal.s.providerId)} P={P} onClose={()=>setModal(null)} notify={notify}/>}
{modal?.t==='req'&&<Request providers={providers} onClose={()=>setModal(null)} sel={sel}/>}
{modal?.t==='profile'&&<Modal onClose={()=>setModal(null)}><Profile user={user} cur={mine} done={()=>setModal(null)} notifyUser={notifyUser}/></Modal>}

{/* 🔸 Modal con info del prestador (foto + descripción + servicios) */}
{modal?.t==='provider'&&<Modal onClose={()=>setModal(null)}>
  <div className="provider-card">
    {modal.p.photo
      ? <img src={modal.p.photo} alt={modal.p.name} className="provider-photo"/>
      : <div className="provider-photo placeholder" style={{background:modal.p.color}}>{modal.p.name?.[0]}</div>}
    <h3 className="script" style={{fontSize:'1.7rem',margin:'8px 0 2px'}}>{modal.p.name}</h3>
    {modal.p.description && <p className="provider-desc">{modal.p.description}</p>}
    {modal.p.services && (
      <>
        <label style={{textAlign:'center'}}>Servicios</label>
        <div className="chips">
          {modal.p.services.split(',').map((s,i)=>s.trim()&&<span key={i} className="chip">{s.trim()}</span>)}
        </div>
      </>
    )}
  </div>
  <p style={{textAlign:'center'}}><button onClick={()=>setModal(null)}>Cerrar</button></p>
</Modal>}

{modal?.t==='notify'&&<Modal onClose={()=>setModal(null)}><h3>Avisar por WhatsApp</h3>{modal.items.map((x,i)=><p key={i}><button className="gold" onClick={()=>wa(x.phone,x.text)}>{x.l}</button></p>)}<button className="sm" onClick={()=>setModal(null)}>Cerrar</button></Modal>}

{/* 🔸 Toast (aviso flotante bonito) */}
{toast&&<div className={`toast ${toast.type}`}>{toast.msg}</div>}

{/* 🔸 Modal de confirmación bonito */}
{confirmBox&&<Modal onClose={()=>setConfirmBox(null)}>
  <h3 style={{textAlign:'center'}}>Confirmar</h3>
  <p style={{textAlign:'center'}}>{confirmBox.msg}</p>
  <p style={{textAlign:'center',display:'flex',gap:8,justifyContent:'center'}}>
    <button onClick={()=>setConfirmBox(null)}>No</button>
    <button className="gold" onClick={confirmBox.onYes}>Sí, continuar</button>
  </p>
</Modal>}
</>}

// 🔸 Profile ahora con servicios, descripción y foto de Gmail
function Profile({user,cur,first,done,notifyUser}){
const[f,setF]=useState({
  name:cur?.name||user.displayName||'',
  phone:cur?.phone||'',
  color:cur?.color||COLORS[0],
  services:cur?.services||'',
  description:cur?.description||'',
  photo:cur?.photo||user.photoURL||''   // 🔸 toma la foto de Gmail
}),[e,setE]=useState('')

useEffect(()=>{ if(user.photoURL && user.photoURL!==cur?.photo) setF(f=>({...f,photo:user.photoURL})) },[])


const save=async()=>{
  if(!f.name||f.phone.replace(/\D/g,'').length<10)return setE('Nombre y celular (10 dígitos) son obligatorios')
  if(f.description.length>DESC_MAX)return setE(`La descripción no puede pasar de ${DESC_MAX} caracteres`)
  await update(ref(db,`providers/${user.uid}`),{...f,email:user.email})
  notifyUser?.('Perfil guardado','ok')
  done?.()
}

const body=<>
  <h3>{first?'Registro de prestador de servicio':'Mi perfil'}</h3>

  {/* 🔸 Foto de Gmail */}
  {f.photo&&<div style={{textAlign:'center',margin:'6px 0'}}>
    <img src={f.photo} alt="perfil" style={{width:72,height:72,borderRadius:'50%',border:'3px solid var(--gold)',objectFit:'cover'}}/>
  </div>}

  <label>Nombre</label><input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
  <label>Celular (WhatsApp)</label><input inputMode="tel" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/>

  {/* 🔸 Servicios que presta */}
  <label>Servicios que prestas</label>
  <input value={f.services} onChange={e=>setF({...f,services:e.target.value})} placeholder="Uñas poligel, permanente, manicura…"/>
  <small style={{color:'#777'}}>Sepáralos con comas</small>

  {/* 🔸 Descripción con límite */}
  <label>Descripción corta</label>
  <textarea rows={3} maxLength={DESC_MAX} value={f.description}
    onChange={e=>setF({...f,description:e.target.value})}
    placeholder="Cuéntale a tus clientes algo breve sobre ti"/>
  <small style={{color:f.description.length>DESC_MAX-20?'#a11':'#777'}}>
    {f.description.length}/{DESC_MAX} caracteres
  </small>

  <label>Mi color</label>
  <div className="sw">{COLORS.map(c=><span key={c} className={f.color===c?'on':''} style={{background:c}} onClick={()=>setF({...f,color:c})}/>)}</div>
  {e&&<div className="err">{e}</div>}
  <p><button className="gold" onClick={save}>Guardar</button></p>
</>
return first?<div className="card">{body}<small>El administrador debe aprobar tu cuenta.</small></div>:body}

function Form({m,S,providers,admin,uid,P,onClose,notify}){
const s0=m.s,a0=m.a||{}
const[f,setF]=useState({date:s0?.date||m.date,start:s0?.start||'09:00',duration:s0?.duration||60,service:a0.service||'',client:a0.client||'',phone:a0.phone||'',providerId:s0?.providerId||uid}),[e,setE]=useState('')
const set=k=>ev=>setF({...f,[k]:ev.target.value})
const save=async()=>{const dur=+f.duration
if(!f.client||f.phone.replace(/\D/g,'').length<10||!f.start||!f.date||!(dur>=10))return setE('Completa cliente, celular (10 dígitos), fecha, hora y duración')
if(clash(S,f.providerId,f.date,f.start,dur,m.id))return setE('Ese prestador ya tiene una cita que se cruza con ese horario')
const id=m.id||push(ref(db,'slots')).key
await update(ref(db),{[`slots/${id}`]:{providerId:f.providerId,date:f.date,start:f.start,duration:dur},[`appointments/${id}`]:{providerId:f.providerId,client:f.client,phone:f.phone,service:f.service,date:f.date,start:f.start,duration:dur}})
onClose();notify([{l:'Confirmar al cliente',phone:f.phone,text:`Hola ${f.client}, tu cita en Varua Spa quedó ${m.id?'actualizada':'agendada'} para el ${f.date} a las ${f.start} con ${P[f.providerId]?.name}.`}])}
return <Modal onClose={onClose}><h3>{m.id?'Modificar cita':'Agendar cliente'}</h3>
{admin&&<><label>Prestador</label><select value={f.providerId} onChange={set('providerId')}>{providers.map(([u,p])=><option key={u} value={u}>{p.name}</option>)}</select></>}
<label>Cliente</label><input value={f.client} onChange={set('client')}/><label>Celular del cliente</label><input inputMode="tel" value={f.phone} onChange={set('phone')}/>
<label>Día</label><input type="date" value={f.date} onChange={set('date')}/><label>Hora</label><input type="time" value={f.start} onChange={set('start')}/>
<label>Duración (minutos)</label><input type="number" min="10" step="5" value={f.duration} onChange={set('duration')}/>
<label>Procedimiento (opcional)</label><input value={f.service} onChange={set('service')} placeholder="Manicura, pedicura…"/>
{e&&<div className="err">{e}</div>}<p><button className="gold" onClick={save}>Guardar</button> <button onClick={onClose}>Cerrar</button></p></Modal>}

function Transfer({m,S,providers,P,onClose,notify}){
const[to,setTo]=useState(providers[0]?.[0]||''),[e,setE]=useState('')
const go=async()=>{const{s,a,id}=m;if(!to)return;if(clash(S,to,s.date,s.start,s.duration,id))return setE('Ese prestador tiene cita a esa hora')
await update(ref(db),{[`slots/${id}/providerId`]:to,[`appointments/${id}/providerId`]:to});onClose()
notify([{l:`Avisar a ${P[to].name}`,phone:P[to].phone,text:`Hola ${P[to].name}, se te transfirió la cita de ${a.client} (${a.phone}) el ${s.date} a las ${s.start}${a.service?` · ${a.service}`:''}.`},
{l:'Avisar al cliente',phone:a.phone,text:`Hola ${a.client}, tu cita del ${s.date} a las ${s.start} en Varua Spa ahora será atendida por ${P[to].name}.`}])}
return <Modal onClose={onClose}><h3>Transferir cita</h3><label>Nuevo prestador</label><select value={to} onChange={e=>setTo(e.target.value)}>{providers.map(([u,p])=><option key={u} value={u}>{p.name}</option>)}</select>
{e&&<div className="err">{e}</div>}<p><button className="gold" onClick={go}>Transferir</button> <button onClick={onClose}>Cerrar</button></p></Modal>}

function Request({providers,onClose,sel}){
const[f,setF]=useState({p:providers[0]?.[0]||'',name:'',phone:'',when:sel,service:''}),set=k=>e=>setF({...f,[k]:e.target.value})
const go=()=>{const p=providers.find(([u])=>u===f.p)?.[1];if(!p||!f.name)return;wa(p.phone,`Hola ${p.name}, soy ${f.name} (${f.phone}). Quisiera reservar en Varua Spa para el ${f.when}${f.service?` · ${f.service}`:''}. ¿Tienes disponibilidad?`);onClose()}
return <Modal onClose={onClose}><h3>Solicitar reserva</h3><label>Con quién</label><select value={f.p} onChange={set('p')}>{providers.map(([u,p])=><option key={u} value={u}>{p.name}</option>)}</select>
<label>Tu nombre</label><input value={f.name} onChange={set('name')}/><label>Tu celular</label><input inputMode="tel" value={f.phone} onChange={set('phone')}/>
<label>Día / hora deseada</label><input value={f.when} onChange={set('when')}/><label>Servicio</label><input value={f.service} onChange={set('service')}/>
<p><button className="gold" onClick={go}>Continuar por WhatsApp</button> <button onClick={onClose}>Cerrar</button></p></Modal>}

function Admin({P,A,S,AP}){
const list=Object.entries(AP).sort((a,b)=>(b[1].date+b[1].start).localeCompare(a[1].date+a[1].start))
return <><div className="card"><h3>Prestadores</h3>{Object.entries(P).map(([u,p])=><div key={u} className="item" style={{borderColor:p.color}}>
<div style={{display:'flex',gap:10,alignItems:'center'}}>
  {p.photo
    ? <img src={p.photo} alt={p.name} style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--gold)'}}/>
    : <div style={{width:44,height:44,borderRadius:'50%',background:p.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>{p.name?.[0]}</div>}
  <div style={{flex:1}}>
    <b>{p.name}</b>
    <small style={{display:'block',color:'#777'}}>{p.email} · {p.phone}</small>
    {p.services&&<small style={{display:'block',color:'#555'}}>🛠 {p.services}</small>}
  </div>
</div>
<div className="acts"><button className={`sm ${A[u]?'danger':'gold'}`} onClick={()=>update(ref(db,'approved'),{[u]:A[u]?null:true})}>{A[u]?'Revocar acceso':'Aprobar'}</button></div></div>)}</div>
<div className="card"><h3>Actividad ({list.length} citas)</h3>{list.map(([id,a])=><div key={id} className="item" style={{borderColor:P[a.providerId]?.color}}><b>{a.date} {a.start} · {P[a.providerId]?.name}</b>{a.client} · {a.phone} · {a.duration} min{a.service?` · ${a.service}`:''}</div>)}</div></>}
