const DB_KEY='lotto_v9_db';
const SESSION_KEY='lotto_v9_session';
const MAINTENANCE_MESSAGE='Đang bảo trì hệ thống, vui lòng thử lại sau.';
function generateCaptchaCode(){
  return String(
    Math.floor(1000 + Math.random()*9000)
  );
}

let captchaCode=generateCaptchaCode();

function refreshCaptchaCode(){
  captchaCode=generateCaptchaCode();

  const captcha=document.querySelector('.captcha-box');

  if(captcha){
    captcha.textContent=captchaCode;
  }
}
let storageMigrationDone=false;

const GAME={
  bao_lo:{
    title:'Bao Lô',
    quickProfile:'bao',
    subs:[
      {
        id:'lo2',
        label:'Lô 2 Số',
        digits:2,
        odds:'1 : 99.9',
        unitStake:27000
      },
      {
        id:'lo2dau',
        label:'Lô 2 Số Đầu',
        digits:2,
        odds:'1 : 99.9',
        unitStake:23000
      },
      {
        id:'lo2_1k',
        label:'Lô 2 Số 1K',
        digits:2,
        odds:'1 : 3.7',
        unitStake:1000
      },
      {
        id:'lo3',
        label:'Lô 3 Số',
        digits:3,
        odds:'1 : 980',
        unitStake:23000
      },
      {
        id:'lo4',
        label:'Lô 4 Số',
        digits:4,
        odds:'1 : 8880',
        unitStake:20000
      }
    ]
  },

  lo_xien:{
    title:'Lô Xiên',
    quickProfile:'xien',
    subs:[
      {
        id:'xien2',
        label:'Xiên 2',
        pick:2,
        odds:'1 : 16',
        ticketStake:1000
      },
      {
        id:'xien3',
        label:'Xiên 3',
        pick:3,
        odds:'1 : 65',
        ticketStake:1000
      },
      {
        id:'xien4',
        label:'Xiên 4',
        pick:4,
        odds:'1 : 180',
        ticketStake:1000
      }
    ]
  },

  danh_de:{
    title:'Đánh Đề',
    quickProfile:'de',
    subs:[
      {
        id:'de_db',
        label:'Đề đặc biệt',
        digits:2,
        odds:'1 : 99.5',
        unitStake:1000
      },
      {
        id:'de_dau_db',
        label:'Đề đầu đặc biệt',
        digits:2,
        odds:'1 : 99.5',
        unitStake:1000
      },
      {
        id:'de_giai7',
        label:'Đề Giải 7',
        digits:2,
        odds:'1 : 99.5',
        unitStake:4000
      },
      {
        id:'de_giai1',
        label:'Đề Giải Nhất',
        digits:2,
        odds:'1 : 99.5',
        unitStake:1000
      },
      {
        id:'de_dau_giai1',
        label:'Đề đầu giải nhất',
        digits:2,
        odds:'1 : 99.5',
        unitStake:1000
      }
    ]
  },

  dau_duoi:{
    title:'Đầu Đuôi',
    quickProfile:null,
    subs:[
      {
        id:'dau',
        label:'Đầu',
        digits:1,
        odds:'1 : 9.95',
        unitStake:1000
      },
      {
        id:'duoi',
        label:'Đuôi',
        digits:1,
        odds:'1 : 9.95',
        unitStake:1000
      }
    ]
  },

  ba_cang:{
    title:'3 Càng',
    quickProfile:'3cang',
    subs:[
      {
        id:'3c_db',
        label:'3 Càng Đặc Biệt',
        digits:3,
        odds:'1 : 980',
        unitStake:1000
      },
      {
        id:'3c_giai1',
        label:'3 Càng Giải Nhất',
        digits:3,
        odds:'1 : 980',
        unitStake:1000
      },
      {
        id:'3c_dau_duoi',
        label:'3 Càng Đầu Đuôi',
        digits:3,
        odds:'1 : 980',
        unitStake:4000
      },
      {
        id:'3c_dau',
        label:'3 Càng Đầu',
        digits:3,
        odds:'1 : 980',
        unitStake:3000
      }
    ]
  },

  bon_cang:{
    title:'4 Càng',
    quickProfile:null,
    subs:[
      {
        id:'4cang',
        label:'4 Càng',
        digits:4,
        odds:'1 : 8880',
        unitStake:1000
      }
    ]
  }
};

const DIGIT_LABELS={
  1:['Đơn Vị'],
  2:['Chục','Đơn Vị'],
  3:['Trăm','Chục','Đơn Vị'],
  4:['Nghìn','Trăm','Chục','Đơn Vị']
};

const state={
  game:'bao_lo',
  sub:0,
  mode:'digits',
  rows:[[],[]],
  numbers:[],
  quickPage:0,
  drafts:[],
  historyFilter:'all',
  lastResult:null
};

const PRIZE_COUNTS={
  db:1,
  g1:1,
  g2:2,
  g3:6,
  g4:4,
  g5:6,
  g6:3,
  g7:4
};

const PRIZE_DIGITS={
  db:5,
  g1:5,
  g2:5,
  g3:5,
  g4:4,
  g5:4,
  g6:3,
  g7:2
};

const PAYOUT_BASE_STAKE=1000;

function el(id){
  return document.getElementById(id);
}

function fmt(number){
  return Number(number||0).toLocaleString('vi-VN');
}

function esc(value){
  return String(value).replace(
    /[&<>"']/g,
    character=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#039;'
    }[character])
  );
}

function toast(message,error=false){
  const box=el('toast');

  box.textContent=message;
  box.classList.toggle('error',error);
  box.classList.add('show');

  clearTimeout(toast._timer);

  toast._timer=setTimeout(()=>{
    box.classList.remove('show');
  },2200);
}

function showMaintenance(){
  toast(MAINTENANCE_MESSAGE,true);
}

