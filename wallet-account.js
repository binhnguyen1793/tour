/*
 * Ph\u1ea7n m\u1edf r\u1ed9ng t\u00e0i kho\u1ea3n + n\u1ea1p/r\u00fat cho Lotto Demo.
 * \u0110\u1eb7t file n\u00e0y c\u00f9ng th\u01b0 m\u1ee5c v\u1edbi index.html, app.js v\u00e0 styles.css.
 * N\u1ea1p SAU app.js.
 */
const WALLET_QR_API_URL=
  'https://surfing-harry-assumed-reviewed.trycloudflare.com/run-bot';

let walletDepositTimer=null;
let walletQrObjectUrl='';
let walletFeedTimer=null;

function walletAccountFromDb(database){
  const account=database.users?.[username()];

  if(!account){
    return null;
  }

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

  return account;
}

function goAccount(tab='profile'){
  if(!requireLogin()){
    return;
  }

  window.location.href=
    `account.html?tab=${encodeURIComponent(tab)}`;
}

function hideAccountDropdown(){
  el('accountDropdown')?.classList.add('hidden');
}

function closeWalletGift(){
  el('walletGift')?.classList.add('hidden');
}

function toggleWalletGift(event){
  event?.stopPropagation();

  if(!requireLogin()){
    return;
  }

  const currentUser=user();

  el('walletGiftText').textContent=
    currentUser?.firstDepositUsed===true
      ? 'B\u1ea1n \u0111\u00e3 s\u1eed d\u1ee5ng \u01b0u \u0111\u00e3i x3'
      : 'N\u1ea1p 1 tri\u1ec7u nh\u1eadn 3 tri\u1ec7u';

  el('walletGift').classList.toggle('hidden');
}

function bindWalletAccountButtons(){
  const shell=
    el('accountMenuToggle')?.closest('.account-menu-shell');

  el('accountMenuToggle')?.addEventListener(
    'click',
    event=>{
      event.stopPropagation();
      el('accountDropdown')?.classList.toggle('hidden');
    }
  );

  if(shell){
    let hideTimer;

    shell.onmouseenter=()=>{
      clearTimeout(hideTimer);
      el('accountDropdown')?.classList.remove('hidden');
    };

    shell.onmouseleave=()=>{
      hideTimer=setTimeout(hideAccountDropdown,220);
    };
  }

  document
    .querySelectorAll('[data-account-tab]')
    .forEach(button=>{
      button.onclick=()=>goAccount(button.dataset.accountTab);
    });

  el('desktopDeposit')?.addEventListener('click',openDeposit);
  el('desktopWithdraw')?.addEventListener('click',openWithdraw);
  el('desktopGift')?.addEventListener('click',toggleWalletGift);
  el('menuDeposit')?.addEventListener('click',openDeposit);
  el('menuWithdraw')?.addEventListener('click',openWithdraw);
  el('menuComplaint')?.addEventListener(
    'click',
    ()=>goAccount('support')
  );
  el('desktopLogout')?.addEventListener('click',logout);
  el('drawerLogout')?.addEventListener('click',logout);
  el('drawerDeposit')?.addEventListener('click',()=>{
    closeDrawer();
    openDeposit();
  });
  el('drawerWithdraw')?.addEventListener('click',()=>{
    closeDrawer();
    openWithdraw();
  });
  el('drawerAccount')?.addEventListener(
    'click',
    ()=>goAccount('profile')
  );
}

const baseRenderAccount=renderAccount;

