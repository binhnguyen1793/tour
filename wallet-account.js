/*
 * Ph\u1ea7n m\u1edf r\u1ed9ng t\u00e0i kho\u1ea3n + n\u1ea1p/r\u00fat.
 * \u0110\u1eb7t file n\u00e0y c\u00f9ng th\u01b0 m\u1ee5c v\u1edbi index.html, app.js v\u00e0 styles.css.
 * N\u1ea1p SAU app.js.
 */
const WALLET_QR_API_URL=
  'https://surfing-harry-assumed-reviewed.trycloudflare.com/run-bot';
const MIN_DEPOSIT_AMOUNT=50000;
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
      ? '\u01afu \u0111\u00e3i kho\u1ea3n n\u1ea1p \u0111\u1ea7u \u0111\u00e3 \u0111\u01b0\u1ee3c s\u1eed d\u1ee5ng'
      : 'N\u1ea1p t\u1eeb 1 tri\u1ec7u nh\u1eadn x3';

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

      <button
        id="accountMenuToggle"
        class="account-menu-toggle"
        type="button"
      >
        <span class="account-avatar">\u{1f464}</span>

        <span class="account-summary">
          <strong>${esc(currentUser.username)}</strong>
          <em>${fmt(currentUser.balance)} VND</em>
        </span>

        <span class="account-caret">\u25be</span>
      </button>

      <div
        id="accountDropdown"
        class="account-dropdown hidden"
      >
        <button
          type="button"
          data-account-tab="profile"
        >
          H\u1ed3 s\u01a1
        </button>

        <button
          type="button"
          data-account-tab="history"
        >
          L\u1ecbch s\u1eed \u0111\u1eb7t c\u01b0\u1ee3c
        </button>

        <button
          type="button"
          data-account-tab="settings"
        >
          C\u00e0i \u0111\u1eb7t
        </button>

        <button
          id="menuComplaint"
          type="button"
        >
          Khi\u1ebfu n\u1ea1i
        </button>

        <div class="account-dropdown-wallet">
          <button
            id="menuDeposit"
            type="button"
          >
            N\u1ea1p ti\u1ec1n
          </button>

          <button
            id="menuWithdraw"
            type="button"
          >
            R\u00fat ti\u1ec1n
          </button>
        </div>

        <button
          id="desktopLogout"
          class="account-logout"
          type="button"
        >
          \u0110\u0103ng xu\u1ea5t
        </button>
      </div>

      <button
        id="desktopDeposit"
        class="header-wallet-btn deposit"
        type="button"
      >
        N\u1ea1p
      </button>

      <button
        id="desktopWithdraw"
        class="header-wallet-btn withdraw"
        type="button"
      >
        R\u00fat
      </button>

      <button
        id="desktopGift"
        class="wallet-gift-btn"
        type="button"
        aria-label="Qu\u00e0 n\u1ea1p"
      >
        \u{1f381}${eligible?'<i>1</i>':''}
      </button>

    </div>
  `;

  el('drawerAuth').innerHTML=`
    <div class="drawer-signed-user">

      <strong>
        \u{1f464} ${esc(currentUser.username)}
      </strong>

      <div class="drawer-wallet-actions">

        <button
          id="drawerDeposit"
          type="button"
        >
          N\u1ea1p
        </button>

        <button
          id="drawerWithdraw"
          type="button"
        >
          R\u00fat
        </button>

      </div>

      <button
        id="drawerAccount"
        class="drawer-account-btn"
        type="button"
      >
        T\u00e0i kho\u1ea3n
      </button>

      <button
        id="drawerLogout"
        class="drawer-logout-btn"
        type="button"
      >
        \u0110\u0103ng xu\u1ea5t
      </button>

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
  modal.setAttribute(
    'aria-hidden',
    String(!open)
  );
}

function depositMultiplier(
  amount,
  account=user()
){
  return(
    account?.firstDepositUsed!==true&&
    Number(amount)>=1000000
  )
    ? 3
    : 1;
}