function bindMaintenanceLinks(){
  document.addEventListener(
    'click',
    event=>{
      const target=event.target.closest?.('[data-maintenance]');

      if(!target){
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if(target.closest('.mobile-drawer')){
        closeDrawer();
      }

      showMaintenance();
    },
    true
  );

  document.addEventListener(
    'keydown',
    event=>{
      if(!['Enter',' '].includes(event.key)){
        return;
      }

      const target=event.target.closest?.('[data-maintenance]');

      if(!target){
        return;
      }

      event.preventDefault();
      showMaintenance();
    }
  );
}

function hash(text){
  let value=2166136261;

  for(let index=0;index<text.length;index++){
    value^=text.charCodeAt(index);
    value=Math.imul(value,16777619);
  }

  return(value>>>0).toString(16);
}

function migrateLegacyStorage(){
  if(storageMigrationDone){
    return;
  }

  storageMigrationDone=true;

  const keys=Array.from(
    {length:localStorage.length},
    (_,index)=>localStorage.key(index)
  ).filter(Boolean);

  if(!localStorage.getItem(DB_KEY)){
    const legacyDbKey=keys.find(key=>
      key!==DB_KEY&&
      /^lotto_[a-z0-9-]+_v9_db$/i.test(key)
    );

    if(legacyDbKey){
      localStorage.setItem(
        DB_KEY,
        localStorage.getItem(legacyDbKey)||''
      );
    }
  }

  if(!localStorage.getItem(SESSION_KEY)){
    const legacySessionKey=keys.find(key=>
      key!==SESSION_KEY&&
      /^lotto_[a-z0-9-]+_v9_session$/i.test(key)
    );

    if(legacySessionKey){
      localStorage.setItem(
        SESSION_KEY,
        localStorage.getItem(legacySessionKey)||''
      );
    }
  }
}

function blankDb(){
  return{
    users:{},
    bets:[],
    results:{}
  };
}

function normalizeDb(database){
  const normalized=
    database&&typeof database==='object'
      ? database
      : blankDb();

  normalized.users=normalized.users||{};
  normalized.bets=Array.isArray(normalized.bets)
    ? normalized.bets
    : [];
  normalized.results=normalized.results||{};

  Object.values(normalized.users).forEach(account=>{
    account.balance=Number(account.balance||0);
    account.profile=account.profile||{};
    account.walletTransactions=
      Array.isArray(account.walletTransactions)
        ? account.walletTransactions
        : [];
    account.withdrawals=
      Array.isArray(account.withdrawals)
        ? account.withdrawals
        : [];
    account.complaints=
      Array.isArray(account.complaints)
        ? account.complaints
        : [];
  });

  return normalized;
}
function getDb(){
  migrateLegacyStorage();

  try{
    return normalizeDb(
      JSON.parse(localStorage.getItem(DB_KEY))||
      blankDb()
    );
  }catch{
    return blankDb();
  }
}

function saveDb(database){
  migrateLegacyStorage();

  localStorage.setItem(
    DB_KEY,
    JSON.stringify(database)
  );
}

function username(){
  migrateLegacyStorage();
  return localStorage.getItem(SESSION_KEY);
}

function user(){
  const name=username();

  return name
    ? getDb().users[name]||null
    : null;
}

function cfg(){
  return GAME[state.game].subs[state.sub];
}

function multiplier(){
  return Math.max(
    1,
    Math.floor(
      Number(el('multiplier').value)||1
    )
  );
}

function localDateKey(date=new Date()){
  return(
    `${date.getFullYear()}-`+
    `${String(date.getMonth()+1).padStart(2,'0')}-`+
    `${String(date.getDate()).padStart(2,'0')}`
  );
}

function displayDate(key){
  const[y,m,d]=key.split('-');
  return`${d}/${m}/${y}`;
}

function nextDrawDate(){
  const now=new Date();
  const cutoff=new Date(now);

  cutoff.setHours(18,15,0,0);

  if(now>=cutoff){
    now.setDate(now.getDate()+1);
  }

  return localDateKey(now);
}

function openAuth(which='login'){
  el('authModal').classList.remove('hidden');

  el('loginPane').classList.toggle(
    'hidden',
    which!=='login'
  );

  el('registerPane').classList.toggle(
    'hidden',
    which!=='register'
  );
}

function closeAuth(){
  el('authModal').classList.add('hidden');
}

function requireLogin(){
  if(user()){
    return true;
  }

  openAuth('login');

  toast(
    'Hãy đăng nhập hoặc đăng ký tài khoản trước.',
    true
  );

  return false;
}

function renderAccount(){
  const currentUser=user();
  const desktop=el('desktopAuth');

  if(currentUser){
    const eligible=currentUser.firstDepositUsed!==true;

    desktop.innerHTML=`
      <div class="desktop-user account-menu-shell">
        <button id="accountMenuToggle" class="account-menu-toggle" type="button">
          <span class="account-avatar">👤</span>
          <span class="account-summary">
            <strong>${esc(currentUser.username)}</strong>
            <em>${fmt(currentUser.balance)} VND</em>
          </span>
          <span class="account-caret">▾</span>
        </button>

        <div id="accountDropdown" class="account-dropdown hidden">
          <button type="button" data-account-tab="profile">Hồ sơ</button>
          <button type="button" data-account-tab="history">Lịch sử đặt cược</button>
          <button type="button" data-account-tab="settings">Cài đặt</button>
          <button id="menuComplaint" type="button">Khiếu nại</button>
          <div class="account-dropdown-wallet">
            <button id="menuDeposit" type="button">Nạp tiền</button>
            <button id="menuWithdraw" type="button">Rút tiền</button>
          </div>
          <button id="desktopLogout" class="account-logout" type="button">Đăng xuất</button>
        </div>

        <button id="desktopDeposit" class="header-wallet-btn deposit" type="button">Nạp</button>
        <button id="desktopWithdraw" class="header-wallet-btn withdraw" type="button">Rút</button>
        <button id="desktopGift" class="wallet-gift-btn" type="button" aria-label="Quà nạp">
          🎁${eligible?'<i>1</i>':''}
        </button>
      </div>
    `;
  }else{
    desktop.innerHTML=`
      <input
        id="headerUser"
        autocomplete="username"
        placeholder="Tên đăng nhập"
      >

      <input
        id="headerPass"
        autocomplete="current-password"
        type="password"
        placeholder="mật khẩu"
      >

      <span
        class="captcha-box"
        id="captchaCode"
        title="Bấm để đổi mã"
      >
        ${captchaCode}
      </span>

      <input
        class="captcha-field"
        placeholder="Mã xác nhận"
      >

      <button id="headerLogin" class="btn-login">
        Đăng nhập
      </button>

      <button id="headerRegister" class="btn-register">
        Đăng ký
      </button>

      <button id="headerTry" class="btn-try" type="button" data-maintenance>
        Chơi thử
      </button>

      <button id="headerForgot" class="btn-forgot" type="button" data-maintenance>
        Quên mật khẩu?
      </button>
    `;

    bindDesktopAuth();
  }

  el('drawerBalance').textContent=
    `${fmt(currentUser?currentUser.balance:0)} VND`;

  el('mBalance').textContent=
    fmt(currentUser?currentUser.balance:0);

  const drawerAuth=el('drawerAuth');

  if(currentUser){
    drawerAuth.innerHTML=`
      <div class="drawer-signed-user">
        <strong>👤 ${esc(currentUser.username)}</strong>
        <div class="drawer-wallet-actions">
          <button id="drawerDeposit" type="button">Nạp</button>
          <button id="drawerWithdraw" type="button">Rút</button>
        </div>
        <button id="drawerAccount" class="drawer-account-btn" type="button">Tài khoản</button>
        <button id="drawerLogout" class="drawer-logout-btn" type="button">Đăng xuất</button>
      </div>
    `;
  }else{
    drawerAuth.innerHTML=`
      <button id="drawerLogin">Đăng nhập</button>
      <button id="drawerRegister">Đăng ký</button>
    `;

    el('drawerLogin').onclick=()=>{
      closeDrawer();
      openAuth('login');
    };

    el('drawerRegister').onclick=()=>{
      closeDrawer();
      openAuth('register');
    };
  }

  renderDrawerCounts();
}

function logout(){
  localStorage.removeItem(SESSION_KEY);
  renderAll();
  closeDrawer();
  toast('Đã đăng xuất.');
}

function bindDesktopAuth(){
  el('headerLogin')?.addEventListener(
    'click',
    loginFromHeader
  );

  el('headerRegister')?.addEventListener(
    'click',
    ()=>{
      refreshCaptchaCode();
      openAuth('register');
    }
  );

  el('captchaCode')?.addEventListener(
    'click',
    refreshCaptchaCode
  );
}

function loginFromHeader(){
  const name=
    el('headerUser').value.trim().toLowerCase();

  const password=
    el('headerPass').value;

  doLogin(name,password);
}

function doLogin(name,password){
  const database=getDb();
  const foundUser=database.users[name];

  if(
    !foundUser||
    foundUser.passwordHash!==hash(password)
  ){
    return toast(
      'Sai tài khoản hoặc mật khẩu.',
      true
    );
  }

  localStorage.setItem(
    SESSION_KEY,
    name
  );

  closeAuth();
  renderAll();
  toast('Đăng nhập thành công.');
}

function doRegister(name,password){
  name=name.trim().toLowerCase();

  if(
    !/^[a-z0-9_]{3,20}$/i.test(name)||
    password.length<4
  ){
    return toast(
      'Tên đăng nhập >=3 ký tự, mật khẩu >=4 ký tự.',
      true
    );
  }

  const database=getDb();

  if(database.users[name]){
    return toast(
      'Tài khoản đã tồn tại trên thiết bị này.',
      true
    );
  }

  database.users[name]={
    username:name,
    passwordHash:hash(password),
    balance:0,
    createdAt:new Date().toISOString(),
    firstDepositUsed:false,
    profile:{},
    walletTransactions:[],
    withdrawals:[],
    complaints:[]
  };

  saveDb(database);

  localStorage.setItem(
    SESSION_KEY,
    name
  );

  closeAuth();
  renderAll();

  toast(
    'Đã tạo tài khoản thành công.'
  );

  setTimeout(()=>{
    if(typeof openDeposit==='function'){
      openDeposit();
    }
  },300);
}

function oddsRatio(value=cfg().odds){
  const match=
    String(value||'').match(/:\s*([\d.]+)/);

  return match
    ? Number(match[1])
    : 1;
}

function unitStake(){
  return Number(
    cfg().unitStake||
    cfg().ticketStake||
    1000
  );
}

function defaultModeForGame(game=state.game){
  if(
    window.matchMedia('(max-width: 760px)').matches&&
    modeAllowed('manual',game)
  ){
    return'manual';
  }

  if(game==='lo_xien'){
    return'quick';
  }

  return'digits';
}
function modeAllowed(mode,game=state.game){
  if(game==='lo_xien'){
    return(
      mode==='manual'||
      mode==='quick'
    );
  }

  if(
    game==='dau_duoi'||
    game==='bon_cang'
  ){
    return(
      mode==='digits'||
      mode==='manual'
    );
  }

  return[
    'digits',
    'manual',
    'quick'
  ].includes(mode);
}

function normalizeMode(){
  if(!modeAllowed(state.mode)){
    state.mode=defaultModeForGame();
  }
}

function selectionCost(numbers=selected()){
  const multiply=multiplier();

  if(state.game==='lo_xien'){
    return numbers.length===cfg().pick
      ? Number(cfg().ticketStake||1000)*multiply
      : 0;
  }

  return(
    numbers.length*
    unitStake()*
    multiply
  );
}

function quickWidth(){
  return Number(cfg().digits||2);
}

function quickPageCount(){
  const width=quickWidth();

  if(width<=2){
    return 1;
  }

  return Math.pow(10,width)/100;
}

function quickRangeValues(){
  const width=quickWidth();
  const pages=quickPageCount();

  state.quickPage=Math.max(
    0,
    Math.min(
      state.quickPage,
      pages-1
    )
  );

  const start=state.quickPage*100;
  const maximum=Math.pow(10,width);
  const end=Math.min(start+100,maximum);

  return Array.from(
    {length:end-start},
    (_,index)=>
      String(start+index).padStart(width,'0')
  );
}

function quickRangeLabel(){
  const values=quickRangeValues();

  if(!values.length){
    return'';
  }

  return(
    `${values[0]} - `+
    `${values[values.length-1]}`
  );
}

function frequencyBadge(
  value,
  profile=GAME[state.game].quickProfile
){
  const width=
    state.game==='lo_xien'
      ? 2
      : quickWidth();

  const number=Number(value);
  const today=new Date();

  let maximum=20;

  if(width===1){
    maximum=9;
  }

  if(width===3){
    maximum=8;
  }

  if(width>=4){
    maximum=3;
  }

  const seed=Math.abs(
    number*37+
    today.getDate()*11+
    (today.getMonth()+1)*17+
    today.getFullYear()*3+
    width*29+
    (
      profile==='xien'
        ? 41
        : profile==='de'
          ? 23
          : profile==='3cang'
            ? 13
            : 7
    )
  );

  if(
    seed%9===0||
    seed%17===0
  ){
    return 0;
  }

  return(
    1+
    (
      (
        seed*7+
        Math.floor(number/3)
      )%maximum
    )
  );
}

function randomSample(values,count){
  const result=[...values];

  for(
    let index=result.length-1;
    index>0;
    index--
  ){
    const randomIndex=
      Math.floor(
        Math.random()*(index+1)
      );

    [
      result[index],
      result[randomIndex]
    ]=[
      result[randomIndex],
      result[index]
    ];
  }

  return result.slice(
    0,
    Math.min(count,result.length)
  );
}

function rowLabels(){
  if(state.game==='lo_xien'){
    return[];
  }

  return(
    DIGIT_LABELS[cfg().digits]||
    ['Đơn Vị']
  );
}

function resetSelections(){
  state.rows=
    rowLabels().map(()=>[]);

  state.numbers=[];
  state.quickPage=0;

  renderSelection();
  updateSummary();
}

function cartesian(rows){
  if(
    !rows.length||
    rows.some(row=>!row.length)
  ){
    return[];
  }

  let output=[''];

  for(const row of rows){
    const next=[];

    for(const prefix of output){
      for(const digit of row){
        next.push(prefix+digit);
      }
    }

    output=next;
  }

  return output;
}

function manualNumbers(){
  const textarea=el('manualInput');

  if(!textarea){
    return[];
  }

  const width=
    state.game==='lo_xien'
      ? 2
      : cfg().digits||2;

  return[
    ...new Set(
      textarea.value
        .split(/[\s,;]+/)
        .map(value=>value.trim())
        .filter(value=>
          new RegExp(
            `^\\d{${width}}$`
          ).test(value)
        )
    )
  ];
}

function selected(){
  if(state.mode==='manual'){
    return manualNumbers();
  }

  if(state.game==='lo_xien'){
    return state.numbers.slice();
  }

  if(
    state.mode==='quick'&&
    state.numbers.length
  ){
    return state.numbers.slice();
  }

  return cartesian(state.rows);
}

function toggleDigit(row,digit){
  const values=state.rows[row]||[];

  state.rows[row]=values.includes(digit)
    ? values.filter(value=>value!==digit)
    : [...values,digit].sort((a,b)=>a-b);

  renderSelection();
  updateSummary();
}

function quickRow(row,type){
  const choices={
    all:[0,1,2,3,4,5,6,7,8,9],
    tai:[5,6,7,8,9],
    xiu:[0,1,2,3,4],
    odd:[1,3,5,7,9],
    even:[0,2,4,6,8],
    clear:[]
  };

  state.rows[row]=choices[type].slice();

  renderSelection();
  updateSummary();
}

function toggleNumber(number){
  const limit=
    state.game==='lo_xien'
      ? cfg().pick
      : 100;

  if(state.numbers.includes(number)){
    state.numbers=
      state.numbers.filter(
        value=>value!==number
      );
  }else{
    if(
      state.game==='lo_xien'&&
      state.numbers.length>=limit
    ){
      return toast(
        `Chỉ chọn ${limit} số cho ${cfg().label}.`,
        true
      );
    }

    state.numbers.push(number);
  }

  renderSelection();
  updateSummary();
}

function renderSubTabs(){
  el('subTabs').innerHTML=
    GAME[state.game].subs
      .map((sub,index)=>`
        <button
          data-sub="${index}"
          class="${index===state.sub?'active':''}"
        >
          ${sub.label}
        </button>
      `)
      .join('');

  el('subTabs')
    .querySelectorAll('button')
    .forEach(button=>{
      button.onclick=()=>{
        state.sub=
          Number(button.dataset.sub);

        state.mode=
          defaultModeForGame(state.game);

        state.quickPage=0;
        state.rows=[];
        state.numbers=[];

        renderSubTabs();
        renderMeta();
        resetSelections();
      };
    });
}
function syncModes(){
  const box=el('modeTabs');

  const digits=
    box.querySelector('[data-mode="digits"]');

  const manual=
    box.querySelector('[data-mode="manual"]');

  const quick=
    box.querySelector('[data-mode="quick"]');

  const hint=el('modeHint');

  normalizeMode();

  digits.style.display=
    state.game==='lo_xien'
      ? 'none'
      : '';

  quick.style.display=
    (
      state.game==='dau_duoi'||
      state.game==='bon_cang'
    )
      ? 'none'
      : '';

  const visible=[
    digits,
    manual,
    quick
  ].filter(button=>
    button.style.display!=='none'
  );

  box.classList.toggle(
    'two',
    visible.length===2
  );

  hint.classList.remove('clickable');
  hint.removeAttribute('data-popup');

  if(
    state.mode==='quick'&&
    [
      'bao_lo',
      'lo_xien',
      'danh_de',
      'ba_cang'
    ].includes(state.game)
  ){
    hint.innerHTML=
      '<span class="help-dot">?</span> Hướng dẫn';

    hint.dataset.popup='quick';
    hint.classList.add('clickable');
  }else if(
    state.mode==='digits'&&
    [
      'danh_de',
      'ba_cang',
      'bon_cang'
    ].includes(state.game)
  ){
    hint.innerHTML=
      '<span class="hotcold-dot">?</span> Nóng/Lạnh';

    hint.dataset.popup='hotcold';
    hint.classList.add('clickable');
  }else{
    hint.textContent='';
  }

  [
    digits,
    manual,
    quick
  ].forEach(button=>
    button.classList.toggle(
      'active',
      button.dataset.mode===state.mode
    )
  );
}

function helpTemplateHtml(type){
  if(type==='quick'){
    return(
      document
        .getElementById('helpQuickTemplate')
        ?.innerHTML||
      ''
    );
  }

  if(type==='hotcold'){
    return(
      document
        .getElementById('helpHotColdTemplate')
        ?.innerHTML||
      ''
    );
  }

  if(type==='play'){
    const subId=cfg().id;

    const template=document.querySelector(
      `template[data-help-type="play"]`+
      `[data-game="${state.game}"]`+
      `[data-sub="${subId}"]`
    );

    return(
      template?.innerHTML||
      '<p>Chưa có nội dung cách chơi cho mục này.</p>'
    );
  }

  return'';
}

function openHelpModal(type){
  const modal=el('helpModal');
  const title=el('helpModalTitle');
  const body=el('helpModalBody');

  const titles={
    quick:'Hướng dẫn chơi',
    hotcold:'Hướng dẫn chơi',
    play:'Cách chơi'
  };

  title.textContent=titles[type]||'Hướng dẫn chơi';
  body.innerHTML=helpTemplateHtml(type);

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('popup-open');
}

function closeHelpModal(){
  const modal=el('helpModal');

  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  document.body.classList.remove('popup-open');
}

function renderMeta(){
  const config=cfg();

  el('desktopGameName').textContent=config.label;
  el('mobileGameName').textContent=config.label;
  el('oddsText').textContent=config.odds;

  el('selectionArea').dataset.mobileOdds=
    `Tỉ lệ cược ${config.odds}  ⓘ`;

  syncModes();
  renderMobileGameMenu();
}

function quickProfileConfig(){
  if(state.game==='bao_lo'){
    return{
      random:[1,2,3,5,10],
      special:['same'],
      top:[1,2,5,10,20]
    };
  }

  if(state.game==='danh_de'){
    return{
      random:[10,20,30,40,50],
      special:['same','even','odd','tai','xiu'],
      top:[1,2,5,10,20]
    };
  }

  if(state.game==='ba_cang'){
    return{
      random:[10,20,30,40,50],
      special:['same'],
      top:[]
    };
  }

  return{
    random:[],
    special:[],
    top:[]
  };
}

function specialLabel(key){
  return{
    same:'Cùng số',
    even:'Chẵn',
    odd:'Lẻ',
    tai:'Tài',
    xiu:'Xỉu'
  }[key]||key;
}

function smartQuickHtml(){
  const profile=quickProfileConfig();
  const values=quickRangeValues();
  const selectedSet=new Set(state.numbers);

  const randomButtons=profile.random
    .map(number=>`
      <button data-smart="random:${number}">
        ${number} số
      </button>
    `)
    .join('');

  const specialButtons=profile.special
    .map(key=>`
      <button data-smart="${key}">
        ${specialLabel(key)}
      </button>
    `)
    .join('');

  const topButtons=profile.top
    .map(number=>`
      <button data-smart="top:${number}">
        Top ${number}
      </button>
    `)
    .join('');

  const grid=values
    .map(value=>{
      const badge=frequencyBadge(value);
      const red=badge<=1?' red':'';

      return`
        <button
          class="smart-number ${
            selectedSet.has(value)?'active':''
          }"
          data-number="${value}"
        >
          <span>${value}</span>
          <i class="smart-stat${red}">${badge}</i>
        </button>
      `;
    })
    .join('');

  return`
    <div class="smart-quick-layout">
      <aside class="smart-quick-side">
        <button
          class="smart-range"
          data-smart="next-range"
        >
          ${quickRangeLabel()}
          <i>${state.numbers.length}</i>
        </button>

        ${
          randomButtons
            ? `
              <section>
                <p>Ngẫu Nhiên</p>
                <div>${randomButtons}</div>
              </section>
            `
            : ''
        }

        ${
          specialButtons
            ? `
              <section>
                <p>Đặc biệt</p>
                <div>${specialButtons}</div>
              </section>
            `
            : ''
        }

        ${
          topButtons
            ? `
              <section>
                <p>Ít Xuất Hiện</p>
                <div>${topButtons}</div>
              </section>
            `
            : ''
        }
      </aside>

      <div class="smart-grid-panel">
        <div class="smart-grid">
          ${grid}
        </div>
      </div>
    </div>
  `;
}

function smartPick(action){
  const values=quickRangeValues();

  if(action==='next-range'){
    if(quickPageCount()>1){
      state.quickPage=
        (state.quickPage+1)%quickPageCount();

      state.numbers=[];
    }
  }else if(action.startsWith('random:')){
    const count=
      Number(action.split(':')[1]);

    state.numbers=
      randomSample(values,count);
  }else if(action==='same'){
    state.numbers=values.filter(value=>
      new Set(value.split('')).size===1
    );
  }else if(action==='even'){
    state.numbers=values.filter(value=>
      Number(value)%2===0
    );
  }else if(action==='odd'){
    state.numbers=values.filter(value=>
      Number(value)%2===1
    );
  }else if(action==='tai'){
    state.numbers=values.filter(value=>
      Number(value)>=
      Math.pow(10,quickWidth())/2
    );

    if(!state.numbers.length){
      state.numbers=
        values.filter((_,index)=>index>=50);
    }
  }else if(action==='xiu'){
    state.numbers=values.filter(value=>
      Number(value)<
      Math.pow(10,quickWidth())/2
    );

    if(
      state.numbers.length===values.length&&
      values.length===100
    ){
      state.numbers=values.slice(0,50);
    }
  }else if(action.startsWith('top:')){
    const count=
      Number(action.split(':')[1]);

    state.numbers=[...values]
      .sort((a,b)=>
        frequencyBadge(a)-frequencyBadge(b)
      )
      .slice(0,count);
  }

  renderSelection();
  updateSummary();
}

function showDigitHotColdStats(){
  return(
    state.mode==='digits'&&
    [
      'danh_de',
      'ba_cang',
      'bon_cang'
    ].includes(state.game)
  );
}

function digitHotColdStat(row,digit){
  const now=new Date();

  const gameSalt={
    danh_de:17,
    ba_cang:31,
    bon_cang:47
  }[state.game]||7;

  const seed=Math.abs(
    gameSalt*97+
    (row+1)*53+
    digit*29+
    now.getDate()*11+
    (now.getMonth()+1)*17+
    now.getFullYear()*3
  );

  if(seed%13===0){
    return 0;
  }

  if(seed%17===0){
    return 1;
  }

  return(
    2+
    (
      (
        seed*7+
        row*digit*3
      )%48
    )
  );
}
function digitStatClass(value){
  if(value<=1){
    return'red';
  }

  if(value>=10){
    return'blue';
  }

  return'gray';
}

function digitRowsHtml(){
  const withStats=
    showDigitHotColdStats();

  return rowLabels()
    .map((label,row)=>`
      <div class="digit-row ${
        withStats?'has-hotcold-stats':''
      }">
        <div class="row-label">
          ${label}
        </div>

        <div class="digit-list">
          ${
            Array.from(
              {length:10},
              (_,digit)=>{
                const stat=
                  withStats
                    ? digitHotColdStat(row,digit)
                    : null;

                return`
                  <div class="digit-cell">
                    <button
                      class="digit-btn ${
                        state.rows[row]?.includes(digit)
                          ? 'active'
                          : ''
                      }"
                      data-digit="${digit}"
                      data-row="${row}"
                    >
                      ${digit}
                    </button>

                    ${
                      withStats
                        ? `
                          <span class="
                            digit-hotcold-stat
                            ${digitStatClass(stat)}
                          ">
                            ${stat}
                          </span>
                        `
                        : ''
                    }
                  </div>
                `;
              }
            ).join('')
          }
        </div>

        <div class="quick-actions">
          ${
            [
              ['all','Toàn bộ'],
              ['tai','Tài'],
              ['xiu','Xỉu'],
              ['odd','Lẻ'],
              ['even','Chẵn'],
              ['clear','Xóa']
            ]
              .map(item=>`
                <button
                  data-q="${item[0]}"
                  data-row="${row}"
                >
                  ${item[1]}
                </button>
              `)
              .join('')
          }
        </div>
      </div>
    `)
    .join('');
}

