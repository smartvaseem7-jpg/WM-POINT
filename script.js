const firebaseConfig={
  apiKey:"AIzaSyA4Kh806eyIy3yjuRmmF6HSKM93xwtQ00A",
  authDomain:"wm-point-e9196.firebaseapp.com",
  databaseURL:"https://wm-point-e9196-default-rtdb.firebaseio.com",
  projectId:"wm-point-e9196",
  storageBucket:"wm-point-e9196.firebasestorage.app",
  messagingSenderId:"708620946182",
  appId:"1:708620946182:web:d8a7d1482306e9cd2dec87",
  measurementId:"G-3ZKEJWBV18"
};
firebase.initializeApp(firebaseConfig);
const db=firebase.database();
const salesRef=db.ref("teaSales");

const MENU=[
{name:"Katlat",price:60,icon:"🥟"},
{name:"Bisget Katlat",price:100,icon:"🥨"},
{name:"Poori",price:70,icon:"🫓"},
{name:"Kahvatea",price:130,icon:"☕"},
{name:"Tea",price:130,icon:"🍵"},
{name:"Koli Appam",price:50,icon:"🥞"},
{name:"Kawn Rotti",price:70,icon:"🫓"},
{name:"Lattu",price:40,icon:"🍡"}
];
const IMAGES={
"Katlat":"assets/file_00000000a3f48208bdac065d8dbf3677.png?v=1",
"Bisget Katlat":"assets/bisget-katlat.jpg?v=4",
"Poori":"assets/poori.jpg?v=1",
"Kahvatea":"assets/kahwa-tea.jpg?v=1",
"Koli Appam":"assets/koli-appam.jpg?v=1"
};
function itemVisual(name,fallback){return IMAGES[name]?'<img src="'+IMAGES[name]+'" alt="'+name+'">':fallback}
const cart={};
let salesCache=[];
const $=id=>document.getElementById(id);
const todayKey=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const fmtDate=d=>new Date(d+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"});
function money(n){return Number(n||0).toLocaleString("en-LK")}

async function loadSales(){
  try{
    const snap=await salesRef.once("value");
    const data=snap.val()||{};
    salesCache=Object.values(data);
  }catch(e){
    console.error("Firebase load error:",e);
    salesCache=[];
  }
  return salesCache;
}

function menuRender(){
  const menuHtml=MENU.map(i=>{const visual=itemVisual(i.name,i.icon);return '<button class="menu-item" data-name="'+i.name+'" data-price="'+i.price+'"><div class="food-icon">'+visual+'</div><span class="price-badge">Rs. '+money(i.price)+'</span><b>'+i.name+'</b></button>'}).join("");
  $("menuGrid").innerHTML=menuHtml;
  $("billingMenuGrid").innerHTML=menuHtml;
  document.querySelectorAll("#menuGrid .menu-item").forEach(btn=>btn.addEventListener("click",()=>{
    const name=btn.dataset.name,price=Number(btn.dataset.price);
    if(cart[name])cart[name].qty++;else cart[name]={name,price,qty:1};
    showView("billing");render();
  }));
  document.querySelectorAll("#billingMenuGrid .menu-item").forEach(btn=>btn.addEventListener("click",()=>{
    const name=btn.dataset.name,price=Number(btn.dataset.price);
    if(cart[name])cart[name].qty++;else cart[name]={name,price,qty:1};
    render();
  }));
}
function render(){
  const box=$("cart"),items=Object.values(cart);
  if(!items.length){box.innerHTML='<p class="empty">Tap an item above to add it.</p>';$("total").textContent="0";$("totalItems").textContent="0";updateChange();updateBar();return}
  let total=0,count=0;
  box.innerHTML=items.map(i=>{
    const sub=i.price*i.qty;total+=sub;count+=i.qty;
    const itemData=MENU.find(x=>x.name===i.name)||{};
    const icon=itemVisual(i.name,itemData.icon||"🍽️");
    return '<div class="cart-row"><div class="food-mini">'+icon+'</div><div class="cart-info"><div class="item-name">'+i.name+'</div><div class="price">Rs. '+money(i.price)+' × '+i.qty+' = Rs. '+money(sub)+'</div></div><div class="qty"><button onclick="changeQty(\''+i.name+'\',-1)">−</button><b>'+i.qty+'</b><button onclick="changeQty(\''+i.name+'\',1)">+</button><button class="remove" onclick="removeItem(\''+i.name+'\')">×</button></div></div>';
  }).join("");
  $("total").textContent=money(total);$("totalItems").textContent=count;updateChange();updateBar();
}
function updateBar(){
  const items=Object.values(cart);
  $("dItems").textContent=items.reduce((a,i)=>a+i.qty,0);
  $("dTotal").textContent=money(items.reduce((a,i)=>a+i.price*i.qty,0));
  $("dChips").innerHTML=items.length?items.map(i=>'<div class="chip"><span>'+i.name+' × '+i.qty+'</span><button onclick="changeQty(\''+i.name+'\',-1)">−</button></div>').join(""):'<small class="chips-empty">Item thottina inga theriyum</small>';
  document.querySelectorAll("#billingMenuGrid .menu-item").forEach(btn=>{
    const q=cart[btn.dataset.name]?cart[btn.dataset.name].qty:0;
    let b=btn.querySelector(".qty-badge");
    if(q>0){if(!b){b=document.createElement("span");b.className="qty-badge";btn.appendChild(b)}b.textContent=q}
    else if(b)b.remove();
    btn.classList.toggle("selected",q>0);
  });
}
function openMenu(o){
  $("menuDrawer").classList.toggle("open",o);
  $("drawerBack").classList.toggle("open",o);
}
function changeQty(name,n){if(!cart[name])return;cart[name].qty+=n;if(cart[name].qty<=0)delete cart[name];render()}
function removeItem(name){delete cart[name];render()}
function clearCart(){Object.keys(cart).forEach(k=>delete cart[k]);$("cash").value="";render()}
function updateChange(){
  const total=Number(($("total").textContent||"0").replace(/,/g,""))||0;
  const cash=Number($("cash").value)||0;
  const short=cash>0&&total>0&&cash<total;
  $("changeBox").classList.toggle("short",short);
  $("changeLabel").textContent=short?"⚠ Innum vaanganum":"Change";
  $("change").textContent=money(short?total-cash:Math.max(0,cash-total));
}
function showView(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  const target=$(view+"View");if(target)target.classList.add("active");
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===view));
  if(view==="sales")renderSales();updateBar();
  window.scrollTo({top:0,behavior:"smooth"});
}
async function renderSales(){
  const date=$("salesDate").value||todayKey();
  $("salesDate").value=date;
  await loadSales();
  const sales=salesCache.filter(x=>x.date===date).sort((x,y)=>(x.id||0)-(y.id||0));
  let total=0,items=0,by={};
  sales.forEach(b=>{total+=Number(b.total)||0;(b.items||[]).forEach(i=>{items+=i.qty;if(!by[i.name])by[i.name]={qty:0,total:0,price:i.price};by[i.name].qty+=i.qty;by[i.name].total+=i.price*i.qty})});
  $("billCount").textContent=sales.length;$("salesTotal").textContent=money(total);$("itemsSold").textContent=items;$("grandTotal").textContent=money(total);$("reportDate").textContent=fmtDate(date);
  const sold=MENU.map(m=>({name:m.name,icon:m.icon,qty:by[m.name]?.qty||0,price:m.price,total:by[m.name]?.total||0})).filter(r=>r.qty>0).sort((x,y)=>y.qty-x.qty||y.total-x.total);
  const unsold=MENU.filter(m=>!by[m.name]).map(m=>m.name);
  const maxQty=sold.length?sold[0].qty:1;
  $("topSeller").innerHTML=sold.length?'<span class="trophy">🏆</span><div><small>ATHIGAMA VITTADHU</small><b>'+sold[0].name+'</b><em>'+sold[0].qty+' vitrathu · Rs. '+money(sold[0].total)+'</em></div>':'';
  $("topSeller").style.display=sold.length?"flex":"none";
  $("salesTable").innerHTML=sold.length?sold.map(r=>'<div class="srow"><div class="food-mini">'+itemVisual(r.name,r.icon)+'</div><div class="sinfo"><div class="sname">'+r.name+'</div><div class="ssub">'+r.qty+' × Rs. '+money(r.price)+'</div><div class="sbar"><i style="width:'+Math.max(6,Math.round(r.qty/maxQty*100))+'%"></i></div></div><div class="sale-total">Rs. '+money(r.total)+'</div></div>').join(""):'<p class="empty">Indha naal edhuvum vikkala.</p>';
  $("unsold").innerHTML=sold.length&&unsold.length?'<b>Vikkala:</b> '+unsold.join(", "):'';
  $("billsNote").textContent=sales.length?sales.length+' bills':'';
  $("billsList").innerHTML=sales.length?sales.slice().reverse().map((b,k)=>'<div class="brow"><div class="bno">#'+(sales.length-k)+'</div><div class="binfo"><div class="btime">'+(b.time||"")+'</div><div class="bitems">'+(b.items||[]).map(i=>i.name+' × '+i.qty).join(", ")+'</div></div><div class="sale-total">Rs. '+money(b.total)+'</div></div>').join(""):'<p class="empty">Bills illa.</p>';
}
async function resetSelectedDate(){
  const date=$("salesDate").value||todayKey();
  const sales=salesCache.filter(b=>b && b.date===date);
  if(!sales.length){alert("No sales found for "+fmtDate(date)+".");return}
  if(!confirm("Delete all Firebase sales for "+fmtDate(date)+"?"))return;
  try{
    const snap=await salesRef.once("value");
    const data=snap.val()||{};
    const updates={};
    Object.entries(data).forEach(([key,bill])=>{if(bill && bill.date===date)updates[key]=null});
    await salesRef.update(updates);
    salesCache=salesCache.filter(b=>!b || b.date!==date);
    await renderSales();
    alert("Sales for "+fmtDate(date)+" have been reset.");
  }catch(e){
    console.error("Firebase reset error:",e);
    alert("Reset failed. Please check Firebase Database Rules.");
  }
}
async function saveCurrentBill(){
  const items=Object.values(cart);if(!items.length){alert("Please add items first.");return false}
  const total=items.reduce((s,i)=>s+i.price*i.qty,0),cash=Number($("cash").value)||0;
  if(cash<total){alert("Cash received is less than the bill total.");return false}
  const bill={id:Date.now(),date:todayKey(),time:new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),items:items.map(i=>({name:i.name,price:i.price,qty:i.qty})),total,cash,change:cash-total};
  try{
    await salesRef.child(String(bill.id)).set(bill);
    salesCache.push(bill);
    return bill;
  }catch(e){
    console.error("Firebase save error:",e);
    alert("Firebase save failed. Please check Firebase Database Rules.");
    return false;
  }
}
function printBill(bill){
  const now=new Date();
  let html='<div style="text-align:center"><h2>CHAAI HAVEN</h2><div>Tea Shop</div><div>Owner: Mubas</div><small>'+fmtDate(todayKey())+' | '+now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})+'</small></div><hr>';
  bill.items.forEach(i=>html+='<div class="receipt-line"><span>'+i.name+' × '+i.qty+'</span><span>Rs. '+money(i.price*i.qty)+'</span></div>');
  html+='<hr><div class="receipt-line"><b>TOTAL</b><b>Rs. '+money(bill.total)+'</b></div><div class="receipt-line"><span>Cash</span><span>Rs. '+money(bill.cash)+'</span></div><div class="receipt-line"><b>Change</b><b>Rs. '+money(bill.change)+'</b></div><p style="text-align:center">Thank you!</p>';
  const w=window.open("","_blank","width=420,height=650");if(!w){alert("Please allow the print window.");return}
  w.document.write('<html><head><title>CHAAI HAVEN Bill</title><style>body{font-family:monospace;padding:18px;color:#111}.receipt-line{display:flex;justify-content:space-between;padding:4px 0}</style></head><body>'+html+'</body></html>');
  w.document.close();w.focus();setTimeout(()=>w.print(),250);
}
document.addEventListener("DOMContentLoaded",async()=>{
  menuRender();render();$("salesDate").value=todayKey();
  $("openMenu").addEventListener("click",()=>openMenu(true));
  $("closeMenu").addEventListener("click",()=>openMenu(false));
  $("doneMenu").addEventListener("click",()=>openMenu(false));
  $("drawerBack").addEventListener("click",()=>openMenu(false));
  await renderSales();
  document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>showView(t.dataset.view)));
  document.querySelectorAll("[data-view]").forEach(b=>{if(!b.classList.contains("tab"))b.addEventListener("click",()=>showView(b.dataset.view))});
  $("salesTopBtn").addEventListener("click",()=>showView("sales"));
  $("resetSales").addEventListener("click",resetSelectedDate);
  $("salesDate").addEventListener("change",renderSales);
  $("cash").addEventListener("input",updateChange);
  $("clearBtn").addEventListener("click",clearCart);
  $("printBtn").addEventListener("click",async()=>{
    const btn=$("printBtn");btn.disabled=true;btn.textContent="Saving...";
    const bill=await saveCurrentBill();
    btn.disabled=false;btn.textContent="🧾 Save & Print Bill";
    if(!bill)return;
    printBill(bill);clearCart();renderSales();
  });
});

