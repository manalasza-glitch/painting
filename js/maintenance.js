const MAINTENANCE_PLAN_KEY = 'PAINTING_MAINTENANCE_PLANS';
function maintenanceEsc(value){ return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function maintenancePlans(){ try { const v=JSON.parse(localStorage.getItem(MAINTENANCE_PLAN_KEY)||'[]'); return Array.isArray(v)?v:[]; } catch(e){ return []; } }
function openMaintenancePlan(event, link){ if(event) event.preventDefault(); switchTab('maintenance-plan-tab', link); renderMaintenancePlans(); }
function renderMaintenancePlans(){
  const plans=maintenancePlans(); const body=document.getElementById('maintenancePlanTableBody');
  const count=document.getElementById('maintenancePlanCount'); if(count) count.textContent=plans.length;
  if(!body) return;
  if(!plans.length){ body.innerHTML='<tr><td colspan=7 style="text-align:center;color:#94a3b8;padding:2rem;">ยังไม่มีแผนบำรุงรักษา</td></tr>'; return; }
  body.innerHTML=plans.map((p,i)=>'<tr><td>'+maintenanceEsc(p.machine)+'</td><td>'+maintenanceEsc(p.planName)+'</td><td>'+maintenanceEsc(p.frequency)+'</td><td>'+maintenanceEsc(p.nextDue)+'</td><td>'+maintenanceEsc(p.owner)+'</td><td><span class="maintenance-status '+(p.status==='เสร็จแล้ว'?'done':'planned')+'">'+maintenanceEsc(p.status)+'</span></td><td><button type=button class="spare-parts-btn secondary" onclick="completeMaintenancePlan('+i+')">เสร็จแล้ว</button></td></tr>').join('');
}
function submitMaintenancePlan(event){
  if(event) event.preventDefault();
  const p={machine:document.getElementById('maintenanceMachine').value.trim(),planName:document.getElementById('maintenancePlanName').value.trim(),frequency:document.getElementById('maintenanceFrequency').value,nextDue:document.getElementById('maintenanceNextDue').value,owner:document.getElementById('maintenanceOwner').value.trim(),status:'วางแผนแล้ว'};
  if(!p.machine||!p.planName||!p.nextDue){ if(typeof showToast==='function') showToast('กรุณากรอกเครื่องจักร ชื่องาน และกำหนดวัน','error'); return; }
  const rows=maintenancePlans(); rows.unshift({...p,createdAt:new Date().toISOString()}); localStorage.setItem(MAINTENANCE_PLAN_KEY,JSON.stringify(rows)); event.target.reset(); renderMaintenancePlans();
}
function completeMaintenancePlan(index){ const rows=maintenancePlans(); if(rows[index]){ rows[index].status='เสร็จแล้ว'; rows[index].completedAt=new Date().toISOString(); localStorage.setItem(MAINTENANCE_PLAN_KEY,JSON.stringify(rows)); renderMaintenancePlans(); } }
document.addEventListener('DOMContentLoaded',()=>{ setTimeout(renderMaintenancePlans,300); });