function loXienHtml(){
  const full=
    state.numbers.length>=cfg().pick;

  return`
    <div class="loxien-layout">
      <aside class="loxien-side">
        <button
          class="loxien-range"
          data-lx="clear"
        >
          00 - 99
          <i>${state.numbers.length}</i>
        </button>

        <p>Ngẫu Nhiên</p>

        <button
          class="loxien-random"
          data-lx="random"
        >
          1 số
        </button>
      </aside>

      <div class="loxien-grid-panel">
        <div class="loxien-grid">
          ${
            Array.from(
              {length:100},
              (_,index)=>{
                const number=
                  String(index).padStart(2,'0');

                const badge=
                  frequencyBadge(number,'xien');

                const active=
                  state.numbers.includes(number);

                const locked=
                  full&&!active;

                return`
                  <button
                    class="
                      loxien-number
                      ${active?'active':''}
                      ${locked?'locked':''}
                    "
                    data-number="${number}"
                    ${locked?'disabled':''}
                  >
                    <span>${number}</span>

                    <i class="${badge<=1?'red':''}">
                      ${badge}
                    </i>
                  </button>
                `;
              }
            ).join('')
          }
        </div>
      </div>
    </div>
  `;
}

function quickHtml(){
  if(state.game==='lo_xien'){
    return loXienHtml();
  }

  if(
    [
      'bao_lo',
      'danh_de',
      'ba_cang'
    ].includes(state.game)
  ){
    return smartQuickHtml();
  }

  return digitRowsHtml();
}