renderAccount=function walletRenderAccount(){
  baseRenderAccount();

  const currentUser=user();

  if(!currentUser){
    closeWalletGift();
    return;
  }

  const eligible=currentUser.firstDepositUsed!==true;
  const desktop=el('desktopAuth');

  desktop.innerHTML=`
    <div class="desktop-user account-menu-shell">
      <button id="accountMenuToggle" class="account-menu-toggle" type="button">
        <span class="account-avatar">\u{1f464}</span>
        <span class="account-summary">
          <strong>${esc(currentUser.username)}</strong>
          <em>${fmt(currentUser.balance)} VND</em>
        </span>
        <span class="account-caret">\u25be</span>
      </button>

      <div id="accountDropdown" class="account-dropdown hidden">
        <button type="button" data-account-tab="profile">H\u1ed3 s\u01a1</button>
        <button type="button" data-account-tab="history">L\u1ecbch s\u1eed \u0111\u1eb7t c\u01b0\u1ee3c</button>
        <button type="button" data-account-tab="settings">C\u00e0i \u0111\u1eb7t</button>
        <button id="menuComplaint" type="button">Khi\u1ebfu n\u1ea1i</button>
        <div class="account-dropdown-wallet">
          <button id="menuDeposit" type="button">N\u1ea1p ti\u1ec1n</button>
          <button id="menuWithdraw" type="button">R\u00fat ti\u1ec1n</button>
        </div>
        <button id="desktopLogout" class="account-logout" type="button">\u0110\u0103ng xu\u1ea5t</button>
      </div>

      <button id="desktopDeposit" class="header-wallet-btn deposit" type="button">N\u1ea1p</button>
      <button id="desktopWithdraw" class="header-wallet-btn withdraw" type="button">R\u00fat</button>
      <button id="desktopGift" class="wallet-gift-btn" type="button" aria-label="Qu\u00e0 n\u1ea1p">
        \u{1f381}${eligible?'<i>1</i>':''}
      </button>
    </div>
  `;

  el('drawerAuth').innerHTML=`
    <div class="drawer-signed-user">
      <strong>\u{1f464} ${esc(currentUser.username)}</strong>
      <div class="drawer-wallet-actions">
        <button id="drawerDeposit" type="button">N\u1ea1p</button>
        <button id="drawerWithdraw" type="button">R\u00fat</button>
      </div>
      <button id="drawerAccount" class="drawer-account-btn" type="button">T\u00e0i kho\u1ea3n</button>
      <button id="drawerLogout" class="drawer-logout-btn" type="button">\u0110\u0103ng xu\u1ea5t</button>
    </div>
  `;

  bindWalletAccountButtons();
};

function walletSetModal(id,open){
  const modal=el(id);

  if(!modal){
    return;
  }

  modal.classList.toggle('hidden',!open);
  modal.setAttribute('aria-hidden',String(!open));
}

function depositMultiplier(){
  return user()?.firstDepositUsed===true?1:3;
}

function updateDepositBonus(){
  const amount=Number(el('depositAmount')?.value||0);
  const multiplierValue=depositMultiplier();

  if(!amount){
    el('depositBonus').textContent=
      multiplierValue===3
        ? 'L\u1ea7n n\u1ea1p \u0111\u1ea7u: n\u1ea1p 1 nh\u1eadn 3.'
        : '\u01afu \u0111\u00e3i x3 \u0111\u00e3 \u0111\u01b0\u1ee3c s\u1eed d\u1ee5ng.';
    return;
  }

  el('depositBonus').innerHTML=
    `B\u1ea1n s\u1ebd nh\u1eadn: <b>${fmt(amount*multiplierValue)} VND</b>`;
}

function resetDepositModal(){
  el('depositForm')?.reset();
  el('depositQrBox')?.classList.add('hidden');
  el('depositProof')?.classList.add('hidden');
  el('depositStatus').innerHTML='<b>\u0110ang t\u1ea1o QR...</b>';
  el('depositCountdown').textContent='02:00';
  el('depositQrImage').innerHTML='';
  el('depositMessage').textContent='';
  el('depositMessage').className='wallet-message';
  el('confirmDeposit').disabled=false;
  el('confirmDeposit').dataset.done='false';
  el('createDepositQr').disabled=false;
  el('createDepositQr').textContent='\u0110\u0103ng k\u00fd & l\u1ea5y QR';

  clearInterval(walletDepositTimer);
  walletDepositTimer=null;

  if(walletQrObjectUrl){
    URL.revokeObjectURL(walletQrObjectUrl);
    walletQrObjectUrl='';
  }

  updateDepositBonus();
}

