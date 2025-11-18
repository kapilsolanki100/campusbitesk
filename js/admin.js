// admin.js - Firebase v9.23.0 | URL + File Upload (WORKING)
import { app, db } from './firebase.js';

import {
  collection, setDoc, doc, onSnapshot, deleteDoc,
  updateDoc, getDocs, query, orderBy
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// Initialize Storage with app
const storage = getStorage(app);

// Firestore Collections
const menuCol = collection(db, 'menu_items');
const ordersCol = collection(db, 'orders');

// Inputs
const nameIn = document.getElementById('m-name');
const priceIn = document.getElementById('m-price');
const imgURLIn = document.getElementById('m-img');
const imgFileIn = document.getElementById('m-img-file');
const imgPreview = document.getElementById('img-preview');
const availIn = document.getElementById('m-available');
const saveBtn = document.getElementById('save-item');
const menuTable = document.getElementById('menu-table');
const ordersTable = document.getElementById('orders-table');

/* ----------------------
    IMAGE PREVIEW
-----------------------*/

// URL preview
imgURLIn.addEventListener("input", () => {
  if (imgURLIn.value.trim() !== "") {
    imgPreview.src = imgURLIn.value.trim();
    imgPreview.style.display = "block";
  }
});

// File preview
imgFileIn.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    imgPreview.src = URL.createObjectURL(file);
    imgPreview.style.display = "block";
  }
});

/* ----------------------
    SAVE / UPDATE ITEM
-----------------------*/

saveBtn.onclick = async () => {
  try {
    const name = nameIn.value.trim();
    const price = Number(priceIn.value);
    const available = availIn.value === "true";

    if (!name || !price) {
      alert("Please provide name and price.");
      return;
    }

    let imgURL = imgURLIn.value.trim();
    const file = imgFileIn.files[0];

    // UPLOAD FILE TO STORAGE
    if (file) {
      const fileRef = ref(storage, `food_items/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      imgURL = await getDownloadURL(fileRef);
    }

    // DEFAULT IMAGE
    if (!imgURL) imgURL = "img/food/thali.jpg";

    const id = name.toLowerCase().replace(/\s+/g, '-');

    await setDoc(doc(db, "menu_items", id), {
      name,
      price,
      available,
      img: imgURL,
      desc: ""
    });

    alert("Item saved successfully!");

    // RESET FORM
    nameIn.value = "";
    priceIn.value = "";
    imgURLIn.value = "";
    imgFileIn.value = "";
    imgPreview.style.display = "none";

  } catch (err) {
    console.error(err);
    alert("Save failed: " + err.message);
  }
};

/* ----------------------
    REALTIME MENU
-----------------------*/

const menuQuery = query(menuCol, orderBy('name'));
onSnapshot(menuQuery, snap => {
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  renderMenu(items);
});

function renderMenu(items) {
  menuTable.innerHTML =
    `<table style="width:100%">
      <thead>
        <tr>
          <th>Image</th><th>Name</th><th>Price</th><th>Available</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>` +
      items.map(it => `
        <tr>
          <td><img src="${it.img}" style="width:50px;height:50px;border-radius:6px;"></td>
          <td>${it.name}</td>
          <td>₹${it.price}</td>
          <td>${it.available ? "Yes" : "No"}</td>
          <td>
            <button class="edit" data-id="${it.id}">Edit</button>
            <button class="toggle" data-id="${it.id}" data-av="${it.available}">Toggle</button>
            <button class="del" data-id="${it.id}">Delete</button>
          </td>
        </tr>`
      ).join("") +
      `</tbody></table>`;

  // Delete Item
  menuTable.querySelectorAll('.del').forEach(btn =>
    btn.onclick = async () => {
      if (!confirm("Delete this item?")) return;
      await deleteDoc(doc(db, "menu_items", btn.dataset.id));
    }
  );

  // Toggle availability
  menuTable.querySelectorAll('.toggle').forEach(btn =>
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const av = btn.dataset.av === "true";
      await updateDoc(doc(db, "menu_items", id), { available: !av });
    }
  );

  // Edit Item
  menuTable.querySelectorAll('.edit').forEach(btn =>
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const snap = await getDocs(query(menuCol));
      const docData = snap.docs.find(d => d.id === id);

      if (docData) {
        const data = docData.data();
        nameIn.value = data.name;
        priceIn.value = data.price;
        imgURLIn.value = data.img;
        imgFileIn.value = "";
        imgPreview.src = data.img;
        imgPreview.style.display = "block";
        availIn.value = data.available ? "true" : "false";
      }
    }
  );
}

/* ----------------------
    REALTIME ORDERS
-----------------------*/

const ordersQuery = query(ordersCol, orderBy("createdAt", "desc"));
onSnapshot(ordersQuery, snap => {
  const rows = [];
  snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
  renderOrders(rows);
});

function renderOrders(rows) {
  ordersTable.innerHTML =
  `<table style="width:100%">
    <thead>
      <tr>
        <th>Name</th><th>Roll</th><th>Mobile</th><th>Email</th>
        <th>Items</th><th>Amount</th><th>Date</th><th>Action</th>
      </tr>
    </thead>
    <tbody>` +
    rows.map(r => `
      <tr>
        <td>${r.name}</td>
        <td>${r.roll}</td>
        <td>${r.mobile}</td>
        <td>${r.email}</td>
        <td>${(r.items || []).map(i => i.name + ' x ' + i.qty).join(', ')}</td>
        <td>₹${r.amount}</td>
        <td>${new Date(r.createdAt).toLocaleString()}</td>
        <td><button class="del-order" data-id="${r.id}">Delete</button></td>
      </tr>`
    ).join("") +
    `</tbody></table>`;

  ordersTable.querySelectorAll('.del-order').forEach(btn =>
    btn.onclick = async () => {
      if (!confirm("Delete order?")) return;
      await deleteDoc(doc(db, "orders", btn.dataset.id));
    }
  );
}

/* ----------------------
    CSV EXPORT
-----------------------*/

document.getElementById("download-csv").onclick = async () => {
  const snap = await getDocs(ordersQuery);
  const rows = [["Name", "Roll", "Email", "Mobile", "Items", "Amount", "Date"]];

  snap.forEach(doc => {
    const data = doc.data();
    rows.push([
      data.name,
      data.roll,
      data.email,
      data.mobile,
      (data.items || []).map(i => i.name + ' x ' + i.qty).join('; '),
      data.amount,
      new Date(data.createdAt).toLocaleString()
    ]);
  });

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "campusbites_orders.csv";
  a.click();
};
