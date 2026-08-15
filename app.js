const DB_KEY='lotto_demo_v9_db';
const SESSION_KEY='lotto_demo_v9_session';
const GAME={
  bao_lo:{title:'Bao Lô',quickProfile:'bao',subs:[
    {id:'lo2',label:'Lô 2 Số',digits:2,odds:'1 : 99.9',unitStake:27000},
    {id:'lo2dau',label:'Lô 2 Số Đầu',digits:2,odds:'1 : 95',unitStake:23000},
    {id:'lo2_1k',label:'Lô 2 Số 1K',digits:2,odds:'1 : 90',unitStake:1000},
    {id:'lo3',label:'Lô 3 Số',digits:3,odds:'1 : 900',unitStake:23000},
    {id:'lo4',label:'Lô 4 Số',digits:4,odds:'1 : 9000',unitStake:20000}
  ]},
  lo_xien:{title:'Lô Xiên',quickProfile:'xien',subs:[
    {id:'xien2',label:'Xiên 2',pick:2,odds:'1 : 16',ticketStake:1000},
    {id:'xien3',label:'Xiên 3',pick:3,odds:'1 : 45',ticketStake:1000},
    {id:'xien4',label:'Xiên 4',pick:4,odds:'1 : 120',ticketStake:1000}
  ]},
  danh_de:{title:'Đánh Đề',quickProfile:'de',subs:[
    {id:'de_db',label:'Đề đặc biệt',digits:2,odds:'1 : 99.5',unitStake:1000},
    {id:'de_dau_db',label:'Đề đầu đặc biệt',digits:2,odds:'1 : 99.5',unitStake:1000},
    {id:'de_giai7',label:'Đề Giải 7',digits:2,odds:'1 : 99.5',unitStake:4000},
    {id:'de_giai1',label:'Đề Giải Nhất',digits:2,odds:'1 : 99.5',unitStake:1000},
    {id:'de_dau_giai1',label:'Đề đầu giải nhất',digits:2,odds:'1 : 99.5',unitStake:1000}
  ]},
  dau_duoi:{title:'Đầu Đuôi',quickProfile:null,subs:[
    {id:'dau',label:'Đầu',digits:1,odds:'1 : 9',unitStake:1000},
    {id:'duoi',label:'Đuôi',digits:1,odds:'1 : 9',unitStake:1000}
  ]},
  ba_cang:{title:'3 Càng',quickProfile:'3cang',subs:[
    {id:'3c_db',label:'3 Càng Đặc Biệt',digits:3,odds:'1 : 980',unitStake:1000},
    {id:'3c_giai1',label:'3 Càng Giải Nhất',digits:3,odds:'1 : 980',unitStake:1000},
    {id:'3c_dau_duoi',label:'3 Càng Đầu Đuôi',digits:3,odds:'1 : 980',unitStake:4000},
    {id:'3c_dau',label:'3 Càng Đầu',digits:3,odds:'1 : 980',unitStake:3000}
  ]},
  bon_cang:{title:'4 Càng',quickProfile:null,subs:[
    {id:'4cang',label:'4 Càng',digits:4,odds:'1 : 5500',unitStake:1000}
  ]}
};
const DIGIT_LABELS={1:['Đơn Vị'],2:['Chục','Đơn Vị'],3:['Trăm','Chục','Đơn Vị'],4:['Nghìn','Trăm','Chục','Đơn Vị']};
const state={game:'bao_lo',sub:0,mode:'digits',rows:[[],[]],numbers:[],quickPage:0,drafts:[],historyFilter:'all',lastResult:null};

function el(id){return document.getElementById(id)}
function fmt(n){return Number(n||0).toLocaleString('vi-VN')}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function toast(msg,error=false){const t=el('toast');t.textContent=msg;t.classList.toggle('error',error);t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2200)}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}
function blankDb(){return{users:{},bets:[]}}
function getDb(){try{return JSON.parse(localStorage.getItem(DB_KEY))||blankDb()}catch{return blankDb()}}
function saveDb(db){localStorage.setItem(DB_KEY,JSON.stringify(db))}
function username(){return localStorage.getItem(SESSION_KEY)}
function user(){const u=username();return u?getDb().users[u]||null:null}
function cfg(){return GAME[state.game].subs[state.sub]}
function multiplier(){return Math.max(1,Math.floor(Number(el('multiplier').value)||1))}
function localDateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function displayDate(key){const [y,m,d]=key.split('-');return `${d}/${m}/${y}`}
function nextDrawDate(){const n=new Date();const cutoff=new Date(n);cutoff.setHours(18,15,0,0);if(n>=cutoff)n.setDate(n.getDate()+1);return localDateKey(n)}

function openAuth(which='login'){el('authModal').classList.remove('hidden');el('loginPane').classList.toggle('hidden',which!=='login');el('registerPane').classList.toggle('hidden',which!=='register')}
function closeAuth(){el('authModal').classList.add('hidden')}
function requireLogin(){if(user())return true;openAuth('login');toast('Hãy đăng nhập hoặc đăng ký tài khoản demo trước.',true);return false}

function renderAccount(){const u=user();const d=el('desktopAuth');if(u){d.innerHTML=`<div class="desktop-user"><div><strong>${esc(u.username)}</strong><em>${fmt(u.balance)} điểm</em></div><button id="desktopLogout">Đăng xuất</button></div>`;el('desktopLogout').onclick=logout}else{d.innerHTML=`<input id="headerUser" autocomplete="username" placeholder="Tên đăng nhập"><input id="headerPass" autocomplete="current-password" type="password" placeholder="mật khẩu"><span class="captcha-demo">3666</span><input class="captcha-field" placeholder="Mã xác nhận"><button id="headerLogin" class="btn-login">đăng nhập</button><button id="headerRegister" class="btn-register">đăng ký</button><button id="headerTry" class="btn-try">Chơi thử</button><button id="headerForgot" class="btn-forgot">Quên mật khẩu?</button>`;bindDesktopAuth()}
  el('drawerBalance').textContent=`${fmt(u?u.balance:0)} VND`;el('mBalance').textContent=fmt(u?u.balance:0);const a=el('drawerAuth');if(u){a.innerHTML=`<button id="drawerLogout" style="background:#2298e9;min-width:145px">Đăng xuất ${esc(u.username)}</button>`;el('drawerLogout').onclick=logout}else{a.innerHTML='<button id="drawerLogin">Đăng nhập</button><button id="drawerRegister">Đăng ký</button>';el('drawerLogin').onclick=()=>{closeDrawer();openAuth('login')};el('drawerRegister').onclick=()=>{closeDrawer();openAuth('register')}};renderDrawerCounts()}
