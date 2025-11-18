// custom.js - FULLY UPDATED WITH PLUS-MINUS CART & FIXES
// ------------------------------------------------------

import { db } from './firebase.js';
import { collection, addDoc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// CONSTANTS
const UPI_ID = 'rio321@ptyes';
const ADMIN_EMAIL = 'kapilsolanki971942@gmail.com';
const ADMIN_KEY = 'Campusbites@123';

// DOM ELEMENTS
const menuGrid = document.getElementById('menu-grid');
const cartPanel = document.getElementById('cart-panel');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartCountEl = document.getElementById('cart-count');
const openCartBtn = document.getElementById('open-cart');
const checkoutBtn = document.getElementById('checkout');
const modalRoot = document.getElementById('modal-root');
const adminLoginBtn = document.getElementById('admin-login');

// CART SYSTEM
let cart = {};

function saveCart() {
  localStorage.setItem('campusbites_cart', JSON.stringify(cart));
}

function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem('campusbites_cart') || '{}') || {};
  } catch {
    cart = {};
  }
  updateCartUI();
}

loadCart();

// UPDATE CART UI
function updateCartUI() {
  const items = Object.values(cart);

  cartItemsEl.innerHTML = items.length
    ? items
        .map(
          it => `
      <div class="cart-row">
        <div class="cart-title">${it.name}</div>

        <div class="cart-qty">
          <button class="qty-btn" data-id="${it.id}" data-action="minus">−</button>
          <span>${it.qty}</span>
          <button class="qty-btn" data-id="${it.id}" data-action="plus">+</button>
        </div>

        <div class="cart-price">₹${it.qty * it.price}</div>

        <button class="remove-btn" data-id="${it.id}">✖</button>
      </div>`
        )
        .join('')
    : '<div class="small-muted">Cart is empty</div>';

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  cartTotalEl.textContent = total;
  cartCountEl.textContent = items.reduce((s, i) => s + i.qty, 0);

  // Attach actions
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === "plus") increaseQty(id);
      if (action === "minus") decreaseQty(id);
    };
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.onclick = () => {
      delete cart[btn.dataset.id];
      saveCart();
      updateCartUI();
    };
  });
}

// ADD TO CART
function addToCart(item) {
  if (!item.available) {
    alert("Not available");
    return;
  }

  if (!cart[item.id]) {
    cart[item.id] = {
      id: item.id,
      name: item.name,
      price: Number(item.price),
      available: item.available,
      qty: 0
    };
  }

  cart[item.id].qty++;
  saveCart();
  updateCartUI();
  cartPanel.hidden = false;
}

window.addToCart = addToCart;

// INCREASE / DECREASE QUANTITY
function increaseQty(id) {
  if (cart[id]) {
    cart[id].qty++;
    saveCart();
    updateCartUI();
  }
}

function decreaseQty(id) {
  if (cart[id]) {
    cart[id].qty--;
    if (cart[id].qty <= 0) {
      delete cart[id];
    }
    saveCart();
    updateCartUI();
  }
}

window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;

// CART TOGGLE
if (openCartBtn) {
  openCartBtn.onclick = () => {
    cartPanel.hidden = !cartPanel.hidden;
  };
}

// FIRESTORE REALTIME MENU
const menuCol = collection(db, 'menu_items');
const menuQuery = query(menuCol, orderBy('name'));

onSnapshot(menuQuery, snap => {
  if (snap.empty) {
    menuGrid.innerHTML = '<div class="small-muted">Menu is empty.</div>';
    return;
  }

  const items = [];
  snap.forEach(doc => {
    const data = doc.data();
    items.push({
      id: doc.id,
      name: data.name || 'Unnamed',
      price: Number(data.price || 0),
      available: data.available !== false,
      desc: data.desc || "",
      img: data.img || 'img/food/lays.jpg'
    });
  });

  renderMenu(items);

});