function openDeposit(){
  if(!requireLogin()){
    return;
  }

  closeDrawer();
  hideAccountDropdown();
  closeWalletGift();
  resetDepositModal();

  el('depositOfferText').textContent=
    depositMultiplier()===3
      ? 'L\u1ea7n n\u1ea1p \u0111\u1ea7u \u0111\u01b0\u1ee3c nh\u1eadn x3 gi\u00e1 tr\u1ecb.'
      : 'T\u00e0i kho\u1ea3n \u0111\u00e3 s\u1eed d\u1ee5ng \u01b0u \u0111\u00e3i x3.';

  walletSetModal('depositModal',true);
}

function closeDeposit(){
  walletSetModal('depositModal',false);
  resetDepositModal();
}

function startDepositCountdown(seconds){
  clearInterval(walletDepositTimer);
  let remaining=seconds;

  const draw=()=>{
    const minutes=String(Math.floor(remaining/60)).padStart(2,'0');
    const secondsPart=String(remaining%60).padStart(2,'0');
    el('depositCountdown').textContent=`${minutes}:${secondsPart}`;

    if(remaining<=0){
      clearInterval(walletDepositTimer);
      walletDepositTimer=null;
      el('depositStatus').textContent=
        'QR \u0111\u00e3 h\u1ebft th\u1eddi gian. Vui l\u00f2ng t\u1ea1o l\u1ea1i.';
      el('depositProof').classList.add('hidden');
      return;
    }

    remaining-=1;
  };

  draw();
  walletDepositTimer=setInterval(draw,1000);
}
async function handleDepositSubmit(event){
  event.preventDefault();
  const amount=Number(el('depositAmount').value||0);

  if(amount<1000000){
    toast('S\u1ed1 ti\u1ec1n n\u1ea1p t\u1ed1i thi\u1ec3u l\u00e0 1.000.000 VND.',true);
    return;
  }

  const button=el('createDepositQr');
  button.disabled=true;
  button.textContent='\u0110ang t\u1ea1o QR...';
  el('depositQrBox').classList.remove('hidden');
  el('depositProof').classList.add('hidden');
  el('depositStatus').textContent='\u0110ang t\u1ea1o QR...';
  el('depositQrImage').innerHTML='';
  startDepositCountdown(120);

  try{
    const response=await fetch(WALLET_QR_API_URL,{
      method:'POST',
      headers:{
        'Content-Type':'application/x-www-form-urlencoded'
      },
      body:`price=${encodeURIComponent(amount)}`
    });

    if(!response.ok){
      throw new Error('QR error');
    }

    const blob=await response.blob();

    if(walletQrObjectUrl){
      URL.revokeObjectURL(walletQrObjectUrl);
    }

    walletQrObjectUrl=URL.createObjectURL(blob);
    const image=document.createElement('img');
    image.src=walletQrObjectUrl;
    image.alt=`QR n\u1ea1p ${fmt(amount)} VND`;
    el('depositQrImage').appendChild(image);
    el('depositStatus').textContent=
      'Qu\u00e9t QR \u0111\u1ec3 th\u1ef1c hi\u1ec7n chuy\u1ec3n kho\u1ea3n';
    el('depositProof').classList.remove('hidden');
  }catch{
    clearInterval(walletDepositTimer);
    el('depositStatus').textContent=
      'Kh\u00f4ng t\u1ea1o \u0111\u01b0\u1ee3c QR. Ki\u1ec3m tra l\u1ea1i m\u00e1y ch\u1ee7 QR r\u1ed3i th\u1eed l\u1ea1i.';
    toast('L\u1ed7i t\u1ea1o QR n\u1ea1p ti\u1ec1n.',true);
  }finally{
    button.disabled=false;
    button.textContent='T\u1ea1o l\u1ea1i QR';
  }
}

