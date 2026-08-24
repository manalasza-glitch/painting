async function submitMaintenancePlan(event){
  if(event) event.preventDefault();
  const p={planId:'mp_'+Date.now(),machine:document.getElementById('maintenanceMachine').value.trim(),planName:document.getElementById('maintenancePlanName').value.trim(),frequency:document.getElementById('maintenanceFrequency').value,nextDue:document.getElementById('maintenanceNextDue').value,owner:document.getElementById('maintenanceOwner').value.trim(),status:'วางแผนแล้ว'};
  if(!p.machine||!p.planName||!p.nextDue){ if(typeof showToast==='function') showToast('กรุณากรอกเครื่องจักร ชื่องาน และกำหนดวัน','error'); return; }
  try { const saved=await saveMaintenancePlanToCloud(p); if(saved?.status!=='success') throw new Error(saved?.message||'บันทึกไม่สำเร็จ'); } catch(e){ if(typeof showToast==='function') showToast(e.message||'เชื่อมต่อฐานข้อมูลไม่สำเร็จ','error'); return; }
  const rows=maintenancePlans(); rows.unshift({...p,createdAt:new Date().toISOString()}); localStorage.setItem(MAINTENANCE_PLAN_KEY,JSON.stringify(rows)); event.target.reset(); renderMaintenancePlans();
}
const MAINTENANCE_PLAN_KEY = 'PAINTING_MAINTENANCE_PLANS';
function toggleMaintenanceMenu(event, link){ if(event) event.preventDefault(); const menu=document.getElementById('maintenance-submenu'); if(!menu) return; menu.hidden=!menu.hidden; if(link) link.setAttribute('aria-expanded', String(!menu.hidden)); }
function maintenanceEsc(value){ return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function maintenancePlans(){ try { const v=JSON.parse(localStorage.getItem(MAINTENANCE_PLAN_KEY)||'[]'); return Array.isArray(v)?v:[]; } catch(e){ return []; } }
function openMaintenancePlan(event, link){ if(event) event.preventDefault(); switchTab('maintenance-plan-tab', link); renderMaintenancePlans(); }
function maintenanceDateOnly(value){ return String(value||'').slice(0,10); }
function renderMaintenanceAlerts(){
  const box=document.getElementById('maintenanceAlertBox'); if(!box) return;
  const today=new Date(); today.setHours(0,0,0,0);
  const week=new Date(today); week.setDate(week.getDate()+7);
  const due=maintenancePlans().filter(p=>p.status!=='เสร็จแล้ว' && p.nextDue).map(p=>({...p,d:new Date(maintenanceDateOnly(p.nextDue)+'T00:00:00')})).filter(p=>p.d<=week).sort((a,b)=>a.d-b.d);
  if(!due.length){ box.innerHTML=''; box.hidden=true; return; }
  const overdue=due.filter(p=>p.d<today), todayDue=due.filter(p=>p.d.getTime()===today.getTime()), soon=due.filter(p=>p.d>today);
  const tone=overdue.length?'#ef4444':todayDue.length?'#f59e0b':'#eab308';
  const title=overdue.length?'มีงานบำรุงรักษาเลยกำหนด':todayDue.length?'มีงานบำรุงรักษาครบกำหนดวันนี้':'มีงานบำรุงรักษาใกล้ครบกำหนด';
  box.hidden=false; box.innerHTML='<div style="border:1px solid '+tone+';border-left:6px solid '+tone+';border-radius:12px;padding:1rem 1.2rem;background:rgba(15,23,42,.75);color:#f8fafc;"><strong style="color:'+tone+';">🔔 '+title+'</strong><div style="margin-top:.5rem;display:grid;gap:.25rem;">'+due.map(p=>'<div>• '+maintenanceEsc(p.machine)+' — '+maintenanceEsc(p.planName)+' <span style="color:'+tone+';">('+maintenanceEsc(p.nextDue)+')</span></div>').join('')+'</div></div>';
}
function checkMaintenanceAlerts(){ renderMaintenanceAlerts(); const due=maintenancePlans().filter(p=>p.status!=='เสร็จแล้ว' && p.nextDue && maintenanceDateOnly(p.nextDue)<=new Date().toISOString().slice(0,10)); if(due.length && typeof showToast==='function') showToast('มีงาน Maintenance Plan ถึงกำหนด '+due.length+' รายการ','warning'); }

function renderMaintenancePlans(){
  const plans=maintenancePlans(); renderMaintenanceAlerts(); const body=document.getElementById('maintenancePlanTableBody');
  const count=document.getElementById('maintenancePlanCount'); if(count) count.textContent=plans.length;
  if(!body) return;
  if(!plans.length){ body.innerHTML='<tr><td colspan=7 style="text-align:center;color:#94a3b8;padding:2rem;">ยังไม่มีแผนบำรุงรักษา</td></tr>'; return; }
  body.innerHTML=plans.map((p,i)=>'<tr><td>'+maintenanceEsc(p.machine)+'</td><td>'+maintenanceEsc(p.planName)+'</td><td>'+maintenanceEsc(p.frequency)+'</td><td>'+maintenanceEsc(p.nextDue)+'</td><td>'+maintenanceEsc(p.owner)+'</td><td><span class="maintenance-status '+(p.status==='เสร็จแล้ว'?'done':'planned')+'">'+maintenanceEsc(p.status)+'</span></td><td><button type=button class="spare-parts-btn secondary" onclick="completeMaintenancePlan('+i+')">เสร็จแล้ว</button></td></tr>').join('');
}
async function loadMaintenancePlansFromCloud(){
  try { const base=getApiUrl(); const url=base+(base.includes('?')?'&':'?')+'action=getMaintenancePlans&_request='+Date.now(); const result=await fetchAppsScriptJsonWithRetry(url,'โหลดแผนบำรุงรักษา',{attempts:2,timeoutMs:15000});
    if(Array.isArray(result?.plans)){ localStorage.setItem(MAINTENANCE_PLAN_KEY,JSON.stringify(result.plans)); renderMaintenancePlans(); }
  } catch(e){ console.warn('Maintenance cloud load failed',e); }
}
async function saveMaintenancePlanToCloud(plan){
  const base=getApiUrl(); const params=new URLSearchParams({action:'saveMaintenancePlan',planId:plan.planId||'',machine:plan.machine||'',planName:plan.planName||'',frequency:plan.frequency||'',nextDue:plan.nextDue||'',owner:plan.owner||'',status:plan.status||'วางแผนแล้ว'}).toString();
  return fetchAppsScriptJsonWithRetry(base+(base.includes('?')?'&':'?')+params+'&_request='+Date.now(),'บันทึกแผนบำรุงรักษา',{attempts:2,timeoutMs:15000});
}
async async function completeMaintenancePlan(index){ const rows=maintenancePlans(); if(!rows[index]) return; try { const result=await completeMaintenancePlanToCloud(rows[index].planId); if(result?.status!=='success') throw new Error(result?.message||'อัปเดตไม่สำเร็จ'); rows[index].status='เสร็จแล้ว'; rows[index].completedAt=new Date().toISOString(); localStorage.setItem(MAINTENANCE_PLAN_KEY,JSON.stringify(rows)); renderMaintenancePlans(); } catch(e){ if(typeof showToast==='function') showToast(e.message||'อัปเดตแผนไม่สำเร็จ','error'); } }
document.addEventListener('DOMContentLoaded',()=>{ setTimeout(()=>{ checkMaintenanceAlerts(); loadMaintenancePlansFromCloud(); },600); });
