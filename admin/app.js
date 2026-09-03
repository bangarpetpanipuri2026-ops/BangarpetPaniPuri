import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/*
  SECURITY:
  1. Replace firebaseConfig with your project's public Firebase config.
  2. Replace RECAPTCHA_SITE_KEY with your App Check site key.
  3. Admin authorization is enforced by Firestore rules, not this UI.
  4. Never put a GitHub PAT, service-account JSON, or Firebase Admin SDK credential here.
*/
const firebaseConfig = {
  apiKey: "AIzaSyDElY-ymgLDDpsLCmwP_nArVq3cZVcD-VU",
  authDomain: "fir-project-ad1c8.firebaseapp.com",
  projectId: "fir-project-ad1c8",
  storageBucket: "fir-project-ad1c8.firebasestorage.app",
  messagingSenderId: "726974224635",
  appId: "1:726974224635:web:eba30088877932befa785e"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const $ = id => document.getElementById(id);
const toast = msg => { $("toast").textContent=msg; $("toast").style.display="block"; setTimeout(()=>$("toast").style.display="none",2400); };
const state = { sections: {hero:true, featured:true, promotion:true, story:true, contact:true}, grandOpening:{enabled:true,video:"/videos/grand-opening.mp4",display:"first"}, story:{visible:true,heading:"From Bangarpet streets to the heart of New Zealand.",text:"Our family-run kitchen brings Bangarpet street-food traditions to New Zealand."}, contact:{visible:true,phone:"+64 20 4001 5331",email:"",whatsapp:""}, featured:{visible:true,heading:"Featured Menu",subheading:""}, social:{} };

const sections=[["hero","Hero Section","Main opening area"],["featured","Featured Menu","Highlighted food items"],["promotion","Promotion","Marketing campaign"],["story","Our Story","Brand story"],["contact","Contact","Phone, email and WhatsApp"]];

function sectionHtml(){return sections.map(([id,n,d])=>`<div class="row"><div class="left"><div class="icon">●</div><div><b>${n}</b><small>${d}</small></div></div><label class="switch"><input type="checkbox" data-section="${id}" ${state.sections[id]!==false?"checked":""}><span></span></label></div>`).join("")}
function renderSections(){ $("sectionList").innerHTML=sectionHtml(); $("homeSectionList").innerHTML=sectionHtml(); document.querySelectorAll("[data-section]").forEach(x=>x.onchange=()=>{state.sections[x.dataset.section]=x.checked; renderSections();}); $("sectionCount").textContent=sections.filter(s=>state.sections[s[0]]!==false).length; }

async function loadData(){
  if(!auth.currentUser) return;
  try{
    const s=await getDoc(doc(db,"siteConfig","public"));
    if(s.exists()){ Object.assign(state,s.data()); state.sections=state.sections||{}; }
    const m=await getDocs(query(collection(db,"menuItems"),orderBy("name"),limit(100)));
    renderMenu(m.docs); $("menuCount").textContent=m.size;
    const p=await getDocs(query(collection(db,"promotions"),orderBy("createdAt","desc"),limit(50)));
    $("promoCount").textContent=p.size; renderPromos(p.docs);
  }catch(e){ console.error(e); toast("Could not load data."); }
  syncForms(); renderSections(); loadAudit();
}
function syncForms(){ $("grandEnabled").checked=state.grandOpening?.enabled!==false; $("grandVideo").value=state.grandOpening?.video||""; $("grandDisplay").value=state.grandOpening?.display||"first"; $("storyVisible").checked=state.story?.visible!==false; $("storyHeading").value=state.story?.heading||""; $("storyText").value=state.story?.text||""; $("contactVisible").checked=state.contact?.visible!==false; $("phone").value=state.contact?.phone||""; $("contactEmail").value=state.contact?.email||""; $("whatsapp").value=state.contact?.whatsapp||""; $("featuredVisible").checked=state.featured?.visible!==false; $("featuredHeading").value=state.featured?.heading||""; $("featuredSubheading").value=state.featured?.subheading||""; $("instagram").value=state.social?.instagram||""; $("facebook").value=state.social?.facebook||""; $("tiktok").value=state.social?.tiktok||""; $("googleBusiness").value=state.social?.googleBusiness||""; }

async function audit(action,target){ try{await addDoc(collection(db,"auditLogs"),{action,target,uid:auth.currentUser.uid,email:auth.currentUser.email,createdAt:serverTimestamp()});}catch(e){console.error(e)} }
async function saveSite(patch,target){ try{ await setDoc(doc(db,"siteConfig","public"),patch,{merge:true}); Object.assign(state,patch); await audit("UPDATE",target); toast("Saved securely."); }catch(e){console.error(e);toast("Save failed — check permissions.");} }

function renderMenu(docs){ $("menuList").innerHTML=docs.map(x=>{const d=x.data();return `<div class="menu-item"><img class="food-img" src="${safeUrl(d.imageUrl)}" alt="" onerror="this.style.visibility='hidden'"><div><b>${esc(d.name||"Untitled")}</b><small>${esc(d.category||"")} · ${esc(d.description||"")}</small></div><strong>${esc(d.price||"")}</strong><div class="menu-actions"><button class="mini" data-edit="${x.id}">Edit</button><button class="mini" data-del="${x.id}">Delete</button></div></div>`}).join("")||'<p class="muted">No menu items yet.</p>'; document.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{if(!confirm("Delete this menu item?"))return;try{await deleteDoc(doc(db,"menuItems",b.dataset.del));await audit("DELETE","menuItems/"+b.dataset.del);toast("Item deleted.");loadData()}catch(e){toast("Delete blocked.");}}); document.querySelectorAll("[data-edit]").forEach(button => {

  button.onclick = async () => {

    try {

      const snapshot = await getDoc(
        doc(db, "menuItems", button.dataset.edit)
      );

      if (!snapshot.exists()) {
        toast("Menu item no longer exists.");
        return;
      }

      openMenuModal(
        snapshot.data(),
        snapshot.id
      );

    } catch (error) {

      console.error(error);

      toast("Could not open menu item.");

    }

  };

});}
function renderPromos(docs){
  if(!docs.size){
    $("promoList").innerHTML='<p class="muted">No promotions yet.</p>';
    return;
  }
  $("promoList").innerHTML=docs.docs.map(x=>{
    const d=x.data();
    return `<div class="row"><div><b>${esc(d.title||"Promotion")}</b><small>${esc(d.text||"")}</small></div><span class="safe">${d.enabled===false?"Hidden":"Active"}</span></div>`;
  }).join("");
}
async function loadAudit(){try{const q=query(collection(db,"auditLogs"),orderBy("createdAt","desc"),limit(30));const s=await getDocs(q);$("auditList").innerHTML=s.docs.map(x=>{const d=x.data();return `<div class="audit"><b>${esc(d.action||"WRITE")}</b> · ${esc(d.target||"") }<br><small>${esc(d.email||d.uid||"")} · ${d.createdAt?.toDate?d.createdAt.toDate().toLocaleString():"pending"}</small></div>`}).join("")||'<p class="muted">No audit entries.</p>'}catch(e){$("auditList").innerHTML='<p class="muted">Audit log unavailable.</p>'}}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function safeUrl(v){try{const u=new URL(v,location.origin); if(u.protocol==="https:"||u.origin===location.origin)return u.href}catch{} return ""}