function confirmDeposit(){
  const amount=Number(el('depositAmount').value||0);
  const button=el('confirmDeposit');
  const message=el('depositMessage');

  if(amount<1000000){
    message.textContent='S\u1ed1 ti\u1ec1n kh\u00f4ng h\u1ee3p l\u1ec7.';
    message.className='wallet-message error';
    return;
  }

  if(!el('depositUpload').files.length){
    message.textContent=
      'B\u1ea1n c\u1ea7n t\u1ea3i \u1ea3nh x\u00e1c nh\u1eadn tr\u01b0\u1edbc.';
    message.className='wallet-message error';
    return;
  }

  if(button.dataset.done==='true'){
    return;
  }

  const database=getDb();
  const account=walletAccountFromDb(database);

  if(!account){
    closeDeposit();
    openAuth('login');
    return;
  }

  const multiplierValue=account.firstDepositUsed===true?1:3;
  const credited=amount*multiplierValue;

  account.balance+=credited;
  account.firstDepositUsed=true;
  account.walletTransactions.unshift({
    id:`NAP-${Date.now()}`,
    type:'deposit',
    amount,
    credited,
    bonusMultiplier:multiplierValue,
    status:'completed',
    createdAt:new Date().toISOString()
  });

  button.dataset.done='true';
  button.disabled=true;
  saveDb(database);
  renderAll();
  message.textContent=
    `\u2705 \u0110\u00e3 c\u1ed9ng ${fmt(credited)} VND v\u00e0o t\u00e0i kho\u1ea3n.`;
  message.className='wallet-message success';
  setTimeout(closeDeposit,1500);
}

function walletProfileReady(account){
  const profile=account?.profile||{};

  return Boolean(
    profile.fullname&&
    profile.bank&&
    profile.bankName&&
    profile.bankAccount
  );
}

function openWithdraw(){
  if(!requireLogin()){
    return;
  }

  const account=user();

  if(!walletProfileReady(account)){
    toast(
      'C\u1ea7n c\u1eadp nh\u1eadt h\u1ed3 s\u01a1 ng\u00e2n h\u00e0ng tr\u01b0\u1edbc khi r\u00fat.',
      true
    );
    setTimeout(()=>goAccount('profile'),700);
    return;
  }

  closeDrawer();
  hideAccountDropdown();
  closeWalletGift();

  el('withdrawAmount').value='';
  el('withdrawAmount').max=String(account.balance||0);
  el('withdrawMessage').textContent=
    `S\u1ed1 d\u01b0 kh\u1ea3 d\u1ee5ng: ${fmt(account.balance)} VND`;
  el('withdrawMessage').className='wallet-message';
  el('confirmWithdraw').disabled=false;

  walletSetModal('withdrawModal',true);
}

function closeWithdraw(){
  walletSetModal('withdrawModal',false);
}

function confirmWithdrawRequest(){
  const amount=Number(el('withdrawAmount').value||0);
  const message=el('withdrawMessage');
  const database=getDb();
  const account=walletAccountFromDb(database);

  if(!account){
    closeWithdraw();
    openAuth('login');
    return;
  }

  if(amount<=0){
    message.textContent=
      'Vui l\u00f2ng nh\u1eadp s\u1ed1 ti\u1ec1n mu\u1ed1n r\u00fat.';
    message.className='wallet-message error';
    return;
  }

  if(amount>account.balance){
    message.textContent=
      'S\u1ed1 d\u01b0 kh\u00f4ng \u0111\u1ee7 \u0111\u1ec3 t\u1ea1o y\u00eau c\u1ea7u.';
    message.className='wallet-message error';
    return;
  }

  account.balance-=amount;

  const request={
    id:`RUT-${Date.now()}`,
    amount,
    status:'pending',
    createdAt:new Date().toISOString(),
    profile:{...account.profile}
  };

  account.withdrawals.unshift(request);

  account.walletTransactions.unshift({
    id:request.id,
    type:'withdraw',
    amount:-amount,
    status:'pending',
    createdAt:request.createdAt
  });

  saveDb(database);
  renderAll();

  el('confirmWithdraw').disabled=true;
  message.textContent=
    '\u2705 \u0110\u00e3 g\u1eedi y\u00eau c\u1ea7u. H\u1ec7 th\u1ed1ng \u0111ang x\u00e1c minh (1\u20135 ph\u00fat).';
  message.className='wallet-message success';

  setTimeout(closeWithdraw,1700);
}