function renderSelection(){
  const box=el('selectionArea');

  if(state.mode==='manual'){
    const width=
      state.game==='lo_xien'
        ? 2
        : cfg().digits||2;

    const example=
      width===1
        ? '1, 3, 7'
        : width===2
          ? '12, 34, 56'
          : width===3
            ? '123, 456'
            : '1234, 5678';

    box.innerHTML=`
      <div class="manual-box">
        <label>
          Nhập ${width} chữ số, ngăn cách bằng
          dấu phẩy
        </label>

        <textarea
          id="manualInput"
          inputmode="decimal"
          autocomplete="off"
          spellcheck="false"
          placeholder="Ví dụ: ${example}"
        ></textarea>

        <div class="manual-note">
          ${
            state.game==='lo_xien'
              ? `
                ${cfg().label} cần nhập đúng
                ${cfg().pick} số khác nhau,
                mỗi số gồm 2 chữ số.
              `
              : `
                Chỉ các số đúng ${width}
                chữ số mới được tính.
              `
          }
        </div>
      </div>
    `;
  }else if(state.game==='lo_xien'){
    box.innerHTML=loXienHtml();
  }else if(state.mode==='quick'){
    box.innerHTML=quickHtml();
  }else{
    box.innerHTML=digitRowsHtml();
  }

  box
    .querySelectorAll('[data-digit]')
    .forEach(button=>{
      button.onclick=()=>toggleDigit(
        Number(button.dataset.row),
        Number(button.dataset.digit)
      );
    });

  box
    .querySelectorAll('[data-q]')
    .forEach(button=>{
      button.onclick=()=>quickRow(
        Number(button.dataset.row),
        button.dataset.q
      );
    });

  box
    .querySelectorAll('[data-number]')
    .forEach(button=>{
      button.onclick=()=>
        toggleNumber(button.dataset.number);
    });

  box
    .querySelectorAll('[data-lx]')
    .forEach(button=>{
      button.onclick=()=>{
        if(button.dataset.lx==='clear'){
          state.numbers=[];
        }else{
          const limit=cfg().pick;

          if(state.numbers.length>=limit){
            state.numbers.shift();
          }

          let number;

          do{
            number=
              String(
                Math.floor(Math.random()*100)
              ).padStart(2,'0');
          }while(state.numbers.includes(number));

          state.numbers.push(number);
        }

        renderSelection();
        updateSummary();
      };
    });

  box
    .querySelectorAll('[data-smart]')
    .forEach(button=>{
      button.onclick=()=>
        smartPick(button.dataset.smart);
    });

  el('manualInput')?.addEventListener(
    'input',
    event=>{
      const textarea=event.currentTarget;
      const rawValue=textarea.value;
      const rawCaret=textarea.selectionStart??rawValue.length;

      const formatValue=value=>
        value
          .replace(/[^0-9,]/g,'')
          .replace(/,+/g,',')
          .replace(/,/g,', ');

      const formatted=formatValue(rawValue);
      const caret=formatValue(
        rawValue.slice(0,rawCaret)
      ).length;

      if(rawValue!==formatted){
        textarea.value=formatted;
        textarea.setSelectionRange(caret,caret);
      }

      updateSummary();
    }
  );
}