function logout(){localStorage.removeItem(SESSION_KEY);renderAll();closeDrawer();toast('Đã đăng xuất.')}
function bindDesktopAuth(){el('headerLogin')?.addEventListener('click',loginFromHeader);el('headerRegister')?.addEventListener('click',()=>openAuth('register'));el('headerTry')?.addEventListener('click',()=>openAuth('register'));el('headerForgot')?.addEventListener('click',()=>toast('Bản demo không gửi email khôi phục.',true))}
function loginFromHeader(){const name=el('headerUser').value.trim().toLowerCase(),pass=el('headerPass').value;doLogin(name,pass)}
function doLogin(name,pass){const db=getDb(),u=db.users[name];if(!u||u.passwordHash!==hash(pass))return toast('Sai tài khoản hoặc mật khẩu.',true);localStorage.setItem(SESSION_KEY,name);closeAuth();renderAll();toast('Đăng nhập thành công.')}
function doRegister(name,pass){name=name.trim().toLowerCase();if(!/^[a-z0-9_]{3,20}$/i.test(name)||pass.length<4)return toast('Tên đăng nhập >=3 ký tự, mật khẩu >=4 ký tự.',true);const db=getDb();if(db.users[name])return toast('Tài khoản đã tồn tại trên thiết bị này.',true);db.users[name]={username:name,passwordHash:hash(pass),balance:100000,createdAt:new Date().toISOString()};saveDb(db);localStorage.setItem(SESSION_KEY,name);closeAuth();renderAll();toast('Đã tạo tài khoản với 100.000 điểm demo.')}


function oddsRatio(value=cfg().odds){
  const m=String(value||'').match(/:\s*([\d.]+)/);
  return m ? Number(m[1]) : 1;
}
function unitStake(){
  return Number(cfg().unitStake || cfg().ticketStake || 1000);
}
function defaultModeForGame(game=state.game){
  if(game==='lo_xien')return 'quick';
  return 'digits';
}
function modeAllowed(mode,game=state.game){
  if(game==='lo_xien')return mode==='manual'||mode==='quick';
  if(game==='dau_duoi'||game==='bon_cang')return mode==='digits'||mode==='manual';
  return ['digits','manual','quick'].includes(mode);
}
function normalizeMode(){
  if(!modeAllowed(state.mode))state.mode=defaultModeForGame();
}
function selectionCost(nums=selected()){
  const m=multiplier();
  if(state.game==='lo_xien'){
    return nums.length===cfg().pick ? Number(cfg().ticketStake||1000)*m : 0;
  }
  return nums.length*unitStake()*m;
}
function quickWidth(){
  return Number(cfg().digits||2);
}
function quickPageCount(){
  const width=quickWidth();
  if(width<=2)return 1;
  return Math.pow(10,width)/100;
}
function quickRangeValues(){
  const width=quickWidth();
  const pages=quickPageCount();
  state.quickPage=Math.max(0,Math.min(state.quickPage,pages-1));
  const start=state.quickPage*100;
  const max=Math.pow(10,width);
  const end=Math.min(start+100,max);
  return Array.from({length:end-start},(_,i)=>String(start+i).padStart(width,'0'));
}
function quickRangeLabel(){
  const values=quickRangeValues();
  if(!values.length)return '';
  return `${values[0]} - ${values[values.length-1]}`;
}
function frequencyBadge(value,profile=GAME[state.game].quickProfile){
  const width=state.game==='lo_xien' ? 2 : quickWidth();
  const n=Number(value);
  const d=new Date();

  // Đây là thống kê DEMO ổn định theo ngày, không phải số liệu Minh Ngọc.
  // Giới hạn được giảm theo độ hiếm của từng loại số:
  // 2 số: 0-20, 3 số: 0-8, 4 số: 0-3.
  let max=20;
  if(width===1)max=9;
  if(width===3)max=8;
  if(width>=4)max=3;

  const seed=Math.abs(
    n*37 +
    d.getDate()*11 +
    (d.getMonth()+1)*17 +
    d.getFullYear()*3 +
    width*29 +
    (profile==='xien'?41:profile==='de'?23:profile==='3cang'?13:7)
  );

  // Cho một tỷ lệ số có thống kê 0 giống giao diện gốc.
  if(seed%9===0 || seed%17===0)return 0;

  return 1 + ((seed*7 + Math.floor(n/3)) % max);
}
function randomSample(values,count){
  const arr=[...values];
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr.slice(0,Math.min(count,arr.length));
}