/* ===== PIN LOCK ===== */
const PIN_HASH="8a39c2fc02ac7014bba9e237fb03e01c3731f568b1b8ec1f4588d52e3fbb38c2";
let pinBuf="",pinFails=0,pinBlockUntil=0;
async function sha256(t){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("")}
function lockApp(){sessionStorage.removeItem("wmUnlocked");pinBuf="";drawPin();$("pinMsg").textContent="";$("lockScreen").classList.remove("hide")}
function unlockApp(){sessionStorage.setItem("wmUnlocked","1");$("lockScreen").classList.add("hide")}
function drawPin(){document.querySelectorAll("#pinDots i").forEach((d,k)=>d.classList.toggle("on",k<pinBuf.length))}
async function pinPress(n){
  if(Date.now()<pinBlockUntil){$("pinMsg").textContent="Konjam neram kazhichu try pannunga";return}
  if(pinBuf.length>=5)return;
  pinBuf+=n;drawPin();$("pinMsg").textContent="";
  if(pinBuf.length<5)return;
  let ok=false;
  try{ok=(await sha256(pinBuf))===PIN_HASH}catch(e){ok=false}
  if(ok){pinFails=0;unlockApp();pinBuf="";drawPin();return}
  pinFails++;
  $("pinDots").classList.add("bad");
  setTimeout(()=>{$("pinDots").classList.remove("bad");pinBuf="";drawPin()},450);
  if(pinFails>=5){pinBlockUntil=Date.now()+30000;pinFails=0;$("pinMsg").textContent="5 thadava thappu. 30 second wait pannunga"}
  else $("pinMsg").textContent="Thappaana PIN";
}
document.querySelectorAll(".keypad button:not(.k-del):not(.k-empty)").forEach(b=>b.addEventListener("click",()=>pinPress(b.textContent)));
$("pinDel").addEventListener("click",()=>{pinBuf=pinBuf.slice(0,-1);drawPin()});
$("lockBtn").addEventListener("click",lockApp);
if(sessionStorage.getItem("wmUnlocked")==="1")$("lockScreen").classList.add("hide");
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