function updateSummary(options={}){
  const numbers=selected();
  const amount=selectionCost(numbers);

  el('selectedCount').textContent=
    numbers.length;

  el('selectedMoney').textContent=
    fmt(amount);

  el('mSelectedCount').textContent=
    numbers.length;

  el('mMoney').textContent=
    fmt(amount);

  if(!options.preserveMobileMultiplier){
    el('mMultiplier').value=
      multiplier();
  }

  el('mBalance').textContent=
    fmt(user()?.balance||0);

  document
    .querySelectorAll('[data-chip]')
    .forEach(button=>{
      button.classList.toggle(
        'active',
        Number(button.dataset.chip)===multiplier()
      );
    });
}
function makeDraft(){
  const numbers=selected();

  if(!numbers.length){
    toast('Bạn chưa chọn số.',true);
    return null;
  }

  if(
    state.game==='lo_xien'&&
    numbers.length!==cfg().pick
  ){
    toast(
      `${cfg().label} cần chọn đủ ${cfg().pick} số.`,
      true
    );

    return null;
  }

  const multiply=multiplier();
  const total=selectionCost(numbers);

  const stake=
    state.game==='lo_xien'
      ? Number(cfg().ticketStake||1000)
      : unitStake();

  const ratio=oddsRatio();

  const payoutBaseStake=
    Number(
      cfg().payoutBaseStake||
      PAYOUT_BASE_STAKE
    );

  return{
    id:
      `D${Date.now()}`+
      `${Math.random().toString(36).slice(2,5)}`,

    game:state.game,
    gameTitle:GAME[state.game].title,
    subId:cfg().id,
    subTitle:cfg().label,
    numbers,
    count:state.game==='lo_xien'?1:numbers.length,
    selectedCount:numbers.length,
    multiplier:multiply,
    unitStake:stake,
    payoutBaseStake,
    oddsRatio:ratio,
    total,

    displayWin:Math.round(
      payoutBaseStake*
      multiply*
      ratio
    )
  };
}

function addDraft(){
  const draft=makeDraft();

  if(!draft){
    return;
  }

  state.drafts.push(draft);

  resetSelections();
  renderDrafts();

  toast('Đã thêm vào nội dung cược.');
}

function renderDrafts(){
  const body=el('draftBody');

  if(!state.drafts.length){
    body.innerHTML='';
    el('draftEmpty').style.display='grid';
  }else{
    el('draftEmpty').style.display='none';

    body.innerHTML=state.drafts
      .map((draft,index)=>`
        <tr>
          <td>${esc(draft.subTitle)}</td>
          <td>${esc(draft.numbers.join(', '))}</td>
          <td>${draft.count}</td>
          <td>${draft.multiplier}</td>
          <td>${fmt(draft.total)}</td>
          <td>${fmt(draft.displayWin)}</td>

          <td>
            <button
              class="remove-line"
              data-remove="${index}"
            >
              Xóa
            </button>
          </td>
        </tr>
      `)
      .join('');

    body
      .querySelectorAll('[data-remove]')
      .forEach(button=>{
        button.onclick=()=>{
          state.drafts.splice(
            Number(button.dataset.remove),
            1
          );

          renderDrafts();
        };
      });
  }

  el('draftTotal').textContent=
    fmt(
      state.drafts.reduce(
        (sum,draft)=>sum+draft.total,
        0
      )
    );
}

function placeDrafts(drafts){
  if(!requireLogin()){
    return false;
  }

  if(!drafts.length){
    toast('Không có nội dung cược.',true);
    return false;
  }

  const total=drafts.reduce(
    (sum,draft)=>sum+draft.total,
    0
  );

  const database=getDb();
  const currentUser=database.users[username()];

  if(!currentUser){
    openAuth('login');
    toast('Vui lòng đăng nhập trước khi đặt cược.',true);
    return false;
  }

  if(Number(currentUser.balance)<=0){
    toast('Số dư không đủ. Nạp ngay nhận ưu đãi khủng!',true);
    return false;
  }

  if(Number(currentUser.balance)<total){
    const missing=total-Number(currentUser.balance);

    toast(
      `Số dư không đủ. Bạn còn thiếu ${fmt(missing)} VND.`,
      true
    );

    return false;
  }

  currentUser.balance-=total;
  /*
   * =========================================================
   * CẬP NHẬT ĐIỀU KIỆN VÒNG CƯỢC ĐỂ RÚT TIỀN
   *
   * Ví dụ:
   * Nạp 1.000.000
   * → phải cược đủ tổng cộng 1.000.000
   *
   * Tiền thắng / tiền bonus KHÔNG làm tăng
   * số tiền phải cược.
   * =========================================================
   */
  
  currentUser.withdrawTurnoverRequired=
    Number(
      currentUser.withdrawTurnoverRequired||0
    );
  
  currentUser.withdrawTurnoverCompleted=
    Number(
      currentUser.withdrawTurnoverCompleted||0
    );
  
  
  const turnoverRemaining=
    Math.max(
      0,
      currentUser.withdrawTurnoverRequired-
      currentUser.withdrawTurnoverCompleted
    );
  
  
  /*
   * Chỉ tính phần cược còn cần thiết.
   *
   * Ví dụ:
   * còn cần cược 200k
   * nhưng vé này cược 500k
   * → chỉ cộng tiến độ thêm 200k.
   *
   * 300k dư KHÔNG để dành cho lần nạp sau.
   */
  const turnoverApplied=
    Math.min(
      total,
      turnoverRemaining
    );
  
  
  currentUser.withdrawTurnoverCompleted+=
    turnoverApplied;

  
  const drawDate=nextDrawDate();
  const createdAt=new Date().toISOString();

  for(const draft of drafts){
    database.bets.push({
      id:
        `B${Date.now()}`+
        `${Math.random().toString(36).slice(2,6)}`,

      username:currentUser.username,
      drawDate,
      draw:`MB-${drawDate}`,
      createdAt,
      gameKey:draft.game,
      game:draft.gameTitle,
      subId:draft.subId,
      sub:draft.subTitle,
      numbers:draft.numbers,
      count:draft.count,
      selectedCount:draft.selectedCount,
      multiplier:draft.multiplier,
      unitStake:draft.unitStake,
      payoutBaseStake:draft.payoutBaseStake,
      oddsRatio:draft.oddsRatio,
      total:draft.total,
      valid:draft.total,
      status:'pending',
      payout:0,
      result:0
    });
  }

  saveDb(database);
  renderAll();

  toast(
    'Đã ghi vé vào Hồ sơ cá cược và Chờ kết quả.'
  );

  return true;
}

function instantBet(){
  const draft=makeDraft();

  if(
    draft&&
    placeDrafts([draft])
  ){
    resetSelections();
  }
}

function submitDrafts(){
  if(placeDrafts(state.drafts)){
    state.drafts=[];
    renderDrafts();
  }
}

function parseDateText(text){
  const match=String(text).match(
    /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/
  );

  return match
    ? (
      `${match[3]}-`+
      `${match[2].padStart(2,'0')}-`+
      `${match[1].padStart(2,'0')}`
    )
    : null;
}

function prizeCells(){
  const root=el('box_kqxs_minhngoc');

  if(!root){
    return[];
  }

  return[
    'giaidb',
    'giai1',
    'giai2',
    'giai3',
    'giai4',
    'giai5',
    'giai6',
    'giai7'
  ]
    .map(className=>
      root.querySelector(`.${className}`)
    )
    .filter(Boolean);
}

function numbersFrom(cell){
  if(!cell){
    return[];
  }

  const cellConfig=[
    ['giaidb','db'],
    ['giai1','g1'],
    ['giai2','g2'],
    ['giai3','g3'],
    ['giai4','g4'],
    ['giai5','g5'],
    ['giai6','g6'],
    ['giai7','g7']
  ].find(([className])=>
    cell.classList.contains(className)
  );

  if(!cellConfig){
    return(
      (cell.textContent||'')
        .match(/\d{2,5}/g)||
      []
    );
  }

  const key=cellConfig[1];
  const digitsPerNumber=PRIZE_DIGITS[key];
  const expectedCount=PRIZE_COUNTS[key];

  const digitStream=(cell.textContent||'')
    .replace(/\D/g,'');

  const availableCount=Math.min(
    expectedCount,
    Math.floor(
      digitStream.length/digitsPerNumber
    )
  );

  return Array.from(
    {length:availableCount},
    (_,index)=>
      digitStream.slice(
        index*digitsPerNumber,
        (index+1)*digitsPerNumber
      )
  );
}

function isCompleteNorthernResult(prizes){
  return Object
    .keys(PRIZE_COUNTS)
    .every(key=>{
      const values=prizes?.[key]||[];

      return(
        values.length===PRIZE_COUNTS[key]&&
        values.every(value=>
          new RegExp(
            `^\\d{${PRIZE_DIGITS[key]}}$`
          ).test(value)
        )
      );
    });
}
function processMinhNgoc(){
  const root=el('box_kqxs_minhngoc');

  if(!root){
    return false;
  }

  const cells=prizeCells();

  if(cells.length!==8){
    return false;
  }

  root
    .querySelectorAll('.thu,.ngay')
    .forEach(cell=>{
      cell
        .closest('tr')
        ?.classList.add('date-row-hidden');
    });

  for(const cell of cells){
    const numbers=numbersFrom(cell);

    const signature=
      numbers.join('|');

    if(cell.dataset.renderSig!==signature){
      cell.dataset.renderSig=signature;

      cell.innerHTML=numbers
        .map((number,index)=>{
          const prefix=
            number.length>2
              ? number.slice(0,-2)
              : '';

          const tail=
            number.slice(-2);

          const piece=`
            <span class="result-number">
              ${prefix}
              <span class="result-tail">
                ${tail}
              </span>
            </span>
          `;

          return index===numbers.length-1
            ? piece
            : (
              `${piece}`+
              '<span class="result-sep">-</span>'
            );
        })
        .join('');
    }
  }

  const parsedSourceDate=
    parseDateText(
      root.querySelector('.ngay')?.textContent||
      root.textContent
    );

  const date=
    parsedSourceDate||
    localDateKey(new Date());

  const db=
    numbersFrom(
      root.querySelector('.giaidb')
    )[0]||'';

  const all=
    cells.flatMap(numbersFrom);

  const last2=
    all.map(number=>number.slice(-2));

  const prizeKeys=[
    'db',
    'g1',
    'g2',
    'g3',
    'g4',
    'g5',
    'g6',
    'g7'
  ];

  const prizes={};

  cells.forEach((cell,index)=>{
    prizes[prizeKeys[index]]=
      numbersFrom(cell);
  });

  state.lastResult={
    date,
    db,
    all,
    last2,
    prizes,
    sourceDateDetected:Boolean(parsedSourceDate)
  };

  el('resultDate').textContent=
    displayDate(date);

  el('sideDate').textContent=
    displayDate(date);

  el('sideDrawDate').textContent=
    displayDate(date);

  if(db){
    const balls=db
      .slice(-5)
      .padStart(5,'0')
      .split('')
      .map((digit,index)=>`
        <span class="${index>=3?'orange':''}">
          ${digit}
        </span>
      `)
      .join('');

    el('heroBalls').innerHTML=balls;
    el('mobileBalls').innerHTML=balls;

    renderDbTags(db);
  }

  renderHeadTail(last2);
  renderMobileResults();

  document
    .querySelector('.result-column')
    ?.classList.add('results-ready');

  if(
    state.lastResult.sourceDateDetected&&
    isCompleteNorthernResult(
      state.lastResult.prizes
    )
  ){
    settleWithActualResult();
  }

  return true;
}