document.querySelectorAll("nav button[data-page]").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(b.dataset.page).classList.add("active");$("pageTitle").textContent=b.textContent;});
$("loginForm").onsubmit=async e=>{e.preventDefault();$("loginError").textContent="";try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value); }catch(e){$("loginError").textContent="Sign-in failed. Check your credentials.";}}
$("logout").onclick=()=>signOut(auth);
$("preview").onclick=()=>window.open("https://bangarpetpanipuri.co.nz/","_blank");
$("saveGrand").onclick=()=>saveSite({grandOpening:{enabled:$("grandEnabled").checked,video:$("grandVideo").value.trim(),display:$("grandDisplay").value}},"grandOpening");
$("saveStory").onclick=()=>saveSite({story:{visible:$("storyVisible").checked,heading:$("storyHeading").value.trim(),text:$("storyText").value.trim()}},"story");
$("saveFeatured").onclick=()=>saveSite({featured:{visible:$("featuredVisible").checked,heading:$("featuredHeading").value.trim(),subheading:$("featuredSubheading").value.trim()}},"featured");
$("saveContact").onclick=()=>saveSite({contact:{visible:$("contactVisible").checked,phone:$("phone").value.trim(),email:$("contactEmail").value.trim(),whatsapp:$("whatsapp").value.trim()}},"contact");
$("saveSocial")?.addEventListener("click",()=>saveSite({social:{instagram:$("instagram").value.trim(),facebook:$("facebook").value.trim(),tiktok:$("tiktok").value.trim(),googleBusiness:$("googleBusiness").value.trim()}},"social"));
$("addMenu").onclick = () => {
  openMenuModal();
};
$("addPromo").onclick=()=>toast("Secure promotion editor is the next component.");

/*Menu Editing */
let editingMenuId = null;

