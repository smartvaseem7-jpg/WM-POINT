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
  const menuHtml=MENU.map(i=>{const visual=i.name==="Katlat"?'<img src="data:image/jpeg;base64,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></svg>" alt="Katlat">' : i.name==="Bisget Katlat"?'<img src="data:image/jpeg;base64,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></svg>" alt="Bisget Katlat">':i.icon;return '<button class="menu-item" data-name="'+i.name+'" data-price="'+i.price+'"><div class="food-icon">'+visual+'</div><b>'+i.name+'</b><small>Rs. '+money(i.price)+'</small></button>'}).join("");
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
  if(!items.length){box.innerHTML='<p class="empty">Tap an item above to add it.</p>';$("total").textContent="0";$("totalItems").textContent="0";updateChange();return}
  let total=0,count=0;
  box.innerHTML=items.map(i=>{
    const sub=i.price*i.qty;total+=sub;count+=i.qty;
    const itemData=MENU.find(x=>x.name===i.name)||{};
    const icon=i.name==="Katlat"?'<img src="data:image/jpeg;base64,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></svg>" alt="Katlat">' : i.name==="Bisget Katlat"?'<img src="data:image/jpeg;base64,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></svg>" alt="Bisget Katlat">':(itemData.icon||"🍽️");
    return '<div class="cart-row"><div class="food-mini">'+icon+'</div><div class="cart-info"><div class="item-name">'+i.name+'</div><div class="price">Rs. '+money(i.price)+' × '+i.qty+' = Rs. '+money(sub)+'</div></div><div class="qty"><button onclick="changeQty(\''+i.name+'\',-1)">−</button><b>'+i.qty+'</b><button onclick="changeQty(\''+i.name+'\',1)">+</button><button class="remove" onclick="removeItem(\''+i.name+'\')">×</button></div></div>';
  }).join("");
  $("total").textContent=money(total);$("totalItems").textContent=count;updateChange();
}
function changeQty(name,n){if(!cart[name])return;cart[name].qty+=n;if(cart[name].qty<=0)delete cart[name];render()}
function removeItem(name){delete cart[name];render()}
function clearCart(){Object.keys(cart).forEach(k=>delete cart[k]);$("cash").value="";render()}
function updateChange(){const total=Number(($("total").textContent||"0").replace(/,/g,""))||0;const cash=Number($("cash").value)||0;$("change").textContent=money(Math.max(0,cash-total))}
function showView(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  const target=$(view+"View");if(target)target.classList.add("active");
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===view));
  if(view==="sales")renderSales();
  window.scrollTo({top:0,behavior:"smooth"});
}
async function renderSales(){
  const date=$("salesDate").value||todayKey();
  $("salesDate").value=date;
  await loadSales();
  const sales=salesCache.filter(x=>x.date===date);
  let total=0,items=0,by={};
  sales.forEach(b=>{total+=Number(b.total)||0;(b.items||[]).forEach(i=>{items+=i.qty;if(!by[i.name])by[i.name]={qty:0,total:0,price:i.price};by[i.name].qty+=i.qty;by[i.name].total+=i.price*i.qty})});
  $("billCount").textContent=sales.length;$("salesTotal").textContent=money(total);$("itemsSold").textContent=items;$("grandTotal").textContent=money(total);$("reportDate").textContent=fmtDate(date);
  const rows=MENU.map(m=>({
    name:m.name,
    qty:by[m.name]?.qty||0,
    price:m.price,
    total:by[m.name]?.total||0
  }));
  $("salesTable").innerHTML=
    '<div class="sale-row sale-head"><span>Item Name</span><span>Qty</span><span>Rate</span><span>Total</span></div>'+
    rows.map(i=>'<div class="sale-row"><span>'+i.name+'</span><span>'+i.qty+'</span><span>Rs. '+money(i.price)+'</span><span class="sale-total">Rs. '+money(i.total)+'</span></div>').join("");
}
async function resetSelectedDate(){
  const date=$("salesDate").value||todayKey();
  const sales=salesCache.filter(b=>b && b.date===date);
  if(!sales.length){
    alert("No sales found for "+fmtDate(date)+".");
    return;
  }
  if(!confirm("Delete all Firebase sales for "+fmtDate(date)+"?"))return;
  try{
    const snap=await salesRef.once("value");
    const data=snap.val()||{};
    const updates={};
    Object.entries(data).forEach(([key,bill])=>{
      if(bill && bill.date===date)updates[key]=null;
    });
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
  let html='<div style="text-align:center"><h2>CHAAI HAVEN</h2><div>Tea Shop</div><small>'+fmtDate(todayKey())+' | '+now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})+'</small></div><hr>';
  bill.items.forEach(i=>html+='<div class="receipt-line"><span>'+i.name+' × '+i.qty+'</span><span>Rs. '+money(i.price*i.qty)+'</span></div>');
  html+='<hr><div class="receipt-line"><b>TOTAL</b><b>Rs. '+money(bill.total)+'</b></div><div class="receipt-line"><span>Cash</span><span>Rs. '+money(bill.cash)+'</span></div><div class="receipt-line"><b>Change</b><b>Rs. '+money(bill.change)+'</b></div><p style="text-align:center">Thank you!</p>';
  const w=window.open("","_blank","width=420,height=650");if(!w){alert("Please allow the print window.");return}
  w.document.write('<html><head><title>CHAAI HAVEN Bill</title><style>body{font-family:monospace;padding:18px;color:#111}.receipt-line{display:flex;justify-content:space-between;padding:4px 0}</style></head><body>'+html+'</body></html>');
  w.document.close();w.focus();setTimeout(()=>w.print(),250);
}
document.addEventListener("DOMContentLoaded",async()=>{
  menuRender();render();$("salesDate").value=todayKey();
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