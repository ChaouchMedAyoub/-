let currentCategory = 'all';
let storeProducts = JSON.parse(localStorage.getItem('products')) || [];
let myCart = [];
let isAdmin = false;
let syncSecs = 5;
let currentCat = 'all';
let activePay = null;
// دالة مساعدة لتحويل اسم الفئة للعربية
function getCategoryArName(cat) {
    const names = { 'electronics': 'إلكترونيات', 'fashion': 'ملابس', 'home': 'منزل' };
    return names[cat] || 'عام';
}

// --- نظام المزامنة ---
setInterval(() => {
    syncSecs--;
    document.getElementById('sync-timer').innerText = syncSecs;
    if(syncSecs <= 0) {
        const data = JSON.parse(localStorage.getItem('products')) || [];
        if(JSON.stringify(data) !== JSON.stringify(storeProducts)) {
            storeProducts = data;
            renderStore();
        }
        syncSecs = 5;
    }
}, 1000);

// --- الإشعارات ---
function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderRightColor = type === 'success' ? '#22c55e' : '#ef4444';
    toast.innerHTML = `<b>${msg}</b>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3000);
}

// 3. دالة العرض (محدثة لتدعم الفلترة)
function renderStore(filterText = "") {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    const filtered = storeProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(filterText.toLowerCase());
        const matchesCat = (currentCategory === 'all') || (p.category === currentCategory);
        return matchesSearch && matchesCat;
    });

    if(filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#94a3b8;">لا توجد منتجات في هذا القسم حالياً</div>';
    }

    filtered.forEach(p => {
        const deleteBtn = isAdmin ? `<button class="delete-badge" onclick="deleteFromStore(${p.id})"><i class="fas fa-trash"></i></button>` : '';
        grid.innerHTML += `
            <div class="card fade-in">
                ${deleteBtn}
                <img src="${p.image}" class="card-img" alt="${p.name}">
                <div class="card-body">
                    <small style="color:var(--primary); font-weight:bold;">${getCategoryArName(p.category)}</small>
                    <h4 class="card-title" style="margin-top:5px;">${p.name}</h4>
                    <span class="card-price">${p.price.toLocaleString()} $</span>
                    <button class="btn-add" onclick="addToMyCart(${p.id})">
                        <i class="fas fa-cart-plus"></i> إضافة للسلة
                    </button>
                </div>
            </div>`;
    });
}

// 2. دالة التصفية (جديدة)
function filterCategory(cat, btn) {
    currentCategory = cat;
    // تحديث شكل الأزرار
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderStore();
}

// 1. دالة إضافة المنتج (محدثة)
function addNewProductToStore() {
    const name = document.getElementById('prod-name').value;
    const price = document.getElementById('prod-price').value;
    const category = document.getElementById('prod-category').value; // جلب الفئة
    const imgInput = document.getElementById('prod-image');

    if(!name || !price || !category || !imgInput.files[0]) {
        return showToast("يرجى ملء جميع الحقول واختيار الفئة!", "error");
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const newProd = { 
            id: Date.now(), 
            name, 
            price: parseFloat(price), 
            category: category, // حفظ الفئة
            image: e.target.result 
        };
        
        storeProducts.push(newProd);
        localStorage.setItem('products', JSON.stringify(storeProducts));
showToast(`تمت إضافة "${name}" إلى قسم ${getCategoryArName(category)} بنجاح!`);
// إعادة تعيين النموذج
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-price').value = '';
        document.getElementById('prod-category').value = '';
        document.getElementById('img-preview-area').innerHTML = '<i class="fas fa-cloud-upload-alt fa-3x"></i><p>اضغط لرفع صورة المنتج</p>';
        document.getElementById('img-preview-area').style.backgroundImage = 'none';
        
        switchTab('store');
        renderStore();
    };
    reader.readAsDataURL(imgInput.files[0]);
}

// --- السلة والدفع ---
function addToCart(id) {
    const p = storeProducts.find(x => x.id === id);
    myCart.push(p);
    document.getElementById('cart-badge').innerText = myCart.length;
    showToast(`تمت إضافة ${p.name}`);
}

function renderCartPage() {
    const list = document.getElementById('cart-display-list');
    list.innerHTML = '';
    let total = 0;
    myCart.forEach((item, i) => {
        total += item.price;
        list.innerHTML += `<div class="cart-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
            <span>${item.name}</span><b>${item.price} $</b>
        </div>`;
    });
    document.getElementById('total-price').innerText = total + " $";
}

function setPayment(type) {
    activePay = type;
    document.getElementById('form-card').classList.add('hidden');
    document.getElementById('form-cash').classList.add('hidden');
    document.getElementById('form-' + type).classList.remove('hidden');
}

function confirmPurchase() {
    if(myCart.length === 0) return showToast("السلة فارغة", "error");
    if(!activePay) return showToast("اختر طريقة دفع", "error");
    showToast("🎉 تم استلام طلبك بنجاح!");
    myCart = []; document.getElementById('cart-badge').innerText = "0";
    switchTab('store');
}

// --- أساسيات ---
function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(id + '-section').classList.remove('hidden');
    if(id === 'cart') renderCartPage();
}

function login() {
    if(document.getElementById('login-email').value === 'admin@gmail.adm') {
        isAdmin = true;
        document.getElementById('seller-menu-item').classList.remove('hidden');
        closeModal('login-modal');
        renderStore();
        showToast("مرحباً أيها المدير");
    }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function searchProducts() { renderStore(document.getElementById('main-search').value); }
function previewImage(input) {
    const area = document.getElementById('img-preview-area');
    area.style.backgroundImage = `url(${URL.createObjectURL(input.files[0])})`;
    area.innerHTML = '';
}
window.onload = renderStore;