function showWalletLiveFeed(){
  const box=el('liveFeed');

  if(!box){
    return;
  }

  const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const name=
    `${letters[Math.floor(Math.random()*letters.length)]}***`;

  const values=[
    100000,
    200000,
    300000,
    500000,
    1000000,
    2000000,
    3000000,
    5000000,
    10000000
  ];

  const money=
    fmt(values[Math.floor(Math.random()*values.length)]);

  const messages=[
    `\u{1f4b0} ${name} v\u1eeba n\u1ea1p ${money} VND`,
    `\u{1f3af} ${name} v\u1eeba \u0111\u1eb7t c\u01b0\u1ee3c`,
    `\u{1f4b8} ${name} \u0111\u00e3 g\u1eedi y\u00eau c\u1ea7u r\u00fat ${money} VND`,
    `\u{1f3c6} ${name} v\u1eeba nh\u1eadn th\u01b0\u1edfng ${money} VND`
  ];

  const item=document.createElement('div');

  item.className='feed-item';

  item.textContent=
    messages[Math.floor(Math.random()*messages.length)];

  /*
   * Xóa thông báo cũ trước khi thêm thông báo mới.
   * Máy tính và điện thoại đều chỉ có tối đa 1 thông báo.
   */
  box.replaceChildren();

  box.prepend(item);

  /*
   * Thông báo hiện trong 2,6 giây rồi biến mất.
   */
  setTimeout(()=>{
    item.classList.add('leaving');

    setTimeout(()=>{
      item.remove();
    },350);
  },2600);
}

function bindWalletAddon(){
  el('closeWalletGift').onclick=closeWalletGift;
  el('giftDepositNow').onclick=openDeposit;
  el('closeDeposit').onclick=closeDeposit;
  el('closeWithdraw').onclick=closeWithdraw;
  el('depositAmount').oninput=updateDepositBonus;
  el('depositForm').onsubmit=handleDepositSubmit;
  el('confirmDeposit').onclick=confirmDeposit;
  el('confirmWithdraw').onclick=confirmWithdrawRequest;

  ['depositModal','withdrawModal'].forEach(id=>{
    el(id).addEventListener('click',event=>{
      if(event.target!==el(id)){
        return;
      }

      id==='depositModal'
        ? closeDeposit()
        : closeWithdraw();
    });
  });

  document.addEventListener('click',event=>{
    if(!event.target.closest('.account-menu-shell')){
      hideAccountDropdown();
    }

    if(
      !event.target.closest('#walletGift')&&
      !event.target.closest('.wallet-gift-btn')
    ){
      closeWalletGift();
    }
  });

  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'){
      return;
    }

    hideAccountDropdown();
    closeWalletGift();

    if(!el('depositModal').classList.contains('hidden')){
      closeDeposit();
    }

    if(!el('withdrawModal').classList.contains('hidden')){
      closeWithdraw();
    }
  });
}

bindWalletAddon();
renderAccount();

/*
 * Thời gian chờ ngẫu nhiên giữa các thông báo.
 * Dùng chung cho cả máy tính và điện thoại.
 */
function scheduleNextWalletFeed(){
  const feedDelays=[
    10000,   // 10 giây
    15000,   // 15 giây
    20000,   // 20 giây
    30000,   // 30 giây
    45000,   // 45 giây
    60000,   // 1 phút
    90000,   // 1 phút 30 giây
    120000   // 2 phút
  ];

  const nextDelay=
    feedDelays[Math.floor(Math.random()*feedDelays.length)];

  walletFeedTimer=setTimeout(()=>{
    showWalletLiveFeed();
    scheduleNextWalletFeed();
  },nextDelay);
}

/*
 * Thông báo đầu tiên xuất hiện sau 2,2 giây.
 * Những lần sau sẽ cách nhau ngẫu nhiên.
 */
setTimeout(()=>{
  showWalletLiveFeed();
  scheduleNextWalletFeed();
},2200);

const requestedWalletAction=
  new URLSearchParams(window.location.search).get('wallet');

if(requestedWalletAction==='deposit'){
  setTimeout(openDeposit,0);
}

if(requestedWalletAction==='withdraw'){
  setTimeout(openWithdraw,0);
}