function renderDbTags(db){
  const last2=db.slice(-2);
  const number=Number(last2);

  const size=
    Number(last2[0])<5
      ? 'Xỉu'
      : 'Tài';

  const parity=
    number%2
      ? 'Lẻ'
      : 'Chẵn';

  const zodiac=[
    'Tý',
    'Sửu',
    'Dần',
    'Mão',
    'Thìn',
    'Tỵ',
    'Ngọ',
    'Mùi',
    'Thân',
    'Dậu',
    'Tuất',
    'Hợi'
  ][number%12];

  el('dbTags').innerHTML=`
    <span>${size}</span>
    <span>${parity}</span>
    <span>${zodiac}</span>
  `;
}

function renderHeadTail(last2=[]){
  const groups=
    Array.from(
      {length:10},
      ()=>[]
    );

  last2.forEach(pair=>{
    if(/^\d{2}$/.test(pair)){
      groups[Number(pair[0])]
        .push(pair[1]);
    }
  });

  el('headTail').innerHTML=groups
    .map((tails,index)=>`
      <div>
        <span>${index}</span>
        <span>
          ${tails.length?tails.join(','):'—'}
        </span>
      </div>
    `)
    .join('');
}

function renderMobileResults(){
  const result=state.lastResult;

  if(!result){
    el('mobileResultsBody').innerHTML=
      '<div class="mobile-card">Chưa tải được kết quả.</div>';

    return;
  }

  const labels=[
    'Giải ĐB',
    'Giải nhất',
    'Giải nhì',
    'Giải ba',
    'Giải tư',
    'Giải năm',
    'Giải sáu',
    'Giải bảy'
  ];

  const rows=prizeCells()
    .map((cell,index)=>`
      <tr>
        <td>${labels[index]}</td>
        <td>
          ${esc(numbersFrom(cell).join(' - '))}
        </td>
      </tr>
    `)
    .join('');

  el('mobileResultsBody').innerHTML=`
    <div class="mobile-card">
      <b>
        Miền Bắc — ${displayDate(result.date)}
      </b>
    </div>

    <table class="mobile-result-table">
      ${rows}
    </table>
  `;
}

function installResultObserver(){
  const root=el('box_kqxs_minhngoc');

  if(!root){
    return;
  }

  let lock=false;

  const run=()=>{
    if(lock){
      return;
    }

    lock=true;

    requestAnimationFrame(()=>{
      lock=false;
      processMinhNgoc();
    });
  };

  new MutationObserver(run).observe(
    root,
    {
      subtree:true,
      childList:true,
      characterData:true
    }
  );

  let tries=0;

  const timer=setInterval(()=>{
    const loaded=processMinhNgoc();

    tries++;

    if(loaded&&tries>10){
      clearInterval(timer);
    }

    if(tries===15&&!loaded){
      el('resultLoading').textContent=
        'Chưa tải được KQXS. Hãy kiểm tra Internet hoặc trình chặn script.';
    }

    if(tries>120){
      clearInterval(timer);
    }
  },1000);

  run();
}

function calculatePayout(bet,winningUnits){
  if(!winningUnits){
    return 0;
  }

  const payoutBaseStake=
    Number(
      bet.payoutBaseStake||
      PAYOUT_BASE_STAKE
    );

  const ratio=
    Number(bet.oddsRatio||1);

  const multiply=
    Number(bet.multiplier||1);

  return Math.round(
    winningUnits*
    payoutBaseStake*
    multiply*
    ratio
  );
}
function winningUnitsForBet(bet,result){
  const db=result.db||'';

  const selectedNumbers=
    (bet.numbers||[]).map(String);

  const prizes=result.prizes||{};
  const all=result.all||[];

  if(bet.gameKey==='lo_xien'){
    const requiredPicks={
      xien2:2,
      xien3:3,
      xien4:4
    };

    const required=
      requiredPicks[bet.subId]||
      selectedNumbers.length;

    if(selectedNumbers.length!==required){
      return 0;
    }

    const resultSet=
      new Set(result.last2||[]);

    return selectedNumbers.every(number=>
      resultSet.has(number)
    )
      ? 1
      : 0;
  }

  if(bet.gameKey==='bao_lo'){
    let targets=[];

    if(
      bet.subId==='lo2'||
      bet.subId==='lo2_1k'
    ){
      targets=all.map(number=>
        number.slice(-2)
      );
    }

    else if(bet.subId==='lo2dau'){
      targets=[
        ...(prizes.db||[]),
        ...(prizes.g1||[]),
        ...(prizes.g2||[]),
        ...(prizes.g3||[]),
        ...(prizes.g4||[]),
        ...(prizes.g5||[]),
        ...(prizes.g6||[])
      ].map(number=>
        number.slice(0,2)
      );
    }

    else if(bet.subId==='lo3'){
      targets=[
        ...(prizes.db||[]),
        ...(prizes.g1||[]),
        ...(prizes.g2||[]),
        ...(prizes.g3||[]),
        ...(prizes.g4||[]),
        ...(prizes.g5||[]),
        ...(prizes.g6||[])
      ].map(number=>
        number.slice(-3)
      );
    }

    else if(bet.subId==='lo4'){
      targets=[
        ...(prizes.db||[]),
        ...(prizes.g1||[]),
        ...(prizes.g2||[]),
        ...(prizes.g3||[]),
        ...(prizes.g4||[]),
        ...(prizes.g5||[])
      ].map(number=>
        number.slice(-4)
      );
    }

    return targets.filter(target=>
      selectedNumbers.includes(target)
    ).length;
  }

  if(bet.gameKey==='danh_de'){
    let targets=[];

    if(bet.subId==='de_db'){
      targets=[
        db.slice(-2)
      ];
    }else if(bet.subId==='de_dau_db'){
      targets=[
        db.slice(0,2)
      ];
    }else if(bet.subId==='de_giai7'){
      targets=(prizes.g7||[])
        .map(number=>
          number.slice(-2)
        );
    }else if(bet.subId==='de_giai1'){
      const firstPrize=
        (prizes.g1||[])[0]||'';

      targets=[
        firstPrize.slice(-2)
      ];
    }else if(bet.subId==='de_dau_giai1'){
      const firstPrize=
        (prizes.g1||[])[0]||'';

      targets=[
        firstPrize.slice(0,2)
      ];
    }

    return targets.filter(target=>
      selectedNumbers.includes(target)
    ).length;
  }

  if(bet.gameKey==='dau_duoi'){
    const lastTwoDigits=
      db.slice(-2);

    const target=
      bet.subId==='dau'
        ? lastTwoDigits.slice(0,1)
        : lastTwoDigits.slice(-1);

    return selectedNumbers.includes(target)
      ? 1
      : 0;
  }

  if(bet.gameKey==='ba_cang'){
    const firstPrize=
      (prizes.g1||[])[0]||'';

    let targets=[];

    if(bet.subId==='3c_db'){
      targets=[
        db.slice(-3)
      ];
    }else if(bet.subId==='3c_giai1'){
      targets=[
        firstPrize.slice(-3)
      ];
    }else if(bet.subId==='3c_dau_duoi'){
      targets=[
        db.slice(0,3),
        db.slice(-3)
      ].filter(Boolean);
    }else if(bet.subId==='3c_dau'){
      targets=[
        db.slice(0,3)
      ];
    }

    return targets.filter(target=>
      selectedNumbers.includes(target)
    ).length;
  }

  if(bet.gameKey==='bon_cang'){
    const target=
      db.slice(-4);

    return selectedNumbers.includes(target)
      ? 1
      : 0;
  }

  return 0;
}

function settleWithActualResult(){
  const result=state.lastResult;

  if(
    !result||
    !result.sourceDateDetected||
    !isCompleteNorthernResult(result.prizes)
  ){
    return false;
  }

  const database=getDb();
  let changed=false;

  for(const bet of database.bets){
    if(bet.status!=='pending'){
      continue;
    }

    if(bet.drawDate!==result.date){
      continue;
    }

    const winningUnits=
      winningUnitsForBet(bet,result);

    const won=winningUnits>0;

    bet.status=won?'win':'lose';
    bet.winningUnits=winningUnits;

    bet.payout=calculatePayout(
      bet,
      winningUnits
    );

    bet.result=
      bet.payout-
      Number(bet.total||0);

    bet.settledAt=
      new Date().toISOString();

    bet.settlementVersion=3;
    bet.settlementResultDate=result.date;
    bet.resultDb=result.db;

    bet.resultSnapshot=
      JSON.parse(
        JSON.stringify(result.prizes)
      );

    if(
      won&&
      database.users[bet.username]
    ){
      database.users[bet.username].balance+=
        bet.payout;
    }

    changed=true;
  }

  if(changed){
    saveDb(database);

    renderAccount();
    renderHistory();
    renderDrawerCounts();

    if(
      el('mobileRecords')&&
      el('mobileRecords').classList.contains('open')
    ){
      renderMobileRecords(
        state.mobileFilter||'all',
        el('mobileRecordsTitle').textContent||
        'Hồ sơ cá cược'
      );
    }
  }

  return changed;
}