function rowLabels(){if(state.game==='lo_xien')return[];return DIGIT_LABELS[cfg().digits]||['Đơn Vị']}
function resetSelections(){
  state.rows=rowLabels().map(()=>[]);
  state.numbers=[];
  state.quickPage=0;
  renderSelection();
  updateSummary();
}
function cartesian(rows){if(!rows.length||rows.some(r=>!r.length))return[];let out=[''];for(const row of rows){const n=[];for(const prefix of out)for(const d of row)n.push(prefix+d);out=n}return out}
function manualNumbers(){
  const ta=el('manualInput');
  if(!ta)return[];

  const width=state.game==='lo_xien' ? 2 : (cfg().digits||2);

  return [...new Set(
    ta.value
      .split(/[\s,;]+/)
      .map(x=>x.trim())
      .filter(x=>new RegExp(`^\\d{${width}}$`).test(x))
  )];
}
function selected(){
  if(state.mode==='manual')return manualNumbers();
  if(state.game==='lo_xien')return state.numbers.slice();
  if(state.mode==='quick'&&state.numbers.length)return state.numbers.slice();
  return cartesian(state.rows);
}
function toggleDigit(row,d){const arr=state.rows[row]||[];state.rows[row]=arr.includes(d)?arr.filter(x=>x!==d):[...arr,d].sort((a,b)=>a-b);renderSelection();updateSummary()}
function quickRow(row,type){const map={all:[0,1,2,3,4,5,6,7,8,9],tai:[5,6,7,8,9],xiu:[0,1,2,3,4],odd:[1,3,5,7,9],even:[0,2,4,6,8],clear:[]};state.rows[row]=map[type].slice();renderSelection();updateSummary()}
function toggleNumber(n){const limit=state.game==='lo_xien'?cfg().pick:100;if(state.numbers.includes(n))state.numbers=state.numbers.filter(x=>x!==n);else{if(state.game==='lo_xien'&&state.numbers.length>=limit)return toast(`Chỉ chọn ${limit} số cho ${cfg().label}.`,true);state.numbers.push(n)}renderSelection();updateSummary()}
function deterministicBadge(n){const d=new Date();return(n*17+d.getDate()*3+(d.getMonth()+1)*11)%16}
function renderSubTabs(){
  el('subTabs').innerHTML=GAME[state.game].subs.map((s,i)=>
    `<button data-sub="${i}" class="${i===state.sub?'active':''}">${s.label}</button>`
  ).join('');

  el('subTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{
    state.sub=Number(b.dataset.sub);
    normalizeMode();
    state.rows=rowLabels().map(()=>[]);
    state.numbers=[];
    state.quickPage=0;
    renderSubTabs();
    renderMeta();
    renderSelection();
    updateSummary();
  });
}
function syncModes(){
  const box=el('modeTabs');
  const digits=box.querySelector('[data-mode="digits"]');
  const manual=box.querySelector('[data-mode="manual"]');
  const quick=box.querySelector('[data-mode="quick"]');

  normalizeMode();

  digits.style.display=state.game==='lo_xien'?'none':'';
  quick.style.display=(state.game==='dau_duoi'||state.game==='bon_cang')?'none':'';

  const visible=[digits,manual,quick].filter(b=>b.style.display!=='none');
  box.classList.toggle('two',visible.length===2);

  if(['bao_lo','lo_xien','danh_de','ba_cang'].includes(state.game)){
    el('modeHint').innerHTML='<span class="help-dot">?</span> Hướng dẫn';
  }else{
    el('modeHint').textContent='';
  }

  [digits,manual,quick].forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
}
function renderMeta(){const c=cfg();el('desktopGameName').textContent=c.label;el('mobileGameName').textContent=c.label;el('oddsText').textContent=c.odds;el('selectionArea').dataset.mobileOdds=`Tỉ lệ cược ${c.odds}  ⓘ`;syncModes();renderMobileGameMenu()}

function quickProfileConfig(){
  if(state.game==='bao_lo'){
    return {random:[1,2,3,5,10],special:['same'],top:[1,2,5,10,20]};
  }
  if(state.game==='danh_de'){
    return {random:[10,20,30,40,50],special:['same','even','odd','tai','xiu'],top:[1,2,5,10,20]};
  }
  if(state.game==='ba_cang'){
    return {random:[10,20,30,40,50],special:['same'],top:[]};
  }
  return {random:[],special:[],top:[]};
}
function specialLabel(key){
  return {same:'Cùng số',even:'Chẵn',odd:'Lẻ',tai:'Tài',xiu:'Xỉu'}[key]||key;
}
function smartQuickHtml(){
  const profile=quickProfileConfig();
  const values=quickRangeValues();
  const selectedSet=new Set(state.numbers);

  const randomButtons=profile.random.map(n=>`<button data-smart="random:${n}">${n} số</button>`).join('');
  const specialButtons=profile.special.map(k=>`<button data-smart="${k}">${specialLabel(k)}</button>`).join('');
  const topButtons=profile.top.map(n=>`<button data-smart="top:${n}">Top ${n}</button>`).join('');

  const grid=values.map(v=>{
    const badge=frequencyBadge(v);
    const red=badge<=1?' red':'';
    return `<button class="smart-number ${selectedSet.has(v)?'active':''}" data-number="${v}">
      <span>${v}</span><i class="smart-stat${red}">${badge}</i>
    </button>`;
  }).join('');

  return `<div class="smart-quick-layout">
    <aside class="smart-quick-side">
      <button class="smart-range" data-smart="next-range">${quickRangeLabel()}<i>${state.numbers.length}</i></button>

      ${randomButtons?`<section><p>Ngẫu Nhiên</p><div>${randomButtons}</div></section>`:''}
      ${specialButtons?`<section><p>Đặc biệt</p><div>${specialButtons}</div></section>`:''}
      ${topButtons?`<section><p>Ít Xuất Hiện</p><div>${topButtons}</div></section>`:''}
    </aside>

    <div class="smart-grid-panel">
      <div class="smart-grid">${grid}</div>
    </div>
  </div>`;
}
function smartPick(action){
  const values=quickRangeValues();

  if(action==='next-range'){
    if(quickPageCount()>1){
      state.quickPage=(state.quickPage+1)%quickPageCount();
      state.numbers=[];
    }
  }else if(action.startsWith('random:')){
    state.numbers=randomSample(values,Number(action.split(':')[1]));
  }else if(action==='same'){
    state.numbers=values.filter(v=>new Set(v.split('')).size===1);
  }else if(action==='even'){
    state.numbers=values.filter(v=>Number(v)%2===0);
  }else if(action==='odd'){
    state.numbers=values.filter(v=>Number(v)%2===1);
  }else if(action==='tai'){
    state.numbers=values.filter(v=>Number(v)>=Math.pow(10,quickWidth())/2);
    if(!state.numbers.length)state.numbers=values.filter((_,i)=>i>=50);
  }else if(action==='xiu'){
    state.numbers=values.filter(v=>Number(v)<Math.pow(10,quickWidth())/2);
    if(state.numbers.length===values.length&&values.length===100)state.numbers=values.slice(0,50);
  }else if(action.startsWith('top:')){
    const n=Number(action.split(':')[1]);
    state.numbers=[...values].sort((a,b)=>frequencyBadge(a)-frequencyBadge(b)).slice(0,n);
  }

  renderSelection();
  updateSummary();
}

