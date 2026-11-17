/* Calisthenics Atlas — private, browser-only training studio and skill maps. */
(() => {
  'use strict';
  const KEY = 'calisthenics-atlas-workspace-v1';
  const FORMAT = 'calisthenics-atlas-workspace';
  const STATUS = ['not-started', 'practicing', 'confident'];
  const LEVEL_INDEX = {Beginner: 0, Intermediate: 1, Advanced: 2};
  const MAX_ENTRIES = 1000;
  const paths = [
    {id:'push', title:'Push-up foundations', group:'Push', icon:'↗', description:'Gradually change leverage, support and pressing demand. A knee push-up is one option, not a required step.', steps:['wall-push-up','incline-push-up','knee-push-up','push-up','decline-push-up']},
    {id:'pull', title:'Pull-up foundations', group:'Pull', icon:'↥', description:'Develop shoulder control and pulling capacity. A suitably rated bar or station is essential for hanging movements.', steps:['active-hang','scapular-pull-up','inverted-row','assisted-pull-up','pull-up']},
    {id:'legs', title:'Single-leg strength', group:'Legs', icon:'⌁', description:'Build basic strength and balance before reducing support in single-leg work.', steps:['chair-squat','bodyweight-squat','split-squat','supported-single-leg-squat','pistol-squat']},
    {id:'core', title:'Trunk control and L-sit', group:'Core', icon:'◈', description:'Learn to control your trunk before experimenting with shorter and longer lever arms.', steps:['dead-bug','forearm-plank','hollow-body-hold','l-sit-tuck']},
    {id:'balance', title:'Handstand preparation', group:'Balance', icon:'◎', description:'Practice balance and comfortable arm loading before considering supported inversion.', steps:['single-leg-balance','pike-hold','wall-handstand-hold']}
  ];
  const equipmentRules = {
    'active-hang':'bar','scapular-pull-up':'bar','assisted-pull-up':'bar', 'negative-pull-up':'bar',
    'band-assisted-pull-up':'band', 'pull-up':'bar','chin-up':'bar','inverted-row':'bar',
    'ring-row':'rings','dip-support-hold':'parallel','assisted-dip':'parallel','dip':'parallel'
  };
  const holdSlugs = new Set(['active-hang','dip-support-hold','forearm-plank','side-plank','hollow-body-hold','l-sit-tuck','wall-handstand-hold','pike-hold','bear-crawl-hold','single-leg-balance']);
  const seed = {
    Push: {beginner:['wall-push-up','incline-push-up','knee-push-up','push-up'], intermediate:['push-up','pike-push-up','decline-push-up'], advanced:['push-up','pike-push-up','decline-push-up']},
    Pull: {beginner:['inverted-row','active-hang','scapular-pull-up'], intermediate:['inverted-row','assisted-pull-up','pull-up','chin-up'], advanced:['pull-up','chin-up','ring-row','inverted-row']},
    Legs: {beginner:['bodyweight-squat','reverse-lunge','glute-bridge','split-squat'], intermediate:['split-squat','step-up','single-leg-glute-bridge','supported-single-leg-squat'], advanced:['supported-single-leg-squat','split-squat','pistol-squat']},
    Core: {beginner:['dead-bug','bird-dog','forearm-plank'], intermediate:['forearm-plank','side-plank','hollow-body-hold','l-sit-tuck'], advanced:['side-plank','hollow-body-hold','l-sit-tuck']},
    Balance: {beginner:['single-leg-balance','pike-hold'], intermediate:['pike-hold','wall-handstand-hold'], advanced:['pike-hold','wall-handstand-hold']}
  };
  const defaults = () => ({version:1, profile:{goal:'general',level:'beginner',days:2,equipment:'floor'},plan:[],logs:[],skills:{}});
  let state = defaults();
  let storageEnabled = true;
  let activePath = 'push';
  let selectedStep = 'wall-push-up';
  const catalog = typeof exerciseAtlas !== 'undefined' ? exerciseAtlas : [];
  const catalogMap = new Map(catalog.map(x => [x.slug, x]));
  const esc = (s) => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byId = id => document.getElementById(id);
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(Number(x)) ? Math.round(Number(x)) : lo));
  const today = () => {const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;};
  const daysAgo = n => {const d=new Date();d.setDate(d.getDate()-n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const canUse = (slug, gear) => {const need=equipmentRules[slug];return !need || ((need==='bar' && ['bar','rings'].includes(gear)) || (need==='rings' && gear==='rings'));};
  const isHold = slug => holdSlugs.has(slug);
  const unit = slug => isHold(slug) ? 'seconds' : 'reps';
  function notify(msg, problem=false){const box=byId('workspace-notice');if(!box)return;box.textContent=msg;box.classList.toggle('warning',problem);}
  function showStorageWarning(){const box=byId('storage-warning');if(box)box.hidden=storageEnabled;}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));storageEnabled=true;}catch(e){storageEnabled=false;}showStorageWarning();}
  function load(){
    try {
      const testKey=KEY+'-test';localStorage.setItem(testKey,'ok');localStorage.removeItem(testKey);
      const raw=localStorage.getItem(KEY);if(raw){try{state=validate(JSON.parse(raw));}catch(e){state=defaults();notify('A previous local backup was not readable; a new plan was started.',true);}}
    }catch(e){storageEnabled=false;state=defaults();}
    showStorageWarning();
  }
  function validate(raw){
    if(!raw||typeof raw!=='object'||raw.version!==1)throw Error('Not a compatible Atlas workspace backup');
    const s=defaults(),p=raw.profile||{};
    s.profile.goal=['general','strength','skills'].includes(p.goal)?p.goal:'general';
    s.profile.level=['beginner','intermediate','advanced'].includes(p.level)?p.level:'beginner';
    s.profile.days=[2,3,4].includes(Number(p.days))?Number(p.days):2;
    s.profile.equipment=['floor','bar','rings'].includes(p.equipment)?p.equipment:'floor';
    if(Array.isArray(raw.plan))s.plan=raw.plan.slice(0,4).map((d,i)=>({id:i+1,title:`Day ${i+1}`,items:(Array.isArray(d.items)?d.items:[]).slice(0,8).filter(item=>item&&catalogMap.has(item.slug)&&canUse(item.slug,s.profile.equipment)).map(item=>({slug:item.slug,sets:clamp(item.sets,1,5),target:clamp(item.target,1,120)}))}));
    if(Array.isArray(raw.logs))s.logs=raw.logs.slice(-MAX_ENTRIES).filter(x=>x&&typeof x.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&Array.isArray(x.items)).map((x,i)=>({id:String(x.id||`import-${i}`).slice(0,70),date:x.date,session:clamp(x.session,1,4),note:String(x.note||'').slice(0,300),items:x.items.slice(0,12).filter(item=>item&&catalogMap.has(item.slug)).map(item=>({slug:item.slug,sets:clamp(item.sets,1,5),performed:clamp(item.performed,1,120),unit:unit(item.slug)}))})).filter(x=>x.items.length);
    if(raw.skills&&typeof raw.skills==='object')for(const path of paths)for(const slug of path.steps){if(STATUS.includes(raw.skills[slug]))s.skills[slug]=raw.skills[slug];}
    return s;
  }
  function profileFormSync(){if(!byId('profile-form'))return;byId('profile-goal').value=state.profile.goal;byId('profile-level').value=state.profile.level;byId('profile-days').value=String(state.profile.days);byId('profile-equipment').value=state.profile.equipment;}
  function choices(group){return catalog.filter(x=>x.category===group&&LEVEL_INDEX[x.level]<=LEVEL_INDEX[state.profile.level.charAt(0).toUpperCase()+state.profile.level.slice(1)]&&canUse(x.slug,state.profile.equipment));}
  function pick(group,day){
    const pool=seed[group]?.[state.profile.level]||[];
    const valid=pool.filter(slug=>catalogMap.has(slug)&&canUse(slug,state.profile.equipment));
    const alternate=choices(group).map(x=>x.slug);
    const candidates=valid.length?valid:alternate;
    if(!candidates.length)return null;
    return candidates[day % candidates.length];
  }
  function generatePlan(){
    const p=state.profile,days=p.days;
    state.plan=Array.from({length:days},(_,day)=>{
      const patterns=p.goal==='skills' ? ['Push','Pull','Legs','Core','Balance'] : ['Push','Pull','Legs','Core'];
      const items=patterns.map(group=>pick(group,day)).filter(Boolean).map(slug=>({slug,sets:p.goal==='strength'?(p.level==='beginner'?2:3):(p.level==='beginner'?1:2),target:isHold(slug)?(p.goal==='strength'?20:15):(p.goal==='strength'?6:8)}));
      return {id:day+1,title:`Day ${day+1}`,items};
    });
    persist();
  }
  function renderMetrics(){
    const recent=daysAgo(6),skills=Object.values(state.skills).filter(x=>x==='confident').length;
    const metrics={'metric-sessions':state.logs.length,'metric-week':state.logs.filter(x=>x.date>=recent&&x.date<=today()).length,'metric-sets':state.logs.reduce((n,l)=>n+l.items.reduce((v,i)=>v+i.sets,0),0),'metric-skills':skills};
    for(const [id,v] of Object.entries(metrics))if(byId(id))byId(id).textContent=v;
    renderActivity();
  }
  function renderActivity(){
    const area=byId('activity-chart');if(!area)return;
    const current=new Date();current.setHours(12,0,0,0);
    const monday=new Date(current);monday.setDate(current.getDate()-((current.getDay()+6)%7));
    const weeks=Array.from({length:8},(_,i)=>{
      const from=new Date(monday);from.setDate(monday.getDate()-(7-i)*7);
      const to=new Date(from);to.setDate(from.getDate()+6);
      const key=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const start=key(from),end=key(to);
      return {label:`${from.getMonth()+1}/${from.getDate()}`,start,end,count:state.logs.filter(x=>x.date>=start&&x.date<=end).length};
    });
    const max=Math.max(1,...weeks.map(x=>x.count));
    area.setAttribute('aria-label','Sessions by week: '+weeks.map(x=>`${x.label}: ${x.count}`).join('; '));
    area.innerHTML='<div class="activity-bars">'+weeks.map(w=>`<div class="activity-column"><span class="activity-number">${w.count}</span><div class="activity-rail"><span style="height:${Math.max(w.count?6:0,100*w.count/max)}%"></span></div><span class="activity-label">${w.label}</span></div>`).join('')+'</div><p class="muted">Week labels show the Monday starting date (month/day). Counts reflect entries in your local journal.</p>';
  }
  function renderPlan(){
    const area=byId('plan-container');if(!area)return;
    const noPull=state.profile.equipment==='floor';
    const note=byId('plan-note');if(note)note.innerHTML=noPull
      ? '<strong>Pulling gap:</strong> A floor-only setup cannot safely replace hanging or rowing with improvised furniture. The plan covers other movement patterns; add pulling at a gym or with properly rated equipment when available.'
      : '<strong>Adaptable example:</strong> Choose repetitions and rest based on technique and recovery. Use only properly installed and rated pulling equipment. For similar hard muscle work, allow recovery between sessions.';
    if(!state.plan.length){area.innerHTML='<div class="studio-card">Choose your training preferences and generate a plan above.</div>';return;}
    area.innerHTML=state.plan.map((day,dayIndex)=>`<article class="studio-card session-card"><div class="session-heading"><span class="day-count">${String(dayIndex+1).padStart(2,'0')}</span><div><span class="tag">Weekly session</span><h3>${esc(day.title)}</h3></div><span class="session-count">${day.items.length} movements</span></div>
    <div class="planned-exercises">${day.items.map((item,itemIndex)=>{
       const x=catalogMap.get(item.slug);if(!x)return '';
       const options=choices(x.category).map(opt=>`<option value="${esc(opt.slug)}" ${opt.slug===item.slug?'selected':''}>${esc(opt.name)}</option>`).join('');
       return `<div class="planned-exercise"><img src="assets/exercise-diagrams/${esc(item.slug)}.svg" alt="" loading="lazy"><div class="planned-fields"><label>Exercise <span class="mini-tag">${esc(x.category)}</span><select data-day="${dayIndex}" data-item="${itemIndex}" data-field="slug" aria-label="Day ${dayIndex+1} exercise ${itemIndex+1}">${options}</select></label><a href="exercises/${esc(item.slug)}.html" class="tiny-link">See technique →</a></div><div class="planned-number"><label>Sets<input type="number" min="1" max="5" step="1" value="${item.sets}" data-day="${dayIndex}" data-item="${itemIndex}" data-field="sets"></label><label><span class="unit-label">${isHold(item.slug)?'Sec. / hold':'Reps / set'}</span><input type="number" min="1" max="120" step="1" value="${item.target}" data-day="${dayIndex}" data-item="${itemIndex}" data-field="target"></label></div></div>`;
    }).join('')}</div></article>`).join('');
  }
  function renderLogSelect(){const sel=byId('log-session');if(!sel)return;const old=sel.value;sel.innerHTML=state.plan.map((d,i)=>`<option value="${i}">${esc(d.title)} — ${d.items.length} movements</option>`).join('');if(state.plan[Number(old)])sel.value=old;renderLogFields();}
  function renderLogFields(){
    const area=byId('log-exercises'),sel=byId('log-session');if(!area||!sel)return;
    const day=state.plan[Number(sel.value)];if(!day){area.innerHTML='<p>Generate your weekly plan to start logging.</p>';return;}
    area.innerHTML=day.items.map((x,i)=>{const ex=catalogMap.get(x.slug);if(!ex)return '';
     return `<div class="log-item"><div><strong>${esc(ex.name)}</strong><span class="muted">${esc(ex.category)} · planned ${x.sets} × ${x.target} ${unit(x.slug)}</span></div><label>Sets done<input type="number" min="0" max="5" step="1" value="${x.sets}" data-log-item="${i}" data-log-field="sets" aria-label="${esc(ex.name)} sets completed"></label><label>${isHold(x.slug)?'Seconds / hold':'Reps / set'}<input type="number" min="0" max="120" step="1" value="${x.target}" data-log-item="${i}" data-log-field="performed" aria-label="${esc(ex.name)} ${unit(x.slug)} completed per set"></label></div>`;
    }).join('');
  }
  function renderJournal(){const area=byId('journal-list');if(!area)return;
    if(!state.logs.length){area.innerHTML='<div class="studio-card empty-state"><span>◌</span><h3>No sessions recorded yet</h3><p>Your session journal will appear here after you save a completed workout.</p></div>';return;}
    area.innerHTML=[...state.logs].reverse().slice(0,20).map(log=>`<article class="journal-entry"><div class="journal-head"><div><span class="tag">${esc(log.date)}</span><h3>Session ${clamp(log.session,1,4)}</h3></div><button class="text-button" type="button" data-delete-log="${esc(log.id)}" aria-label="Delete logged session ${esc(log.date)}">Delete</button></div><p>${log.items.map(item=>`${esc(catalogMap.get(item.slug)?.name||item.slug)}: ${item.sets} × ${item.performed} ${esc(item.unit)}`).join(' · ')}</p>${log.note?`<p class="journal-note">${esc(log.note)}</p>`:''}</article>`).join('');
  }
  function handlePlanChange(e){const field=e.target.dataset.field;if(!field)return;const day=state.plan[Number(e.target.dataset.day)];const item=day?.items[Number(e.target.dataset.item)];if(!item)return;
    if(field==='slug'){
      const next=catalogMap.get(e.target.value),current=catalogMap.get(item.slug);
      if(!next||!current||next.category!==current.category||!choices(current.category).some(x=>x.slug===next.slug)){notify('That exercise is not available with the selected level or equipment.',true);renderPlan();return;}
      item.slug=next.slug;item.target=isHold(next.slug)?15:8;
    }else if(field==='sets')item.sets=clamp(e.target.value,1,5);else if(field==='target')item.target=clamp(e.target.value,1,120);
    persist();renderPlan();renderLogSelect();notify('Weekly plan updated on this device.');
  }
  function saveLog(e){e.preventDefault();const dayIndex=Number(byId('log-session').value),day=state.plan[dayIndex];if(!day)return;
    const date=byId('log-date').value;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today()){notify('Choose a valid session date that is not in the future.',true);return;}
    const rows=[...byId('log-exercises').querySelectorAll('.log-item')];const items=[];
    rows.forEach((row,i)=>{const rowItems=row.querySelectorAll('input[type="number"]');const n=clamp(rowItems[0]?.value||0,0,5),done=clamp(rowItems[1]?.value||0,0,120);if(n>0&&done>0)items.push({slug:day.items[i].slug,sets:n,performed:done,unit:unit(day.items[i].slug)});});
    if(!items.length){notify('Record at least one exercise with nonzero sets and repetitions or seconds.',true);return;}
    const id=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2);
    state.logs.push({id,date,session:dayIndex+1,note:byId('log-notes').value.slice(0,300),items});state.logs=state.logs.slice(-MAX_ENTRIES);
    persist();renderMetrics();renderJournal();renderLogFields();byId('log-notes').value='';notify('Session saved to your local training journal.');
  }
  function exportData(){
    const data=JSON.stringify({format:FORMAT,exportedAt:new Date().toISOString(),...state},null,2);
    const blob=new Blob([data],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`calisthenics-atlas-backup-${today()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);notify('JSON backup exported. Store it somewhere private.');
  }
  async function importData(e){const f=e.target.files?.[0];if(!f)return;
    if(f.size>1024*1024){notify('Import file is too large. Maximum 1 MB.',true);e.target.value='';return;}
    try{const json=JSON.parse(await f.text());if(json.format!==FORMAT)throw Error('This is not a Calisthenics Atlas backup');const checked=validate(json);if(!confirm('Replace the current plan, journal, and skill statuses with the imported backup?'))return;state=checked;if(!state.plan.length)generatePlan();persist();profileFormSync();renderAll();notify('Training data restored successfully from the selected file.');}
    catch(err){notify('Import failed: '+err.message,true);}finally{e.target.value='';}
  }
  function renderAll(){renderMetrics();renderPlan();renderLogSelect();renderJournal();renderTree();}
  function initTraining(){
    if(!byId('profile-form'))return;
    profileFormSync();byId('log-date').value=today();
    byId('profile-form').addEventListener('submit',e=>{e.preventDefault();state.profile={goal:byId('profile-goal').value,level:byId('profile-level').value,days:Number(byId('profile-days').value),equipment:byId('profile-equipment').value};generatePlan();renderAll();notify('A new training plan has been generated. Previous session records are preserved.');});
    byId('plan-container').addEventListener('change',handlePlanChange);
    byId('log-session').addEventListener('change',renderLogFields);
    byId('log-form').addEventListener('submit',saveLog);
    byId('journal-list').addEventListener('click',e=>{const btn=e.target.closest('[data-delete-log]');if(!btn)return;if(!confirm('Delete this session entry? This cannot be undone unless you have a backup.'))return;state.logs=state.logs.filter(x=>x.id!==btn.dataset.deleteLog);persist();renderMetrics();renderJournal();notify('Session entry deleted.');});
    byId('export-data').addEventListener('click',exportData);
    byId('import-data').addEventListener('change',importData);
    byId('reset-data').addEventListener('click',()=>{if(!confirm('Erase ALL locally stored plans, sessions, and skill progress? This cannot be undone without a backup.'))return;state=defaults();generatePlan();persist();profileFormSync();byId('log-date').value=today();renderAll();notify('Local workspace reset.');});
    renderMetrics();renderPlan();renderLogSelect();renderJournal();
  }
  function renderTree(){
    const picker=byId('tree-picker');if(!picker)return;
    const p=paths.find(x=>x.id===activePath)||paths[0];if(!p.steps.includes(selectedStep))selectedStep=p.steps[0];
    picker.innerHTML=paths.map(x=>`<button type="button" class="tree-tab ${x.id===activePath?'active':''}" data-path="${x.id}" aria-pressed="${x.id===activePath}"><span>${x.icon}</span>${esc(x.group)}</button>`).join('');
    byId('tree-category').textContent=p.group+' / '+p.steps.length+' steps';byId('tree-title').textContent=p.title;byId('tree-description').textContent=p.description;
    const total=paths.reduce((n,x)=>n+x.steps.length,0),confident=Object.values(state.skills).filter(v=>v==='confident').length,practicing=Object.values(state.skills).filter(v=>v==='practicing').length,pc=p.steps.filter(slug=>state.skills[slug]==='confident').length;
    byId('tree-practicing').textContent=practicing;byId('tree-confident').textContent=confident;byId('tree-total').textContent=total;byId('tree-percent').textContent=Math.round(pc/p.steps.length*100)+'%';
    byId('tree-track').innerHTML=p.steps.map((slug,i)=>{
      const x=catalogMap.get(slug),status=state.skills[slug]||'not-started';if(!x)return '';
      return `<button class="skill-node ${status} ${slug===selectedStep?'selected':''}" type="button" data-step="${slug}" aria-pressed="${slug===selectedStep}"><span class="node-number">${String(i+1).padStart(2,'0')}</span><img src="assets/exercise-diagrams/${slug}.svg" loading="lazy" alt=""><strong>${esc(x.name)}</strong><small>${status==='not-started'?'Not started':status==='confident'?'Confident':'Practicing'}</small></button>`;
    }).join('');
    renderStepDetail();
  }
  function renderStepDetail(){const box=byId('tree-detail');if(!box)return;const x=catalogMap.get(selectedStep);if(!x)return;
    const status=state.skills[x.slug]||'not-started';const p=paths.find(x=>x.id===activePath),stepIndex=p.steps.indexOf(x.slug),previous=stepIndex>0?catalogMap.get(p.steps[stepIndex-1]):null,next=stepIndex<p.steps.length-1?catalogMap.get(p.steps[stepIndex+1]):null;
    box.innerHTML=`<div class="tree-detail-media"><img src="assets/exercise-diagrams/${esc(x.slug)}.svg" alt="Conceptual movement diagram for ${esc(x.name)}"><div class="tag">${esc(x.level)} · ${esc(x.category)}</div></div><div class="tree-detail-copy"><h3>${esc(x.name)}</h3><p>${esc(x.cue)}</p><p><strong>Main muscle regions:</strong> ${esc(x.primary)}.</p><div class="status-selector" role="group" aria-label="My practice status for ${esc(x.name)}">${STATUS.map(v=>`<button class="status-btn ${status===v?'selected':''}" type="button" data-status="${v}" aria-pressed="${status===v}">${v==='not-started'?'Not started':v==='practicing'?'Practicing':'Confident'}</button>`).join('')}</div><div class="step-links">${previous?`<span>Previous: ${esc(previous.name)}</span>`:''}${next?`<span>Explore next: ${esc(next.name)}</span>`:''}</div><a class="btn" href="exercises/${esc(x.slug)}.html">Open the complete exercise guide →</a></div>`;
  }
  function initTree(){if(!byId('tree-picker'))return;
    byId('tree-picker').addEventListener('click',e=>{const b=e.target.closest('[data-path]');if(!b)return;activePath=b.dataset.path;selectedStep=paths.find(x=>x.id===activePath).steps[0];renderTree();});
    byId('tree-track').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(!b)return;selectedStep=b.dataset.step;renderTree();});
    byId('tree-detail').addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(!b)return;const next=b.dataset.status;if(!STATUS.includes(next))return;if(next==='not-started')delete state.skills[selectedStep];else state.skills[selectedStep]=next;persist();renderTree();notify('Skill status updated locally. This is your self-assessment, not a verified test.');});
    renderTree();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    if(!byId('profile-form')&&!byId('tree-picker'))return;
    load();if(!state.plan.length)generatePlan();initTraining();initTree();
  });
})();