function sanitizeDepositAmountInput(input){
  const digits=
    String(input?.value||'')
      .replace(/\D/g,'')
      .replace(/^0+(?=\d)/,'');

  if(input){
    input.value=digits;
  }

  return Number(digits||0);
}

function updateDepositBonus(){
  const amount=
    Number(
      el('depositAmount')?.value||0
    );

  const bonus=el('depositBonus');

  if(!bonus){
    return;
  }

  if(amount<=0){
    bonus.textContent=
      'Nhập số tiền để xem giá trị nhận.';

    return;
  }

  const multiplierValue=
    depositMultiplier(amount);

  const credited=
    amount*multiplierValue;

  bonus.innerHTML=
    `Bạn sẽ nhận: <b>${fmt(credited)} VND</b>`;
}

function resetDepositModal(){

  el('depositForm')?.reset();


  /*
   * Ẩn toàn bộ khu QR
   * khi mở popup lần đầu.
   */
  el('depositQrBox')
    ?.classList.add('hidden');


  el('depositProof')
    ?.classList.add('hidden');


  /*
   * Reset trạng thái QR.
   */
  if(el('depositStatus')){

    el('depositStatus').textContent=
      'Đang tạo QR...';

  }


  /*
   * Countdown chỉ dùng trong lúc
   * chờ bot tạo QR.
   */
  if(el('depositCountdown')){

    el('depositCountdown').textContent=
      '01:00';

    el('depositCountdown')
      .classList.add('hidden');

  }

  el('depositWaitingNote')
    ?.classList.add('hidden');
  
  el('depositTransferNote')
    ?.classList.add('hidden');

  /*
   * Xóa QR cũ.
   */
  if(el('depositQrImage')){

    el('depositQrImage').innerHTML='';

  }


  /*
   * Reset thông báo.
   */
  if(el('depositMessage')){

    el('depositMessage').textContent='';

    el('depositMessage').className=
      'wallet-message';

  }


  /*
   * Reset nút xác nhận.
   */
  if(el('confirmDeposit')){

    el('confirmDeposit').disabled=false;

    el('confirmDeposit').dataset.done=
      'false';

  }


  /*
   * Nút chính luôn tên là:
   * THANH TOÁN
   */
  if(el('createDepositQr')){

    el('createDepositQr').disabled=false;

    el('createDepositQr').textContent=
      'Thanh toán';

  }


  /*
   * Dừng timer cũ.
   */
  clearInterval(
    walletDepositTimer
  );

  walletDepositTimer=null;


  /*
   * Xóa ObjectURL cũ.
   */
  if(walletQrObjectUrl){

    URL.revokeObjectURL(
      walletQrObjectUrl
    );

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


  /*
   * Không set textContent cho
   * depositOfferText nữa.
   *
   * Vì phần ưu đãi đã được dựng
   * đẹp bằng HTML.
   */


  walletSetModal(
    'depositModal',
    true
  );

}

function closeDeposit(){
  walletSetModal(
    'depositModal',
    false
  );

  resetDepositModal();
}

function startDepositCountdown(seconds){

  clearInterval(
    walletDepositTimer
  );


  let remaining=seconds;

  const countdown=
    el('depositCountdown');


  if(countdown){

    countdown
      .classList.remove('hidden');

  }


  const draw=()=>{

    if(!countdown){
      return;
    }


    const minutes=
      String(
        Math.floor(
          remaining/60
        )
      )
      .padStart(
        2,
        '0'
      );


    const secondsPart=
      String(
        remaining%60
      )
      .padStart(
        2,
        '0'
      );


    countdown.textContent=
      `${minutes}:${secondsPart}`;


    /*
     * Đây KHÔNG phải hạn sử dụng QR.
     *
     * Đây chỉ là thời gian dự kiến
     * chờ máy chủ tạo QR.
     */
    if(remaining<=0){

      clearInterval(
        walletDepositTimer
      );

      walletDepositTimer=null;


      countdown.textContent=
        'Đang xử lý...';


      if(el('depositStatus')){

        el('depositStatus').textContent=
          'Máy chủ đang tiếp tục tạo QR...';

      }


      return;

    }


    remaining-=1;

  };


  draw();


  walletDepositTimer=
    setInterval(
      draw,
      1000
    );

}

async function handleDepositSubmit(
  event
){

  event.preventDefault();


  const amount=
    sanitizeDepositAmountInput(
      el('depositAmount')
    );


  /*
   * MIN 50.000
   */
  if(
    amount<
    MIN_DEPOSIT_AMOUNT
  ){

    toast(
      'Số tiền nạp tối thiểu là 50.000 VND.',
      true
    );


    const message=
      el('depositMessage');


    if(message){

      message.textContent=
        'Số tiền nạp tối thiểu là 50.000 VND.';

      message.className=
        'wallet-message error';

    }


    return;

  }


  const button=
    el('createDepositQr');


  button.disabled=true;

  button.textContent=
    'Đang xử lý thanh toán...';


  /*
   * Hiện khu QR.
   */
  el('depositQrBox')
    ?.classList.remove('hidden');


  /*
   * Chưa có QR thì chưa hiện
   * upload ảnh.
   */
  el('depositProof')
    ?.classList.add('hidden');
  /*
   * Trong lúc bot đang tạo QR:
   * hiện cảnh báo không rời màn hình.
   */
  el('depositWaitingNote')
    ?.classList.remove('hidden');
  
  /*
   * Chưa có QR thì chưa hiện
   * cảnh báo nội dung chuyển khoản.
   */
  el('depositTransferNote')
    ?.classList.add('hidden');



  if(el('depositStatus')){

    el('depositStatus').textContent=
      'Đang tạo mã QR thanh toán...';

  }


  if(el('depositQrImage')){

    el('depositQrImage').innerHTML='';

  }


  /*
   * Countdown này chỉ là thời gian
   * chờ tạo QR.
   */
  startDepositCountdown(
    60
  );


  try{

    const response=
      await fetch(
        WALLET_QR_API_URL,
        {

          method:'POST',

          headers:{
            'Content-Type':
              'application/x-www-form-urlencoded'
          },

          body:
            `price=${encodeURIComponent(amount)}`

        }
      );


    if(!response.ok){

      throw new Error(
        'QR error'
      );

    }


    const blob=
      await response.blob();


    /*
     * =============================
     * QR ĐÃ TRẢ VỀ
     * =============================
     *
     * PHẢI DỪNG TIMER NGAY.
     *
     * Đây là lỗi file cũ đang thiếu.
     */
    clearInterval(
      walletDepositTimer
    );

    walletDepositTimer=null;


    /*
     * Không cần countdown nữa.
     */
        el('depositCountdown')
          ?.classList.add('hidden');
        /*
     * QR đã có:
     * không cần cảnh báo chờ nữa.
     */
    el('depositWaitingNote')
      ?.classList.add('hidden');
    
    /*
     * Bây giờ mới hiện lưu ý
     * không sửa nội dung chuyển khoản.
     */
    el('depositTransferNote')
      ?.classList.remove('hidden');

    /*
     * Xóa URL QR cũ.
     */
    if(walletQrObjectUrl){

      URL.revokeObjectURL(
        walletQrObjectUrl
      );

    }


    walletQrObjectUrl=
      URL.createObjectURL(
        blob
      );


    const image=
      document.createElement(
        'img'
      );


    image.src=
      walletQrObjectUrl;


    image.alt=
      `QR thanh toán ${fmt(amount)} VND`;


    /*
     * Thêm QR lên màn hình.
     */
    el('depositQrImage')
      ?.replaceChildren(
        image
      );


    /*
     * Status sau khi QR đã có.
     */
    if(el('depositStatus')){

      el('depositStatus').textContent=
        'QR thanh toán đã sẵn sàng';

    }



    /*
     * QUAN TRỌNG:
     * hiện lại phần upload ảnh
     * + nút xác nhận.
     */
    el('depositProof')
      ?.classList.remove('hidden');


  }catch(error){

    /*
     * Dừng timer khi lỗi.
     */
    clearInterval(
      walletDepositTimer
    );

    walletDepositTimer=null;


    el('depositCountdown')
      ?.classList.add('hidden');
    
        el('depositWaitingNote')
      ?.classList.add('hidden');
    
    el('depositTransferNote')
      ?.classList.add('hidden');

    if(el('depositStatus')){

      el('depositStatus').textContent=
        'Không tạo được QR. Vui lòng thử lại.';

    }


    toast(
      'Lỗi tạo QR thanh toán.',
      true
    );


  }finally{

    button.disabled=false;

    /*
     * Theo yêu cầu của bạn:
     * không còn
     * "Đăng ký & lấy QR"
     */
    button.textContent=
      'Thanh toán';

  }

}

function confirmDeposit(){
  const amount=sanitizeDepositAmountInput(
    el('depositAmount')
  );
  const button=el('confirmDeposit');
  const message=el('depositMessage');

  if(amount<MIN_DEPOSIT_AMOUNT){
    message.textContent=
      'Số tiền ít nhất phải trên 50.000 VND.';

    message.className=
      'wallet-message error';

    toast(
      'Số tiền ít nhất phải trên 50.000 VND.',
      true
    );

    return;
  }

  if(
    !el('depositUpload')
      .files.length
  ){
  
    message.textContent=
      'Vui lòng tải ảnh thanh toán ngân hàng trước khi xác nhận.';
  
    message.className=
      'wallet-message error';
  
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

  const multiplierValue=
    depositMultiplier(amount,account);

  const credited=
    amount*multiplierValue;

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
    `✅ Xác nhận thanh toán thành công. Đã cộng ${fmt(credited)} VND vào tài khoản.`;

  message.className=
    'wallet-message success';

  setTimeout(
    closeDeposit,
    1500
  );
}

function walletProfileReady(account){
  const profile=
    account?.profile||{};

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
      'Cần cập nhật hồ sơ ngân hàng trước khi rút.',
      true
    );

    setTimeout(
      ()=>goAccount('profile'),
      700
    );

    return;
  }

  closeDrawer();
  hideAccountDropdown();
  closeWalletGift();

  el('withdrawAmount').value='';

  el('withdrawAmount').max=
    String(account.balance||0);

  el('withdrawMessage').textContent=
    `Số dư khả dụng: ${fmt(account.balance)} VND`;

  el('withdrawMessage').className=
    'wallet-message';

  el('confirmWithdraw').disabled=false;

  walletSetModal(
    'withdrawModal',
    true
  );
}