function digitRowsHtml(){return rowLabels().map((label,r)=>`<div class="digit-row"><div class="row-label">${label}</div><div class="digit-list">${Array.from({length:10},(_,d)=>`<button class="digit-btn ${state.rows[r]?.includes(d)?'active':''}" data-digit="${d}" data-row="${r}">${d}</button>`).join('')}</div><div class="quick-actions">${[['all','Toàn bộ'],['tai','Tài'],['xiu','Xỉu'],['odd','Lẻ'],['even','Chẵn'],['clear','Xóa']].map(x=>`<button data-q="${x[0]}" data-row="${r}">${x[1]}</button>`).join('')}</div></div>`).join('')}
function numberGridHtml(className=''){return`<div class="number-grid-wrap ${className}"><div class="number-grid">${Array.from({length:100},(_,i)=>{const n=String(i).padStart(2,'0');return`<button data-number="${n}" class="${state.numbers.includes(n)?'active':''}">${n}</button>`}).join('')}</div>${state.game==='lo_xien'?`<div class="selection-note">Chọn đúng ${cfg().pick} số cho ${cfg().label}.</div>`:''}</div>`}
function loXienHtml(){
  const full=state.numbers.length>=cfg().pick;
  return `<div class="loxien-layout">
    <aside class="loxien-side">
      <button class="loxien-range" data-lx="clear">00 - 99<i>${state.numbers.length}</i></button>
      <p>Ngẫu Nhiên</p>
      <button class="loxien-random" data-lx="random">1 số</button>
    </aside>
    <div class="loxien-grid-panel">
      <div class="loxien-grid">${
        Array.from({length:100},(_,i)=>{
          const n=String(i).padStart(2,'0');
          const c=frequencyBadge(n,'xien');
          const active=state.numbers.includes(n);
          const locked=full&&!active;
          return `<button class="loxien-number ${active?'active':''} ${locked?'locked':''}"
            data-number="${n}" ${locked?'disabled':''}>
            <span>${n}</span><i class="${c<=1?'red':''}">${c}</i>
          </button>`;
        }).join('')
      }</div>
    </div>
  </div>`;
}
function quickHtml(){
  if(state.game==='lo_xien')return loXienHtml();
  if(['bao_lo','danh_de','ba_cang'].includes(state.game))return smartQuickHtml();
  return digitRowsHtml();
}
function renderSelection(){
  const box=el('selectionArea');

  if(state.mode==='manual'){
    const width=state.game==='lo_xien' ? 2 : (cfg().digits||2);
    const example=width===1?'1, 3, 7':width===2?'12, 34, 56':width===3?'123, 456':'1234, 5678';

    box.innerHTML=`<div class="manual-box">
      <label>Nhập ${width} chữ số, ngăn cách bằng dấu phẩy / khoảng trắng</label>
      <textarea id="manualInput" placeholder="Ví dụ: ${example}"></textarea>
      <div class="manual-note">
        ${state.game==='lo_xien'
          ? `${cfg().label} cần nhập đúng ${cfg().pick} số khác nhau, mỗi số gồm 2 chữ số.`
          : `Chỉ các số đúng ${width} chữ số mới được tính.`}
      </div>
    </div>`;
  }else if(state.game==='lo_xien'){
    box.innerHTML=loXienHtml();
  }else if(state.mode==='quick'){
    box.innerHTML=quickHtml();
  }else{
    box.innerHTML=digitRowsHtml();
  }

  box.querySelectorAll('[data-digit]').forEach(b=>
    b.onclick=()=>toggleDigit(Number(b.dataset.row),Number(b.dataset.digit))
  );

  box.querySelectorAll('[data-q]').forEach(b=>
    b.onclick=()=>quickRow(Number(b.dataset.row),b.dataset.q)
  );

  box.querySelectorAll('[data-number]').forEach(b=>
    b.onclick=()=>toggleNumber(b.dataset.number)
  );

  box.querySelectorAll('[data-lx]').forEach(b=>b.onclick=()=>{
    if(b.dataset.lx==='clear'){
      state.numbers=[];
    }else{
      const limit=cfg().pick;
      if(state.numbers.length>=limit)state.numbers.shift();

      let n;
      do{
        n=String(Math.floor(Math.random()*100)).padStart(2,'0');
      }while(state.numbers.includes(n));

      state.numbers.push(n);
    }

    renderSelection();
    updateSummary();
  });

  box.querySelectorAll('[data-smart]').forEach(b=>
    b.onclick=()=>smartPick(b.dataset.smart)
  );

  box.querySelectorAll('[data-fast]').forEach(b=>
    b.onclick=()=>fastPick(b.dataset.fast)
  );

  el('manualInput')?.addEventListener('input',updateSummary);
}
function fastPick(type){if(type==='clear'){state.numbers=[];state.rows=rowLabels().map(()=>[])}else if(type==='random'){if(state.game==='lo_xien'){state.numbers=[];while(state.numbers.length<cfg().pick){const n=String(Math.floor(Math.random()*100)).padStart(2,'0');if(!state.numbers.includes(n))state.numbers.push(n)}}else{state.rows=rowLabels().map(()=>[Math.floor(Math.random()*10)]);state.numbers=[]}}else if(/^\d\d-\d\d$/.test(type)){const[a,b]=type.split('-').map(Number);state.numbers=[];for(let i=a;i<=b;i++)state.numbers.push(String(i).padStart(2,'0'))}renderSelection();updateSummary()}
function updateSummary(){
  const n=selected();
  const amount=selectionCost(n);

  el('selectedCount').textContent=n.length;
  el('selectedMoney').textContent=fmt(amount);

  el('mSelectedCount').textContent=n.length;
  el('mMoney').textContent=fmt(amount);
  el('mMultiplier').value=multiplier();
  el('mBalance').textContent=fmt(user()?.balance||0);

  document.querySelectorAll('[data-chip]').forEach(b=>
    b.classList.toggle('active',Number(b.dataset.chip)===multiplier())
  );
}