function openMenuModal(item = null, id = null) {
  editingMenuId = id;

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "menuModal";

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <p class="eyebrow">MENU MANAGER</p>
          <h2>${item ? "Edit Menu Item" : "Add Menu Item"}</h2>
        </div>

        <button type="button" class="modal-close" id="closeMenuModal">
          ×
        </button>
      </div>

      <form id="menuForm">

        <label>
          Item name
          <input
            id="menuName"
            type="text"
            maxlength="100"
            required
            value="${esc(item?.name || "")}"
          >
        </label>

        <div class="two-col">

          <label>
            Price
            <input
              id="menuPrice"
              type="number"
              min="0"
              max="9999"
              step="0.01"
              required
              value="${item?.price ?? ""}"
            >
          </label>

          <label>
            Category
            <select id="menuCategory" required>
              <option value="">Select category</option>
              <option value="pani-puri" ${item?.category === "pani-puri" ? "selected" : ""}>
                Pani Puri
              </option>
              <option value="chats" ${item?.category === "chats" ? "selected" : ""}>
                Chats
              </option>
              <option value="beverages" ${item?.category === "beverages" ? "selected" : ""}>
                Beverages
              </option>
              <option value="combos" ${item?.category === "combos" ? "selected" : ""}>
                Combos
              </option>
            </select>
          </label>

        </div>

        <label>
          Description
          <textarea
            id="menuDescription"
            maxlength="1500"
            required
          >${esc(item?.description || "")}</textarea>
        </label>

        <label>
          Image path
          <input
            id="menuImage"
            type="text"
            maxlength="300"
            placeholder="/photos/Bhel%20Puri.png"
            value="${esc(item?.imageUrl || "")}"
          >
          <small class="muted">
            Example: /photos/Bhel%20Puri.png
          </small>
        </label>

        <div class="two-col">

          <label>
            Sort order
            <input
              id="menuSort"
              type="number"
              min="0"
              max="999"
              step="1"
              value="${item?.sortOrder ?? 1}"
            >
          </label>

          <div class="checkbox-group">

            <label class="check-label">
              <input
                id="menuVisible"
                type="checkbox"
                ${item?.visible !== false ? "checked" : ""}
              >
              <span>Visible on website</span>
            </label>

            <label class="check-label">
              <input
                id="menuFeatured"
                type="checkbox"
                ${item?.featured === true ? "checked" : ""}
              >
              <span>Featured item</span>
            </label>

          </div>

        </div>

        <div id="menuFormError" class="error"></div>

        <div class="modal-actions">
          <button type="button" class="secondary" id="cancelMenu">
            Cancel
          </button>

          <button type="submit" class="primary">
            ${item ? "Save Changes" : "Add Item"}
          </button>
        </div>

      </form>
    </div>
  `;

  document.body.appendChild(modal);

  $("closeMenuModal").onclick = closeMenuModal;
  $("cancelMenu").onclick = closeMenuModal;

  $("menuForm").onsubmit = saveMenuItem;
}


function closeMenuModal() {
  const modal = $("menuModal");

  if (modal) {
    modal.remove();
  }

  editingMenuId = null;
}

async function saveMenuItem(event) {
  event.preventDefault();

  const errorEl = $("menuFormError");

  errorEl.textContent = "";

  const name = $("menuName").value.trim();
  const price = Number($("menuPrice").value);
  const category = $("menuCategory").value;
  const description = $("menuDescription").value.trim();
  const imageUrl = $("menuImage").value.trim();
  const sortOrder = Number($("menuSort").value);
  const visible = $("menuVisible").checked;
  const featured = $("menuFeatured").checked;

  if (!name) {
    errorEl.textContent = "Item name is required.";
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    errorEl.textContent = "Enter a valid price.";
    return;
  }

  if (!category) {
    errorEl.textContent = "Please select a category.";
    return;
  }

  if (!description) {
    errorEl.textContent = "Description is required.";
    return;
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errorEl.textContent = "Sort order must be a whole number.";
    return;
  }

  const data = {
    name,
    price,
    category,
    description,
    imageUrl,
    visible,
    featured,
    sortOrder,
    updatedAt: serverTimestamp()
  };

  try {

    if (editingMenuId) {

      await setDoc(
        doc(db, "menuItems", editingMenuId),
        data,
        { merge: true }
      );

      await audit(
        "UPDATE",
        `menuItems/${editingMenuId}`
      );

      toast("Menu item updated.");

    } else {

      const newDoc = await addDoc(
        collection(db, "menuItems"),
        {
          ...data,
          createdAt: serverTimestamp()
        }
      );

      await audit(
        "CREATE",
        `menuItems/${newDoc.id}`
      );

      toast("Menu item added.");
    }

    closeMenuModal();

    await loadData();

  } catch (error) {

    console.error(error);

    errorEl.textContent =
      "Could not save this item. Check your permissions.";

  }
}

onAuthStateChanged(auth, async user=>{
  if(user){ $("authScreen").classList.add("hidden");$("app").classList.remove("hidden");$("userBadge").textContent=user.email||user.uid; await loadData(); }
  else{$("app").classList.add("hidden");$("authScreen").classList.remove("hidden");}
});