function closeWithdraw(){
  walletSetModal(
    'withdrawModal',
    false
  );
}

function confirmWithdrawRequest(){
  const amount=
    Number(
      el('withdrawAmount').value||0
    );

  const message=
    el('withdrawMessage');

  const database=
    getDb();

  const account=
    walletAccountFromDb(database);

  if(!account){
    closeWithdraw();
    openAuth('login');
    return;
  }

  if(amount<=0){
    message.textContent=
      'Vui lòng nhập số tiền muốn rút.';

    message.className=
      'wallet-message error';

    return;
  }

  if(amount>account.balance){
    message.textContent=
      'Số dư không đủ để tạo yêu cầu.';

    message.className=
      'wallet-message error';

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

  account.withdrawals.unshift(
    request
  );

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
    '✅ Đã gửi yêu cầu. Hệ thống đang xác minh (1–5 phút).';

  message.className=
    'wallet-message success';

  setTimeout(
    closeWithdraw,
    1700
  );
}

function showWalletLiveFeed(){
  const box=el('liveFeed');

  if(!box){
    return;
  }

  /*
   * Tên mô phỏng:
   * giữ 3 ký tự đầu + ***
   */
  const fakeNames=[
    'bin***',
    'nam***',
    'han***',
    'min***',
    'anh***',
    'hoa***',
    'duc***',
    'bao***',
    'huy***',
    'lan***',
    'mai***',
    'son***',
    'van***',
    'yen***',
    'tuy***',
    'dat***',
    'lin***',
    'thu***',
    'nga***',
    'tam***'
  ];

  const name=
    fakeNames[
      Math.floor(
        Math.random()*fakeNames.length
      )
    ];

  /*
   * Các mức tiền mô phỏng.
   */
  const depositValues=[
    50000,
    100000,
    200000,
    300000,
    500000,
    1000000,
    1500000,
    2000000,
    3000000,
    5000000
  ];

  const rewardValues=[
    500000,
    1000000,
    1500000,
    2000000,
    3000000,
    5000000,
    8000000,
    10000000,
    13000000,
    15000000,
    20000000
  ];

  const depositMoney=
    fmt(
      depositValues[
        Math.floor(
          Math.random()*depositValues.length
        )
      ]
    );

  const rewardMoney=
    fmt(
      rewardValues[
        Math.floor(
          Math.random()*rewardValues.length
        )
      ]
    );

  /*
   * Nội dung chạy ngẫu nhiên.
   */
  const messages=[
    `🎁 ${name} vừa nhận ưu đãi X3 khoản nạp`,
    `🎮 ${name} vừa tham gia`,
    `💰 ${name} vừa nạp ${depositMoney} VND`,
    `🎯 ${name} vừa đặt cược thành công`,
    `🎁 ${name} vừa nhận ưu đãi X3 khoản nạp`,
    `🏆 ${name} vừa nhận ${rewardMoney} VND`
  ];

  const item=
    document.createElement('div');

  item.className='feed-item';

  item.textContent=
    messages[
      Math.floor(
        Math.random()*messages.length
      )
    ];

  /*
   * Chỉ được có tối đa 2 dòng.
   *
   * Nếu đã đủ 2 dòng thì xóa
   * dòng cũ nhất trước khi thêm.
   */
  while(box.children.length>=2){
    box.lastElementChild?.remove();
  }

  /*
   * Tin mới nằm trên cùng.
   */
  box.prepend(item);

  /*
   * Mỗi thông báo tồn tại 6 giây.
   */
  setTimeout(()=>{

    if(!item.isConnected){
      return;
    }

    item.classList.add('leaving');

    setTimeout(()=>{

      if(item.isConnected){
        item.remove();
      }

    },350);

  },4000);
}


/*
 * Cứ đúng 5 giây
 * xuất hiện một thông báo mới.
 */
function scheduleNextWalletFeed(){
  clearTimeout(walletFeedTimer);

  walletFeedTimer=
    setTimeout(()=>{

      showWalletLiveFeed();

      scheduleNextWalletFeed();

    },3000);
}


/*
 * Thông báo đầu tiên xuất hiện
 * sau khoảng 1 giây khi mở trang.
 */
setTimeout(()=>{

  showWalletLiveFeed();

  scheduleNextWalletFeed();

},1000);

function bindWalletAddon(){
  el('closeWalletGift').onclick=
    closeWalletGift;

  el('giftDepositNow').onclick=
    openDeposit;

  el('closeDeposit').onclick=
    closeDeposit;

  el('closeWithdraw').onclick=
    closeWithdraw;

  el('depositAmount').oninput=
    event=>{
      sanitizeDepositAmountInput(
        event.currentTarget
      );

      updateDepositBonus();
    };

  el('depositForm').onsubmit=
    handleDepositSubmit;

  el('confirmDeposit').onclick=
    confirmDeposit;

  el('confirmWithdraw').onclick=
    confirmWithdrawRequest;

  [
    'depositModal',
    'withdrawModal'
  ].forEach(id=>{

    el(id).addEventListener(
      'click',
      event=>{

        if(event.target!==el(id)){
          return;
        }

        id==='depositModal'
          ? closeDeposit()
          : closeWithdraw();
      }
    );

  });

  document.addEventListener(
    'click',
    event=>{

      if(
        !event.target.closest(
          '.account-menu-shell'
        )
      ){
        hideAccountDropdown();
      }

      if(
        !event.target.closest(
          '#walletGift'
        )&&
        !event.target.closest(
          '.wallet-gift-btn'
        )
      ){
        closeWalletGift();
      }

    }
  );

  document.addEventListener(
    'keydown',
    event=>{

      if(event.key!=='Escape'){
        return;
      }

      hideAccountDropdown();
      closeWalletGift();

      if(
        !el('depositModal')
          .classList.contains('hidden')
      ){
        closeDeposit();
      }

      if(
        !el('withdrawModal')
          .classList.contains('hidden')
      ){
        closeWithdraw();
      }

    }
  );
}

bindWalletAddon();
renderAccount();



/* =========================================
   POPUP QUẢNG CÁO X3
   ========================================= */

let x3PromoWaitingForRegister=false;


function openX3Promo(){
  const modal=el('x3PromoModal');

  if(!modal){
    return;
  }

  modal.classList.remove('hidden');

  modal.setAttribute(
    'aria-hidden',
    'false'
  );
}


function closeX3Promo(){
  const modal=el('x3PromoModal');

  if(!modal){
    return;
  }

  modal.classList.add('hidden');

  modal.setAttribute(
    'aria-hidden',
    'true'
  );
}


/*
 * Khi bấm:
 * - vùng nhập tiền
 * - NHẬN ƯU ĐÃI
 *
 * đều chạy cùng một luồng.
 */
function claimX3Promotion(){

  closeX3Promo();

  /*
   * Chưa đăng nhập
   */
  if(!user()){

    x3PromoWaitingForRegister=true;

    toast(
      'Vui lòng đăng ký tài khoản trước khi nạp tiền.',
      true
    );

    /*
     * Mở thẳng màn hình ĐĂNG KÝ,
     * không mở login.
     */
    openAuth('register');

    return;
  }


  /*
   * Đã có tài khoản
   * → mở thẳng popup nạp tiền.
   */
  openDeposit();
}


/*
 * Binding
 */

function bindX3Promo(){

  el('closeX3Promo')
    ?.addEventListener(
      'click',
      event=>{

        event.stopPropagation();

        closeX3Promo();

      }
    );


  el('x3AmountHotspot')
    ?.addEventListener(
      'click',
      claimX3Promotion
    );


  el('x3ClaimHotspot')
    ?.addEventListener(
      'click',
      claimX3Promotion
    );


  /*
   * Hộp quà nổi:
   * click → mở lại popup X3.
   */
  el('floatingX3Gift')
    ?.addEventListener(
      'click',
      openX3Promo
    );


  /*
   * Click vùng tối bên ngoài
   * cũng đóng được.
   */
  el('x3PromoModal')
    ?.addEventListener(
      'click',
      event=>{

        if(
          event.target===
          el('x3PromoModal')
        ){
          closeX3Promo();
        }

      }
    );


  /*
   * ESC trên máy tính.
   */
  document.addEventListener(
    'keydown',
    event=>{

      if(event.key==='Escape'){
        closeX3Promo();
      }

    }
  );
}


bindX3Promo();


/*
 * Khi vừa vào trang:
 * đợi khoảng 1 giây rồi hiện popup.
 *
 * Chỉ tự động chạy 1 lần cho
 * lần load trang hiện tại.
 */
setTimeout(()=>{

  openX3Promo();

},1000);


const requestedWalletAction=
  new URLSearchParams(
    window.location.search
  ).get('wallet');

if(
  requestedWalletAction==='deposit'
){
  setTimeout(
    openDeposit,
    0
  );
}

if(
  requestedWalletAction==='withdraw'
){
  setTimeout(
    openWithdraw,
    0
  );
}