function makeDraft(){
  const nums=selected();
  if(!nums.length){
    toast('Bạn chưa chọn số.',true);
    return null;
  }

  if(state.game==='lo_xien'&&nums.length!==cfg().pick){
    toast(`${cfg().label} cần chọn đủ ${cfg().pick} số.`,true);
    return null;
  }

  const m=multiplier();
  const total=selectionCost(nums);
  const stake=state.game==='lo_xien'?Number(cfg().ticketStake||1000):unitStake();
  const ratio=oddsRatio();

  return{
    id:`D${Date.now()}${Math.random().toString(36).slice(2,5)}`,
    game:state.game,
    gameTitle:GAME[state.game].title,
    subId:cfg().id,
    subTitle:cfg().label,
    numbers:nums,
    count:state.game==='lo_xien'?1:nums.length,
    selectedCount:nums.length,
    multiplier:m,
    unitStake:stake,
    oddsRatio:ratio,
    total,
    displayWin:Math.round(stake*m*ratio)
  };
}
function addDraft(){const d=makeDraft();if(!d)return;state.drafts.push(d);resetSelections();renderDrafts();toast('Đã thêm vào nội dung cược.')}
function renderDrafts(){const body=el('draftBody');if(!state.drafts.length){body.innerHTML='';el('draftEmpty').style.display='grid'}else{el('draftEmpty').style.display='none';body.innerHTML=state.drafts.map((d,i)=>`<tr><td>${esc(d.subTitle)}</td><td>${esc(d.numbers.join(', '))}</td><td>${d.count}</td><td>${d.multiplier}</td><td>${fmt(d.total)}</td><td>${fmt(d.displayWin)}</td><td><button class="remove-line" data-remove="${i}">Xóa</button></td></tr>`).join('');body.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{state.drafts.splice(Number(b.dataset.remove),1);renderDrafts()})}el('draftTotal').textContent=fmt(state.drafts.reduce((s,d)=>s+d.total,0))}
function placeDrafts(drafts){
  if(!requireLogin())return false;
  if(!drafts.length){
    toast('Không có nội dung cược.',true);
    return false;
  }

  const total=drafts.reduce((s,d)=>s+d.total,0);
  const db=getDb();
  const u=db.users[username()];

  if(!u||u.balance<total){
    toast('Không đủ điểm demo.',true);
    return false;
  }

  u.balance-=total;
  const drawDate=nextDrawDate();
  const now=new Date().toISOString();

  for(const d of drafts){
    db.bets.push({
      id:`B${Date.now()}${Math.random().toString(36).slice(2,6)}`,
      username:u.username,
      drawDate,
      draw:`MB-${drawDate}`,
      createdAt:now,
      gameKey:d.game,
      game:d.gameTitle,
      subId:d.subId,
      sub:d.subTitle,
      numbers:d.numbers,
      count:d.count,
      selectedCount:d.selectedCount,
      multiplier:d.multiplier,
      unitStake:d.unitStake,
      oddsRatio:d.oddsRatio,
      total:d.total,
      valid:d.total,
      status:'pending',
      payout:0,
      result:0
    });
  }

  saveDb(db);
  renderAll();
  toast('Đã ghi vé vào Hồ sơ cá cược và Chưa thanh toán.');
  return true;
}
function instantBet(){const d=makeDraft();if(d&&placeDrafts([d]))resetSelections()}
function submitDrafts(){if(placeDrafts(state.drafts)){state.drafts=[];renderDrafts()}}