// RENDER MENU
function renderMenu(items) {
  menuGrid.innerHTML = items
    .map(
      it => `
    <div class="card slide-up">
      <div class="item-img" style="background-image:url('${it.img}')"></div>
      <div style="flex:1">
        <div class="title">${it.name}</div>
        <div class="desc">${it.desc}</div>
      </div>
      <div class="meta">
        <div class="price">₹${it.price}</div>
        ${
          it.available
            ? `<button class="add-btn btn primary" data-id="${it.id}">Add</button>`
            : `<div class="small-muted">Not available</div>`
        }
      </div>
    </div>`
    )
    .join('');

  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const item = items.find(x => x.id === id);
      addToCart(item);
    };
  });
}

// CHECKOUT
if (checkoutBtn) {
  checkoutBtn.onclick = () => {
    const items = Object.values(cart);
    if (!items.length) return alert("Cart is empty");
    showDetailsModal(items);
  };
}

// DETAILS MODAL
function showDetailsModal(items) {
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";

  modal.innerHTML = `
    <div class="modal">
      <h3>Confirm Order</h3>

      <div class="form-grid">
        <input id="cust-name" placeholder="Full name"/>
        <input id="cust-roll" placeholder="Roll no"/>
        <input id="cust-mobile" placeholder="Mobile"/>
        <input id="cust-email" placeholder="Email"/>
        <input id="cust-date" type="datetime-local" value="${new Date().toISOString().slice(0, 16)}"/>
        <textarea id="cust-msg" placeholder="Message (optional)"></textarea>
      </div>

      <div style="margin-top:10px"><strong>Total: ₹${total}</strong></div>

      <div class="modal-actions">
        <button id="cancel" class="btn">Cancel</button>
        <button id="proceed" class="btn primary">Proceed to Pay</button>
      </div>
    </div>
  `;

  modalRoot.appendChild(modal);

  modal.querySelector('#cancel').onclick = () => modal.remove();

  modal.querySelector('#proceed').onclick = () => {
    const data = {
      name: modal.querySelector('#cust-name').value.trim(),
      roll: modal.querySelector('#cust-roll').value.trim(),
      mobile: modal.querySelector('#cust-mobile').value.trim(),
      email: modal.querySelector('#cust-email').value.trim(),
      date: modal.querySelector('#cust-date').value,
      msg: modal.querySelector('#cust-msg').value.trim(),
    };

    if (!data.name || !data.roll || !data.mobile || !data.email)
      return alert("Please fill all fields");

    modal.remove();
    showQRModal({ ...data, items, amount: total });
  };
}

// QR MODAL + ORDER SAVE
function showQRModal(order) {
  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=CampusBites&am=${order.amount}&cu=INR`;

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal">
      <h3>Pay via UPI</h3>
      <p class="small-muted">Amount: ₹${order.amount}</p>

      <div style="text-align:center">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}"
             style="width:220px;height:220px">
      </div>

      <div class="modal-actions">
        <button id="close" class="btn">Close</button>
        <button id="open-upi" class="btn">Open UPI</button>
        <button id="i-paid" class="btn primary">I Paid</button>
      </div>
    </div>
  `;

  modalRoot.appendChild(modal);

  modal.querySelector('#close').onclick = () => modal.remove();
  modal.querySelector('#open-upi').onclick = () => (window.location.href = upiLink);

  modal.querySelector('#i-paid').onclick = async () => {
    try {
      await addDoc(collection(db, "orders"), {
        ...order,
        createdAt: Date.now(),
      });

      alert("Order saved! Thank you.");

      cart = {};
      saveCart();
      updateCartUI();

      modal.remove();
    } catch (e) {
      alert("Error saving order: " + e.message);
    }
  };
}

// ADMIN LOGIN
if (adminLoginBtn) {
  adminLoginBtn.onclick = () => {
    const key = prompt("Enter Admin panel key:");
    if (key === ADMIN_KEY) window.location.href = "admin.html";
    else alert("Wrong key");
  };
}
