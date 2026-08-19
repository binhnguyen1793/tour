/*
 * Pháº§n má»Ÿ rá»™ng tĂ i khoáº£n + náº¡p/rĂºt cho Lotto Demo.
 * Äáº·t file nĂ y cĂ¹ng thÆ° má»¥c vá»›i index.html, app.js vĂ  styles.css.
 * Náº¡p SAU app.js.
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
      ? 'Báº¡n Ä‘Ă£ sá»­ dá»¥ng Æ°u Ä‘Ă£i x3'
      : 'Náº¡p 1 triá»‡u nháº­n 3 triá»‡u';

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
        <span class="account-avatar">đŸ‘¤</span>
        <span class="account-summary">
          <strong>${esc(currentUser.username)}</strong>
          <em>${fmt(currentUser.balance)} VND</em>
        </span>
        <span class="account-caret">â–¾</span>
      </button>

      <div id="accountDropdown" class="account-dropdown hidden">
        <button type="button" data-account-tab="profile">Há»“ sÆ¡</button>
        <button type="button" data-account-tab="history">Lá»‹ch sá»­ Ä‘áº·t cÆ°á»£c</button>
        <button type="button" data-account-tab="settings">CĂ i Ä‘áº·t</button>
        <button id="menuComplaint" type="button">Khiáº¿u náº¡i</button>
        <div class="account-dropdown-wallet">
          <button id="menuDeposit" type="button">Náº¡p tiá»n</button>
          <button id="menuWithdraw" type="button">RĂºt tiá»n</button>
        </div>
        <button id="desktopLogout" class="account-logout" type="button">ÄÄƒng xuáº¥t</button>
      </div>

      <button id="desktopDeposit" class="header-wallet-btn deposit" type="button">Náº¡p</button>
      <button id="desktopWithdraw" class="header-wallet-btn withdraw" type="button">RĂºt</button>
      <button id="desktopGift" class="wallet-gift-btn" type="button" aria-label="QuĂ  náº¡p">
        đŸ${eligible?'<i>1</i>':''}
      </button>
    </div>
  `;

  el('drawerAuth').innerHTML=`
    <div class="drawer-signed-user">
      <strong>đŸ‘¤ ${esc(currentUser.username)}</strong>
      <div class="drawer-wallet-actions">
        <button id="drawerDeposit" type="button">Náº¡p</button>
        <button id="drawerWithdraw" type="button">RĂºt</button>
      </div>
      <button id="drawerAccount" class="drawer-account-btn" type="button">TĂ i khoáº£n</button>
      <button id="drawerLogout" class="drawer-logout-btn" type="button">ÄÄƒng xuáº¥t</button>
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
        ? 'Láº§n náº¡p Ä‘áº§u: náº¡p 1 nháº­n 3.'
        : 'Æ¯u Ä‘Ă£i x3 Ä‘Ă£ Ä‘Æ°á»£c sá»­ dá»¥ng.';
    return;
  }

  el('depositBonus').innerHTML=
    `Báº¡n sáº½ nháº­n: <b>${fmt(amount*multiplierValue)} VND</b>`;
}

function resetDepositModal(){
  el('depositForm')?.reset();
  el('depositQrBox')?.classList.add('hidden');
  el('depositProof')?.classList.add('hidden');
  el('depositStatus').innerHTML='<b>Äang táº¡o QR...</b>';
  el('depositCountdown').textContent='02:00';
  el('depositQrImage').innerHTML='';
  el('depositMessage').textContent='';
  el('depositMessage').className='wallet-message';
  el('confirmDeposit').disabled=false;
  el('confirmDeposit').dataset.done='false';
  el('createDepositQr').disabled=false;
  el('createDepositQr').textContent='ÄÄƒng kĂ½ & láº¥y QR';

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
      ? 'Láº§n náº¡p Ä‘áº§u Ä‘Æ°á»£c nháº­n x3 giĂ¡ trá»‹.'
      : 'TĂ i khoáº£n Ä‘Ă£ sá»­ dá»¥ng Æ°u Ä‘Ă£i x3.';

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
        'QR Ä‘Ă£ háº¿t thá»i gian. Vui lĂ²ng táº¡o láº¡i.';
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
    toast('Sá»‘ tiá»n náº¡p tá»‘i thiá»ƒu lĂ  1.000.000 VND.',true);
    return;
  }

  const button=el('createDepositQr');
  button.disabled=true;
  button.textContent='Äang táº¡o QR...';
  el('depositQrBox').classList.remove('hidden');
  el('depositProof').classList.add('hidden');
  el('depositStatus').textContent='Äang táº¡o QR...';
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
    image.alt=`QR náº¡p ${fmt(amount)} VND`;
    el('depositQrImage').appendChild(image);
    el('depositStatus').textContent='QuĂ©t QR Ä‘á»ƒ thá»±c hiá»‡n chuyá»ƒn khoáº£n';
    el('depositProof').classList.remove('hidden');
  }catch{
    clearInterval(walletDepositTimer);
    el('depositStatus').textContent=
      'KhĂ´ng táº¡o Ä‘Æ°á»£c QR. Kiá»ƒm tra láº¡i mĂ¡y chá»§ QR rá»“i thá»­ láº¡i.';
    toast('Lá»—i táº¡o QR náº¡p tiá»n.',true);
  }finally{
    button.disabled=false;
    button.textContent='Táº¡o láº¡i QR';
  }
}

function confirmDeposit(){
  const amount=Number(el('depositAmount').value||0);
  const button=el('confirmDeposit');
  const message=el('depositMessage');

  if(amount<1000000){
    message.textContent='Sá»‘ tiá»n khĂ´ng há»£p lá»‡.';
    message.className='wallet-message error';
    return;
  }

  if(!el('depositUpload').files.length){
    message.textContent='Báº¡n cáº§n táº£i áº£nh xĂ¡c nháº­n trÆ°á»›c.';
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
  message.textContent=`âœ… ÄĂ£ cá»™ng ${fmt(credited)} VND vĂ o tĂ i khoáº£n.`;
  message.className='wallet-message success';
  setTimeout(closeDeposit,1500);
}

function walletProfileReady(account){
  const profile=account?.profile||{};
  return Boolean(
    profile.fullname&&profile.bank&&
    profile.bankName&&profile.bankAccount
  );
}

function openWithdraw(){
  if(!requireLogin()){
    return;
  }

  const account=user();

  if(!walletProfileReady(account)){
    toast('Cáº§n cáº­p nháº­t há»“ sÆ¡ ngĂ¢n hĂ ng trÆ°á»›c khi rĂºt.',true);
    setTimeout(()=>goAccount('profile'),700);
    return;
  }

  closeDrawer();
  hideAccountDropdown();
  closeWalletGift();
  el('withdrawAmount').value='';
  el('withdrawAmount').max=String(account.balance||0);
  el('withdrawMessage').textContent=
    `Sá»‘ dÆ° kháº£ dá»¥ng: ${fmt(account.balance)} VND`;
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
    message.textContent='Vui lĂ²ng nháº­p sá»‘ tiá»n muá»‘n rĂºt.';
    message.className='wallet-message error';
    return;
  }

  if(amount>account.balance){
    message.textContent='Sá»‘ dÆ° khĂ´ng Ä‘á»§ Ä‘á»ƒ táº¡o yĂªu cáº§u.';
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
    'âœ… ÄĂ£ gá»­i yĂªu cáº§u. Há»‡ thá»‘ng Ä‘ang xĂ¡c minh (1â€“5 phĂºt).';
  message.className='wallet-message success';
  setTimeout(closeWithdraw,1700);
}

function showWalletLiveFeed(){
  const box=el('liveFeed');
  if(!box){
    return;
  }

  const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const name=`${letters[Math.floor(Math.random()*letters.length)]}***`;
  const values=[
    100000,200000,300000,500000,
    1000000,2000000,3000000,5000000,10000000
  ];
  const money=fmt(values[Math.floor(Math.random()*values.length)]);
  const messages=[
    `đŸ’° ${name} vá»«a náº¡p ${money} VND`,
    `đŸ¯ ${name} vá»«a Ä‘áº·t cÆ°á»£c`,
    `đŸ’¸ ${name} Ä‘Ă£ gá»­i yĂªu cáº§u rĂºt ${money} VND`,
    `đŸ† ${name} vá»«a nháº­n thÆ°á»Ÿng ${money} VND`
  ];
  const item=document.createElement('div');

  item.className='feed-item';
  item.textContent=messages[Math.floor(Math.random()*messages.length)];
  box.prepend(item);

  while(box.children.length>4){
    box.lastElementChild.remove();
  }

  setTimeout(()=>{
    item.classList.add('leaving');
    setTimeout(()=>item.remove(),350);
  },6000);
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
      id==='depositModal'?closeDeposit():closeWithdraw();
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
setTimeout(showWalletLiveFeed,1200);
walletFeedTimer=setInterval(showWalletLiveFeed,3000);

const requestedWalletAction=
  new URLSearchParams(window.location.search).get('wallet');

if(requestedWalletAction==='deposit'){
  setTimeout(openDeposit,0);
}

if(requestedWalletAction==='withdraw'){
  setTimeout(openWithdraw,0);
}