function renderHistory(){
  const currentUsername=username();
  const body=el('historyBody');

  if(!currentUsername){
    body.innerHTML='';
    el('historyEmpty').style.display='grid';
    return;
  }

  let bets=getDb().bets.filter(bet=>
    bet.username===currentUsername
  );

  if(state.historyFilter==='pending'){
    bets=bets.filter(bet=>
      bet.status==='pending'
    );
  }

  if(state.historyFilter==='settled'){
    bets=bets.filter(bet=>
      bet.status!=='pending'
    );
  }

  bets.reverse();

  if(!bets.length){
    body.innerHTML='';
    el('historyEmpty').style.display='grid';
    return;
  }

  el('historyEmpty').style.display='none';

  body.innerHTML=bets
    .map(bet=>`
      <tr>
        <td>Miền Bắc</td>

        <td>
          ${esc(bet.draw)}
        </td>

        <td>
          ${esc(bet.id)}
        </td>

        <td>
          ${
            new Date(bet.createdAt)
              .toLocaleString('vi-VN')
          }
        </td>

        <td>
          ${esc(bet.sub)}
        </td>

        <td>
          ${esc(bet.numbers.join(', '))}
        </td>

        <td>
          ${bet.count}
        </td>

        <td>
          ${bet.multiplier}
        </td>

        <td>
          ${fmt(bet.total)}
        </td>

        <td>
          ${fmt(bet.valid)}
        </td>

        <td class="${
          bet.status==='win'
            ? 'status-win'
            : bet.status==='lose'
              ? 'status-lose'
              : ''
        }">
          ${
            bet.status==='pending'
              ? '—'
              : (
                `${bet.result>=0?'+':''}`+
                `${fmt(bet.result)}`
              )
          }
        </td>

        <td class="${
          bet.status==='pending'
            ? 'status-pending'
            : bet.status==='win'
              ? 'status-win'
              : 'status-lose'
        }">
          ${
            bet.status==='pending'
              ? 'Chờ mở thưởng'
              : 'Đã thanh toán'
          }
        </td>
      </tr>
    `)
    .join('');
}

function renderDrawerCounts(){
  const currentUsername=username();

  const bets=currentUsername
    ? getDb().bets.filter(bet=>
      bet.username===currentUsername
    )
    : [];

  el('pendingCountDrawer').textContent=
    bets.filter(bet=>
      bet.status==='pending'
    ).length;

  el('settledCount').textContent=
    bets.filter(bet=>
      bet.status!=='pending'
    ).length;
}
function renderMobileRecords(
  filter='all',
  title='Hồ sơ cá cược'
){
  state.mobileFilter=filter;

  const currentUsername=username();

  let bets=currentUsername
    ? getDb().bets.filter(bet=>
      bet.username===currentUsername
    )
    : [];

  if(filter==='pending'){
    bets=bets.filter(bet=>
      bet.status==='pending'
    );
  }

  if(filter==='settled'){
    bets=bets.filter(bet=>
      bet.status!=='pending'
    );
  }

  bets.reverse();

  el('mobileRecordsTitle').textContent=title;

  if(!currentUsername){
    el('mobileRecordsList').innerHTML=`
      <div class="mobile-card">
        Hãy đăng nhập để xem dữ liệu.
      </div>
    `;
  }else if(!bets.length){
    el('mobileRecordsList').innerHTML=`
      <div class="mobile-card">
        Không có dữ liệu.
      </div>
    `;
  }else{
    el('mobileRecordsList').innerHTML=
      bets.map(bet=>`
        <article class="mobile-card">
          <div class="line">
            <b>${esc(bet.sub)}</b>

            <span class="${
              bet.status==='pending'
                ? 'status-pending'
                : bet.status==='win'
                  ? 'status-win'
                  : 'status-lose'
            }">
              ${
                bet.status==='pending'
                  ? 'Chờ kết quả'
                  : bet.status==='win'
                    ? 'Thắng'
                    : 'Thua'
              }
            </span>
          </div>

          <div class="line">
            <span>Lượt xổ</span>
            <b>${esc(bet.draw)}</b>
          </div>

          <div class="line">
            <span>Nội dung</span>
            <b>${esc(bet.numbers.join(', '))}</b>
          </div>

          <div class="line">
            <span>Tiền cược</span>
            <b>${fmt(bet.total)} VND</b>
          </div>

          ${
            bet.status!=='pending'
              ? `
                <div class="line">
                  <span>Thắng/thua</span>

                  <b class="${
                    bet.status==='win'
                      ? 'status-win'
                      : 'status-lose'
                  }">
                    ${
                      bet.result>=0?'+':''
                    }${fmt(bet.result)} VND
                  </b>
                </div>
              `
              : ''
          }

          <div class="line">
            <span>Thời gian</span>

            <span>
              ${
                new Date(bet.createdAt)
                  .toLocaleString('vi-VN')
              }
            </span>
          </div>
        </article>
      `).join('');
  }

  el('mobileRecords').classList.add('open');
}

function openDrawer(){
  el('mobileDrawer').classList.add('open');
  el('drawerBackdrop').classList.add('open');

  renderAccount();
}

function closeDrawer(){
  el('mobileDrawer').classList.remove('open');
  el('drawerBackdrop').classList.remove('open');
}

function renderMobileGameMenu(){
  const menu=el('mobileGameMenu');

  const order=[
    'bao_lo',
    'lo_xien',
    'danh_de',
    'dau_duoi',
    'ba_cang',
    'bon_cang'
  ];

  const sections=order
    .map(gameKey=>{
      const game=GAME[gameKey];

      if(!game){
        return'';
      }

      const items=game.subs
        .map((sub,index)=>`
          <button
            data-mgame="${gameKey}"
            data-msub="${index}"
            class="
              mobile-game-option
              ${
                state.game===gameKey&&
                state.sub===index
                  ? 'active'
                  : ''
              }
            "
          >
            ${sub.label}
          </button>
        `)
        .join('');

      return`
        <section class="mobile-game-group">
          <h3>${game.title}</h3>

          <div class="mobile-game-option-grid">
            ${items}
          </div>
        </section>
      `;
    })
    .join('');

  menu.innerHTML=`
    <div class="mobile-game-shell">
      <div
        class="mobile-game-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Danh sách trò chơi"
      >
        <div class="mobile-game-dialog-title">
          Danh sách trò chơi
        </div>

        <div class="mobile-game-dialog-body">
          <aside class="mobile-game-category">
            <span>Cổ điển</span>
          </aside>

          <div class="mobile-game-groups">
            ${sections}
          </div>
        </div>
      </div>

      <button
        type="button"
        class="mobile-game-close"
        data-close-game-menu
        aria-label="Đóng"
      >
        ×
      </button>
    </div>
  `;

  menu
    .querySelectorAll('[data-mgame]')
    .forEach(button=>{
      button.onclick=()=>{
        state.game=button.dataset.mgame;
        state.sub=Number(button.dataset.msub);

        state.mode=
          defaultModeForGame(state.game);

        state.quickPage=0;
        state.rows=[];
        state.numbers=[];

        document
          .querySelectorAll(
            '#gameTabs [data-game]'
          )
          .forEach(tab=>{
            tab.classList.toggle(
              'active',
              tab.dataset.game===state.game
            );
          });

        menu.classList.remove('open');

        renderSubTabs();
        renderMeta();
        resetSelections();
      };
    });

  menu
    .querySelector('[data-close-game-menu]')
    ?.addEventListener(
      'click',
      ()=>menu.classList.remove('open')
    );

  menu.onclick=event=>{
    if(event.target===menu){
      menu.classList.remove('open');
    }
  };
}