function parseDateText(text){const m=String(text).match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:null}
function prizeCells(){const root=el('box_kqxs_minhngoc');if(!root)return[];return['giaidb','giai1','giai2','giai3','giai4','giai5','giai6','giai7'].map(cls=>root.querySelector(`.${cls}`)).filter(Boolean)}
function originalText(cell){return cell?.dataset.rawResult||cell?.textContent||''}
function numbersFrom(cell){return(originalText(cell).match(/\d{2,5}/g)||[])}
function processMinhNgoc(){const root=el('box_kqxs_minhngoc');if(!root)return false;const cells=prizeCells();if(!cells.length)return false;root.querySelectorAll('.thu,.ngay').forEach(td=>td.closest('tr')?.classList.add('date-row-hidden'));for(const c of cells){const raw=(c.dataset.rawResult||c.textContent||'').replace(/\s+/g,' ').trim();if(!c.dataset.rawResult)c.dataset.rawResult=raw;const nums=raw.match(/\d{2,5}/g)||[];const sig=nums.join('|');if(c.dataset.renderSig!==sig){c.dataset.renderSig=sig;c.innerHTML=nums.map((n,i)=>{const p=n.length>2?n.slice(0,-2):'',tail=n.slice(-2),piece=`<span class="result-number">${p}<span class="result-tail">${tail}</span></span>`;return i===nums.length-1?piece:`${piece}<span class="result-sep">-</span>`}).join('')}}const parsedSourceDate=parseDateText(root.querySelector('.ngay')?.textContent||root.textContent);const date=parsedSourceDate||localDateKey(new Date());const db=numbersFrom(root.querySelector('.giaidb'))[0]||'';const all=cells.flatMap(numbersFrom);const last2=all.map(n=>n.slice(-2));const prizeKeys=['db','g1','g2','g3','g4','g5','g6','g7'];
const prizes={};
cells.forEach((cell,i)=>{prizes[prizeKeys[i]]=numbersFrom(cell)});
state.lastResult={date,db,all,last2,prizes,sourceDateDetected:!!parsedSourceDate};el('resultDate').textContent=displayDate(date);el('sideDate').textContent=displayDate(date);el('sideDrawDate').textContent=displayDate(date);if(db){const balls=db.slice(-5).padStart(5,'0').split('').map((d,i)=>`<span class="${i>=3?'orange':''}">${d}</span>`).join('');el('heroBalls').innerHTML=balls;el('mobileBalls').innerHTML=balls;renderDbTags(db)}renderHeadTail(last2);renderMobileResults();document.querySelector('.result-column')?.classList.add('results-ready');settleWithActualResult();return true}
function renderDbTags(db){const last2=db.slice(-2),num=Number(last2),size=Number(last2[0])<5?'Xỉu':'Tài',parity=num%2?'Lẻ':'Chẵn',z=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'][num%12];el('dbTags').innerHTML=`<span>${size}</span><span>${parity}</span><span>${z}</span>`}
function renderHeadTail(last2=[]){const g=Array.from({length:10},()=>[]);last2.forEach(p=>{if(/^\d{2}$/.test(p))g[Number(p[0])].push(p[1])});el('headTail').innerHTML=g.map((tails,i)=>`<div><span>${i}</span><span>${tails.length?tails.join(','):'—'}</span></div>`).join('')}
function renderMobileResults(){const r=state.lastResult;if(!r){el('mobileResultsBody').innerHTML='<div class="mobile-card">Chưa tải được kết quả.</div>';return}const labels=['Giải ĐB','Giải nhất','Giải nhì','Giải ba','Giải tư','Giải năm','Giải sáu','Giải bảy'];const rows=prizeCells().map((c,i)=>`<tr><td>${labels[i]}</td><td>${esc(numbersFrom(c).join(' - '))}</td></tr>`).join('');el('mobileResultsBody').innerHTML=`<div class="mobile-card"><b>Miền Bắc — ${displayDate(r.date)}</b></div><table class="mobile-result-table">${rows}</table>`}
function installResultObserver(){const root=el('box_kqxs_minhngoc');if(!root)return;let lock=false;const run=()=>{if(lock)return;lock=true;requestAnimationFrame(()=>{lock=false;processMinhNgoc()})};new MutationObserver(run).observe(root,{subtree:true,childList:true,characterData:true});let tries=0;const t=setInterval(()=>{const ok=processMinhNgoc();tries++;if(ok&&tries>10)clearInterval(t);if(tries===15&&!ok)el('resultLoading').textContent='Chưa tải được KQXS. Hãy kiểm tra Internet hoặc trình chặn script.';if(tries>120)clearInterval(t)},1000);run()}

function demoPayout(bet,winningUnits){
  if(!winningUnits)return 0;
  const stake=Number(bet.unitStake||1000);
  const ratio=Number(bet.oddsRatio||1);
  const m=Number(bet.multiplier||1);
  return Math.round(winningUnits*stake*m*ratio);
}

function winningUnitsForBet(b,r){
  const db=r.db||'';
  const nums=b.numbers||[];
  const prizes=r.prizes||{};
  const all=r.all||[];

  if(b.gameKey==='lo_xien'){
    return nums.length && nums.every(n=>(r.last2||[]).includes(n)) ? 1 : 0;
  }

  if(b.gameKey==='bao_lo'){
    let targets=[];
    if(b.subId==='lo2'||b.subId==='lo2_1k'){
      targets=all.map(x=>x.slice(-2));
    }else if(b.subId==='lo2dau'){
      targets=all.map(x=>x.slice(0,2));
    }else if(b.subId==='lo3'){
      targets=all.map(x=>x.slice(-3));
    }else if(b.subId==='lo4'){
      targets=all.map(x=>x.slice(-4));
    }
    return targets.filter(t=>nums.includes(t)).length;
  }

  if(b.gameKey==='danh_de'){
    let targets=[];
    if(b.subId==='de_db')targets=[db.slice(-2)];
    if(b.subId==='de_dau_db')targets=[db.slice(0,2)];
    if(b.subId==='de_giai7')targets=(prizes.g7||[]).map(x=>x.slice(-2));
    if(b.subId==='de_giai1')targets=(prizes.g1||[]).slice(0,1).map(x=>x.slice(-2));
    if(b.subId==='de_dau_giai1')targets=(prizes.g1||[]).slice(0,1).map(x=>x.slice(0,2));
    return targets.filter(t=>nums.includes(t)).length;
  }

  if(b.gameKey==='dau_duoi'){
    const last2=db.slice(-2);
    const target=b.subId==='dau'?last2.slice(0,1):last2.slice(-1);
    return nums.includes(target)?1:0;
  }

  if(b.gameKey==='ba_cang'){
    const g1=(prizes.g1||[])[0]||'';
    let targets=[];
    if(b.subId==='3c_db')targets=[db.slice(-3)];
    if(b.subId==='3c_giai1')targets=[g1.slice(-3)];
    if(b.subId==='3c_dau_duoi')targets=[db.slice(-3),g1.slice(-3)].filter(Boolean);
    if(b.subId==='3c_dau')targets=[db.slice(0,3)];
    return targets.filter(t=>nums.includes(t)).length;
  }

  if(b.gameKey==='bon_cang'){
    return nums.includes(db.slice(-4))?1:0;
  }

  return 0;
}

function isWinningBet(b,r){
  return winningUnitsForBet(b,r)>0;
}
function settleWithActualResult(){
  const r=state.lastResult;
  if(!r)return;

  const db=getDb();
  let changed=false;

  for(const b of db.bets){
    if(b.status!=='pending'||b.drawDate!==r.date)continue;

    const units=winningUnitsForBet(b,r);
    const win=units>0;

    b.status=win?'win':'lose';
    b.winningUnits=units;
    b.payout=demoPayout(b,units);
    b.result=b.payout-b.total;
    b.settledAt=new Date().toISOString();

    if(win&&db.users[b.username]){
      db.users[b.username].balance+=b.payout;
    }
    changed=true;
  }

  if(changed){
    saveDb(db);
    renderAccount();
    renderHistory();
    renderDrawerCounts();
  }
}

function renderHistory(){const u=username(),body=el('historyBody');if(!u){body.innerHTML='';el('historyEmpty').style.display='grid';return}let bets=getDb().bets.filter(b=>b.username===u);if(state.historyFilter==='pending')bets=bets.filter(b=>b.status==='pending');if(state.historyFilter==='settled')bets=bets.filter(b=>b.status!=='pending');bets.reverse();if(!bets.length){body.innerHTML='';el('historyEmpty').style.display='grid';return}el('historyEmpty').style.display='none';body.innerHTML=bets.map(b=>`<tr><td>Miền Bắc</td><td>${esc(b.draw)}</td><td>${esc(b.id)}</td><td>${new Date(b.createdAt).toLocaleString('vi-VN')}</td><td>${esc(b.sub)}</td><td>${esc(b.numbers.join(', '))}</td><td>${b.count}</td><td>${b.multiplier}</td><td>${fmt(b.total)}</td><td>${fmt(b.valid)}</td><td class="${b.status==='win'?'status-win':b.status==='lose'?'status-lose':''}">${b.status==='pending'?'—':`${b.result>=0?'+':''}${fmt(b.result)}`}</td><td class="${b.status==='pending'?'status-pending':b.status==='win'?'status-win':'status-lose'}">${b.status==='pending'?'Chờ mở thưởng':'Đã thanh toán'}</td></tr>`).join('')}
function renderDrawerCounts(){const u=username(),bets=u?getDb().bets.filter(b=>b.username===u):[];el('pendingCountDrawer').textContent=bets.filter(b=>b.status==='pending').length;el('settledCount').textContent=bets.filter(b=>b.status!=='pending').length}
function renderMobileRecords(filter='all',title='Hồ sơ cá cược'){state.mobileFilter=filter;const u=username();let bets=u?getDb().bets.filter(b=>b.username===u):[];if(filter==='pending')bets=bets.filter(b=>b.status==='pending');if(filter==='settled')bets=bets.filter(b=>b.status!=='pending');bets.reverse();el('mobileRecordsTitle').textContent=title;el('mobileRecordsList').innerHTML=!u?'<div class="mobile-card">Hãy đăng nhập để xem dữ liệu.</div>':!bets.length?'<div class="mobile-card">Không có dữ liệu.</div>':bets.map(b=>`<article class="mobile-card"><div class="line"><b>${esc(b.sub)}</b><span class="${b.status==='pending'?'status-pending':b.status==='win'?'status-win':'status-lose'}">${b.status==='pending'?'Chưa thanh toán':b.status==='win'?'Thắng':'Thua'}</span></div><div class="line"><span>Lượt xổ</span><b>${esc(b.draw)}</b></div><div class="line"><span>Nội dung</span><b>${esc(b.numbers.join(', '))}</b></div><div class="line"><span>Tiền cược</span><b>${fmt(b.total)} VND</b></div><div class="line"><span>Thời gian</span><span>${new Date(b.createdAt).toLocaleString('vi-VN')}</span></div></article>`).join('');el('mobileRecords').classList.add('open')}

function openDrawer(){el('mobileDrawer').classList.add('open');el('drawerBackdrop').classList.add('open');renderAccount()}
function closeDrawer(){el('mobileDrawer').classList.remove('open');el('drawerBackdrop').classList.remove('open')}
function renderMobileGameMenu(){
  const menu=el('mobileGameMenu');

  const order=['bao_lo','lo_xien','danh_de','dau_duoi','ba_cang','bon_cang'];
  const sections=order.map(key=>{
    const g=GAME[key];
    if(!g)return '';
    const items=g.subs.map((s,i)=>`<button data-mgame="${key}" data-msub="${i}" class="mobile-game-option ${state.game===key&&state.sub===i?'active':''}">${s.label}</button>`).join('');
    return `<section class="mobile-game-group">
      <h3>${g.title}</h3>
      <div class="mobile-game-option-grid">${items}</div>
    </section>`;
  }).join('');

  menu.innerHTML=`<div class="mobile-game-dialog" role="dialog" aria-modal="true" aria-label="Danh sách trò chơi">
    <div class="mobile-game-dialog-title">Danh sách trò chơi</div>
    <div class="mobile-game-dialog-body">
      <aside class="mobile-game-category"><span>Cổ điển</span></aside>
      <div class="mobile-game-groups">${sections}</div>
    </div>
    <button type="button" class="mobile-game-close" data-close-game-menu aria-label="Đóng">×</button>
  </div>`;

  menu.querySelectorAll('[data-mgame]').forEach(b=>b.onclick=()=>{
    state.game=b.dataset.mgame;
    state.sub=Number(b.dataset.msub);
    state.mode=defaultModeForGame(state.game);
    state.quickPage=0;

    document.querySelectorAll('#gameTabs [data-game]').forEach(x=>
      x.classList.toggle('active',x.dataset.game===state.game)
    );

    menu.classList.remove('open');
    renderSubTabs();
    renderMeta();
    resetSelections();
  });

  menu.querySelector('[data-close-game-menu]')?.addEventListener('click',()=>menu.classList.remove('open'));
  menu.onclick=e=>{if(e.target===menu)menu.classList.remove('open')};
}
function clockTick(){
  const n=new Date();

  const todayKey=localDateKey(n);

  // Mốc đóng cược / bắt đầu chờ KQ.
  const todayCutoff=new Date(n);
  todayCutoff.setHours(18,15,0,0);

  // Mốc UI được phép chuyển sang countdown kỳ ngày mai.
  // Cố định 19:30, KHÔNG phụ thuộc Minh Ngọc đã cập nhật hay chưa.
  const nextCountdownAt=new Date(n);
  nextCountdownAt.setHours(19,30,0,0);

  // 1) Trước 18:15: countdown kỳ hôm nay.
  if(n<todayCutoff){
    const secTotal=Math.max(0,Math.floor((todayCutoff-n)/1000));
    const h=String(Math.floor(secTotal/3600)).padStart(2,'0');
    const m=String(Math.floor(secTotal%3600/60)).padStart(2,'0');
    const sec=String(secTotal%60).padStart(2,'0');
    const chars=(h+m+sec).split('');

    const html=
      `<b>${chars[0]}</b><b>${chars[1]}</b><em>:</em>`+
      `<b>${chars[2]}</b><b>${chars[3]}</b><em>:</em>`+
      `<b>${chars[4]}</b><b>${chars[5]}</b>`;

    el('countdown').classList.remove('preparing');
    el('mobileCountdown').classList.remove('preparing');

    el('countdown').innerHTML=html;
    el('mobileCountdown').innerHTML=html;

    el('deadlineText').textContent=`Kỳ tiếp theo ${displayDate(todayKey)}`;
    el('mobileDrawDate').textContent=displayDate(todayKey);

  // 2) Từ 18:15 tới trước 19:30:
  // LUÔN hiện "Hết giờ -- / Đang chuẩn bị".
  // Kể cả Minh Ngọc đã cập nhật kết quả thì UI countdown vẫn đứng ở đây.
  }else if(n<nextCountdownAt){
    el('deadlineText').textContent='Hết giờ --';

    el('countdown').classList.add('preparing');
    el('mobileCountdown').classList.add('preparing');

    el('countdown').innerHTML='<span class="preparing-text">Đang chuẩn bị</span>';
    el('mobileCountdown').innerHTML='<span class="preparing-text">Đang chuẩn bị</span>';

    el('mobileDrawDate').textContent=displayDate(todayKey);

  // 3) Từ 19:30 trở đi:
  // mới bắt đầu countdown đúng tới 18:15 ngày mai.
  }else{
    const tomorrow=new Date(n);
    tomorrow.setDate(tomorrow.getDate()+1);
    tomorrow.setHours(18,15,0,0);

    const secTotal=Math.max(0,Math.floor((tomorrow-n)/1000));
    const h=String(Math.floor(secTotal/3600)).padStart(2,'0');
    const m=String(Math.floor(secTotal%3600/60)).padStart(2,'0');
    const sec=String(secTotal%60).padStart(2,'0');
    const chars=(h+m+sec).split('');

    const html=
      `<b>${chars[0]}</b><b>${chars[1]}</b><em>:</em>`+
      `<b>${chars[2]}</b><b>${chars[3]}</b><em>:</em>`+
      `<b>${chars[4]}</b><b>${chars[5]}</b>`;

    el('countdown').classList.remove('preparing');
    el('mobileCountdown').classList.remove('preparing');

    el('countdown').innerHTML=html;
    el('mobileCountdown').innerHTML=html;

    const tomorrowKey=localDateKey(tomorrow);
    el('deadlineText').textContent=`Kỳ tiếp theo ${displayDate(tomorrowKey)}`;
    el('mobileDrawDate').textContent=displayDate(tomorrowKey);
  }

  // Fallback ngày KQ gần nhất trước khi nguồn Minh Ngọc tải thành công.
  // Phần này chỉ liên quan ngày kết quả hiển thị, không điều khiển countdown.
  if(!state.lastResult){
    const latest=new Date(n);
    const todayResultFallback=new Date(n);
    todayResultFallback.setHours(18,30,0,0);

    if(n<todayResultFallback)latest.setDate(latest.getDate()-1);

    const latestKey=localDateKey(latest);
    el('resultDate').textContent=displayDate(latestKey);
    el('sideDate').textContent=displayDate(latestKey);
    el('sideDrawDate').textContent=displayDate(latestKey);
  }

  el('desktopClock').textContent=
    `Ngày ${String(n.getDate()).padStart(2,'0')} `+
    `Tháng ${String(n.getMonth()+1).padStart(2,'0')} `+
    `Năm ${n.getFullYear()} `+
    `${String(n.getHours()).padStart(2,'0')}:`+
    `${String(n.getMinutes()).padStart(2,'0')} 🇻🇳`;
}
function renderAll(){renderAccount();renderSubTabs();renderMeta();renderSelection();renderDrafts();renderHistory();updateSummary();renderDrawerCounts()}

function bind(){document.querySelectorAll('#gameTabs [data-game]').forEach(b=>b.onclick=()=>{state.game=b.dataset.game;state.sub=0;state.mode=defaultModeForGame(state.game);state.quickPage=0;document.querySelectorAll('#gameTabs [data-game]').forEach(x=>x.classList.toggle('active',x===b));renderSubTabs();renderMeta();resetSelections()});el('modeTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(!modeAllowed(b.dataset.mode))return;state.mode=b.dataset.mode;state.quickPage=0;syncModes();resetSelections()});el('minus').onclick=()=>{el('multiplier').value=Math.max(1,multiplier()-1);updateSummary()};el('plus').onclick=()=>{el('multiplier').value=multiplier()+1;updateSummary()};el('multiplier').oninput=updateSummary;el('addDraft').onclick=addDraft;el('instantBet').onclick=instantBet;el('resetSelection').onclick=resetSelections;el('clearDrafts').onclick=()=>{state.drafts=[];renderDrafts()};el('submitDrafts').onclick=submitDrafts;el('historyTabs').querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{state.historyFilter=b.dataset.filter;el('historyTabs').querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderHistory()});el('refreshHistory').onclick=renderHistory;
  el('mobileMenu').onclick=openDrawer;el('drawerBackdrop').onclick=closeDrawer;el('mobileBack').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});el('mobileGamePicker').onclick=()=>el('mobileGameMenu').classList.toggle('open');document.querySelectorAll('[data-chip]').forEach(b=>b.onclick=()=>{el('multiplier').value=b.dataset.chip;updateSummary()});el('mReset').onclick=resetSelections;el('mBet').onclick=()=>{if(state.drafts.length)submitDrafts();else instantBet()};document.querySelectorAll('[data-drawer]').forEach(b=>b.onclick=()=>{const a=b.dataset.drawer;closeDrawer();if(a==='all')return renderMobileRecords('all','Hồ sơ cá cược');if(a==='pending')return renderMobileRecords('pending','Chưa thanh toán');if(a==='settled')return renderMobileRecords('settled','Thắng thua');if(a==='feed')return renderMobileRecords('all','Lịch sử nuôi');if(a==='results'){renderMobileResults();return el('mobileResults').classList.add('open')}if(a==='help')return toast('Chọn cách chơi → chọn số → chọn số nhân → Cá cược.');if(a==='home')return window.scrollTo({top:0,behavior:'smooth'});if(a==='closed')return toast('Mục mô phỏng kỳ đã đóng.');if(a==='theme')return toast('Bản demo hiện dùng một chủ đề.');if(a==='support')return toast('CSKH demo.')});document.querySelectorAll('[data-close-mobile-page]').forEach(b=>b.onclick=()=>b.closest('.mobile-page').classList.remove('open'));el('mobileRecordsRefresh').onclick=()=>renderMobileRecords(state.mobileFilter||'all',el('mobileRecordsTitle').textContent||'Hồ sơ cá cược');el('mobileResultsRefresh').onclick=renderMobileResults;
  el('closeAuth').onclick=closeAuth;el('showRegister').onclick=()=>openAuth('register');el('showLogin').onclick=()=>openAuth('login');el('doLogin').onclick=()=>doLogin(el('loginUser').value.trim().toLowerCase(),el('loginPass').value);el('doRegister').onclick=()=>doRegister(el('registerUser').value,el('registerPass').value);el('authModal').onclick=e=>{if(e.target===el('authModal'))closeAuth()};bindDesktopAuth()}

function init(){bind();renderAll();clockTick();setInterval(clockTick,1000);installResultObserver()}
init();