function clockTick(){
  const now=new Date();
  const todayKey=localDateKey(now);

  const todayCutoff=new Date(now);
  todayCutoff.setHours(18,15,0,0);

  const nextCountdownAt=new Date(now);
  nextCountdownAt.setHours(19,30,0,0);

  if(now<todayCutoff){
    const totalSeconds=Math.max(
      0,
      Math.floor(
        (todayCutoff-now)/1000
      )
    );

    const hours=
      String(
        Math.floor(totalSeconds/3600)
      ).padStart(2,'0');

    const minutes=
      String(
        Math.floor(
          totalSeconds%3600/60
        )
      ).padStart(2,'0');

    const seconds=
      String(
        totalSeconds%60
      ).padStart(2,'0');

    const characters=
      (hours+minutes+seconds).split('');

    const html=
      `<b>${characters[0]}</b>`+
      `<b>${characters[1]}</b>`+
      `<em>:</em>`+
      `<b>${characters[2]}</b>`+
      `<b>${characters[3]}</b>`+
      `<em>:</em>`+
      `<b>${characters[4]}</b>`+
      `<b>${characters[5]}</b>`;

    el('countdown')
      .classList.remove('preparing');

    el('mobileCountdown')
      .classList.remove('preparing');

    el('countdown').innerHTML=html;
    el('mobileCountdown').innerHTML=html;

    el('deadlineText').textContent=
      `Kỳ tiếp theo ${displayDate(todayKey)}`;

    el('mobileDrawDate').textContent=
      displayDate(todayKey);
  }else if(now<nextCountdownAt){
    el('deadlineText').textContent=
      'Hết giờ --';

    el('countdown')
      .classList.add('preparing');

    el('mobileCountdown')
      .classList.add('preparing');

    el('countdown').innerHTML=
      '<span class="preparing-text">Đang chuẩn bị</span>';

    el('mobileCountdown').innerHTML=
      '<span class="preparing-text">Đang chuẩn bị</span>';

    el('mobileDrawDate').textContent=
      displayDate(todayKey);
  }else{
    const tomorrow=new Date(now);

    tomorrow.setDate(
      tomorrow.getDate()+1
    );

    tomorrow.setHours(18,15,0,0);

    const totalSeconds=Math.max(
      0,
      Math.floor(
        (tomorrow-now)/1000
      )
    );

    const hours=
      String(
        Math.floor(totalSeconds/3600)
      ).padStart(2,'0');

    const minutes=
      String(
        Math.floor(
          totalSeconds%3600/60
        )
      ).padStart(2,'0');

    const seconds=
      String(
        totalSeconds%60
      ).padStart(2,'0');

    const characters=
      (hours+minutes+seconds).split('');

    const html=
      `<b>${characters[0]}</b>`+
      `<b>${characters[1]}</b>`+
      `<em>:</em>`+
      `<b>${characters[2]}</b>`+
      `<b>${characters[3]}</b>`+
      `<em>:</em>`+
      `<b>${characters[4]}</b>`+
      `<b>${characters[5]}</b>`;

    el('countdown')
      .classList.remove('preparing');

    el('mobileCountdown')
      .classList.remove('preparing');

    el('countdown').innerHTML=html;
    el('mobileCountdown').innerHTML=html;

    const tomorrowKey=
      localDateKey(tomorrow);

    el('deadlineText').textContent=
      `Kỳ tiếp theo ${displayDate(tomorrowKey)}`;

    el('mobileDrawDate').textContent=
      displayDate(tomorrowKey);
  }

  if(!state.lastResult){
    const latest=new Date(now);
    const resultTime=new Date(now);

    resultTime.setHours(18,30,0,0);

    if(now<resultTime){
      latest.setDate(
        latest.getDate()-1
      );
    }

    const latestKey=
      localDateKey(latest);

    el('resultDate').textContent=
      displayDate(latestKey);

    el('sideDate').textContent=
      displayDate(latestKey);

    el('sideDrawDate').textContent=
      displayDate(latestKey);
  }

  el('desktopClock').textContent=
    `Ngày ${String(now.getDate()).padStart(2,'0')} `+
    `Tháng ${String(now.getMonth()+1).padStart(2,'0')} `+
    `Năm ${now.getFullYear()} `+
    `${String(now.getHours()).padStart(2,'0')}:`+
    `${String(now.getMinutes()).padStart(2,'0')} 🇻🇳`;
}
function renderAll(){
  renderAccount();
  renderSubTabs();
  renderMeta();
  renderSelection();
  renderDrafts();
  renderHistory();
  updateSummary();
  renderDrawerCounts();
}

function bind(){
  bindMaintenanceLinks();

  el('playHelpBtn').onclick=()=>
    openHelpModal('play');

  el('modeHint').onclick=()=>{
    const type=
      el('modeHint').dataset.popup;

    if(type){
      openHelpModal(type);
    }
  };

  el('helpModalClose').onclick=
    closeHelpModal;

  el('helpModal').onclick=event=>{
    if(event.target===el('helpModal')){
      closeHelpModal();
    }
  };

  document.addEventListener(
    'keydown',
    event=>{
      if(
        event.key==='Escape'&&
        !el('helpModal')
          .classList.contains('hidden')
      ){
        closeHelpModal();
      }
    }
  );

  document
    .querySelectorAll(
      '#gameTabs [data-game]'
    )
    .forEach(button=>{
      button.onclick=()=>{
        state.game=button.dataset.game;
        state.sub=0;

        state.mode=
          defaultModeForGame(state.game);

        state.quickPage=0;
        state.rows=[];
        state.numbers=[];

        document
          .querySelectorAll(
            '#gameTabs [data-game]'
          )
          .forEach(tab=>{
            tab.classList.toggle(
              'active',
              tab===button
            );
          });

        renderSubTabs();
        renderMeta();
        resetSelections();
      };
    });

  el('modeTabs')
    .querySelectorAll('button')
    .forEach(button=>{
      button.onclick=()=>{
        if(!modeAllowed(button.dataset.mode)){
          return;
        }

        state.mode=button.dataset.mode;
        state.quickPage=0;

        syncModes();
        resetSelections();
      };
    });

  el('minus').onclick=()=>{
    el('multiplier').value=
      Math.max(
        1,
        multiplier()-1
      );

    updateSummary();
  };

  el('plus').onclick=()=>{
    el('multiplier').value=
      multiplier()+1;

    updateSummary();
  };

  el('multiplier').oninput=
    updateSummary;

  el('addDraft').onclick=
    addDraft;

  el('instantBet').onclick=
    instantBet;

  el('resetSelection').onclick=
    resetSelections;

  el('clearDrafts').onclick=()=>{
    state.drafts=[];
    renderDrafts();
  };

  el('submitDrafts').onclick=
    submitDrafts;

  el('historyTabs')
    .querySelectorAll('[data-filter]')
    .forEach(button=>{
      button.onclick=()=>{
        state.historyFilter=
          button.dataset.filter;

        el('historyTabs')
          .querySelectorAll('[data-filter]')
          .forEach(tab=>{
            tab.classList.toggle(
              'active',
              tab===button
            );
          });

        renderHistory();
      };
    });

  el('refreshHistory').onclick=
    renderHistory;

  el('mobileMenu').onclick=
    openDrawer;

  el('drawerBackdrop').onclick=
    closeDrawer;

  el('mobileBack').onclick=()=>{
    window.scrollTo({
      top:0,
      behavior:'smooth'
    });
  };

  el('mobileGamePicker').onclick=()=>{
    el('mobileGameMenu')
      .classList.toggle('open');
  };

  document
    .querySelectorAll('[data-chip]')
    .forEach(button=>{
      button.onclick=()=>{
        el('multiplier').value=
          button.dataset.chip;

        updateSummary();
      };
    });

  el('mMultiplier').oninput=event=>{
    const input=event.currentTarget;
    const digits=input.value.replace(/\D/g,'');

    if(digits===''){
      input.value='';
      el('multiplier').value='1';
      updateSummary({preserveMobileMultiplier:true});
      return;
    }

    const value=Math.max(
      1,
      Math.floor(Number(digits))
    );

    input.value=String(value);
    el('multiplier').value=String(value);

    updateSummary({preserveMobileMultiplier:true});
  };

  el('mMultiplier').onfocus=event=>{
    event.currentTarget.select();
  };

  el('mMultiplier').onblur=event=>{
    if(!event.currentTarget.value){
      event.currentTarget.value='1';
      el('multiplier').value='1';
      updateSummary();
    }
  };

  el('mReset').onclick=
    resetSelections;

  el('mBet').onclick=()=>{
    if(state.drafts.length){
      submitDrafts();
    }else{
      instantBet();
    }
  };

  document
    .querySelectorAll('[data-drawer]')
    .forEach(button=>{
      button.onclick=()=>{
        const action=
          button.dataset.drawer;

        closeDrawer();

        if(action==='all'){
          return renderMobileRecords(
            'all',
            'Hồ sơ cá cược'
          );
        }

        if(action==='pending'){
          return renderMobileRecords(
            'pending',
            'Chờ kết quả'
          );
        }

        if(action==='settled'){
          return renderMobileRecords(
            'settled',
            'Thắng thua'
          );
        }

        if(action==='results'){
          renderMobileResults();

          return el('mobileResults')
            .classList.add('open');
        }

        if(action==='help'){
          return openHelpModal('play');
        }

        if(
          ['closed','feed','theme','support','home']
            .includes(action)
        ){
          return showMaintenance();
        }
      };
    });

  document
    .querySelectorAll(
      '[data-close-mobile-page]'
    )
    .forEach(button=>{
      button.onclick=()=>{
        button
          .closest('.mobile-page')
          .classList.remove('open');
      };
    });

  el('mobileRecordsRefresh').onclick=()=>{
    renderMobileRecords(
      state.mobileFilter||'all',
      el('mobileRecordsTitle').textContent||
      'Hồ sơ cá cược'
    );
  };

  el('mobileResultsRefresh').onclick=
    renderMobileResults;

  el('closeAuth').onclick=
    closeAuth;

  el('showRegister').onclick=()=>{
    openAuth('register');
  };

  el('showLogin').onclick=()=>{
    openAuth('login');
  };

  el('doLogin').onclick=()=>{
    doLogin(
      el('loginUser').value
        .trim()
        .toLowerCase(),

      el('loginPass').value
    );
  };

  el('doRegister').onclick=()=>{
    doRegister(
      el('registerUser').value,
      el('registerPass').value
    );
  };

  el('authModal').onclick=event=>{
    if(event.target===el('authModal')){
      closeAuth();
    }
  };

  bindDesktopAuth();
}

function init(){
  state.mode=defaultModeForGame(state.game);

  bind();
  renderAll();
  clockTick();

  setInterval(
    clockTick,
    1000
  );

  installResultObserver();
}

init();
