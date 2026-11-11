// ==========================================
// أورا للهدايا الفاخرة - ملف إدارة التحكم الشاملة (admin.js)
// النسخة المحدثة: حماية الصفحة بتسجيل الدخول + رفع الصور المباشر من الجهاز
// ==========================================

import { supabase } from './supabaseClient.js';

let adminProducts = [];
let shippingZones = [];
let adminUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. التحقق من حماية الجلسة وتسجيل الدخول أولاً
    checkAuthSession();

    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLoginFormSubmit);

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // إذا كان المستخدم مسبقاً في حالة تسجيل دخول صحيحة
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        await initAdminPanelData();
    }
});

// دالة حماية الصفحة والتحقق من الجلسة
function checkAuthSession() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    const overlay = document.getElementById('login-overlay');
    const mainWrapper = document.getElementById('admin-main-wrapper');

    if (isLoggedIn) {
        if (overlay) overlay.style.display = 'none';
        if (mainWrapper) mainWrapper.style.display = 'block';
    } else {
        if (overlay) overlay.style.display = 'flex';
        if (mainWrapper) mainWrapper.style.display = 'none';
    }
}

// دالة تسجيل الدخول والتحقق من اسم المستخدم وكلمة المرور (admin / admin123)
async function handleLoginFormSubmit(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value.trim();
    const errorMsg = document.getElementById('login-error');

    try {
        const { data, error } = await supabase.from('admin_users').select('*').eq('username', usernameInput).eq('password_hash', passwordInput).single();

        if (!error && data) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminUsername', data.username);
            if (errorMsg) errorMsg.style.display = 'none';
            checkAuthSession();
            await initAdminPanelData();
            return;
        }
    } catch (err) {
        console.log('Database auth fallback check...');
    }

    // التحقق الاحتياطي الافتراضي
    if (usernameInput === 'admin' && passwordInput === 'admin123') {
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminUsername', 'admin');
        if (errorMsg) errorMsg.style.display = 'none';
        checkAuthSession();
        await initAdminPanelData();
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
    }
}

function handleLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUsername');
    location.reload();
}

async function initAdminPanelData() {
    await fetchAdminProducts();
    await fetchShippingZones();
    await fetchAdminUsers();
    await fetchSiteSettings();
    setupProductImageUploader();
    setupLivePreviewListeners();

    const productForm = document.getElementById('product-form');
    if (productForm) productForm.addEventListener('submit', handleProductSubmit);

    const resetBtn = document.getElementById('reset-form-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            productForm.reset();
            document.getElementById('prod-id').value = '';
            document.getElementById('form-title').textContent = '➕ إضافة منتج جديد';
        });
    }

    const designForm = document.getElementById('design-settings-form');
    if (designForm) designForm.addEventListener('submit', handleDesignSettingsSubmit);

    const customForm = document.getElementById('customization-options-form');
    if (customForm) customForm.addEventListener('submit', handleCustomizationOptionsSubmit);

    const shippingForm = document.getElementById('shipping-zone-form');
    if (shippingForm) shippingForm.addEventListener('submit', handleShippingZoneSubmit);

    const userForm = document.getElementById('user-management-form');
    if (userForm) userForm.addEventListener('submit', handleUserSubmit);
}

// 2. دالة اختيار ورفع صورة المنتج مباشرة من جهاز الكمبيوتر / الهاتف
function setupProductImageUploader() {
    const fileInput = document.getElementById('prod-img-file');
    const urlInput = document.getElementById('prod-image');
    const statusDiv = document.getElementById('admin-upload-status');

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (statusDiv) {
                statusDiv.style.display = 'block';
                statusDiv.style.color = 'var(--gold-primary)';
                statusDiv.textContent = '⏳ جاري رفع الصورة من جهازك إلى السيرفر...';
            }

            const fileName = `product_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

            try {
                const { data, error } = await supabase.storage.from('custom-drawings').upload(fileName, file);

                if (error) throw error;

                const { data: publicUrlData } = supabase.storage.from('custom-drawings').getPublicUrl(fileName);

                if (publicUrlData && publicUrlData.publicUrl) {
                    if (urlInput) urlInput.value = publicUrlData.publicUrl;
                    if (statusDiv) {
                        statusDiv.style.color = '#27ae60';
                        statusDiv.textContent = '✅ تم رفع الصورة بنجاح وتعين رابطها في الحقل!';
                    }
                }
            } catch (err) {
                console.error('File upload error:', err);
                if (statusDiv) {
                    statusDiv.style.color = '#e74c3c';
                    statusDiv.textContent = '❌ تعذر الرفع: ' + (err.message || 'خطأ في التخزين');
                }
            }
        });
    }
}

// 3. التنقل بين علامات التبويب الرئيسية
window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');

    const clickedBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
    if (clickedBtn) clickedBtn.classList.add('active');
};

// 4. إدارة المنتجات (جلب، عرض، إضافة، تعديل، نسخ، حذف)
async function fetchAdminProducts() {
    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (!error && data) {
            adminProducts = data.map(p => ({
                ...p,
                sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes
            }));
            renderAdminTable();
        }
    } catch (err) {
        console.error('Error fetching products:', err);
    }
}

function renderAdminTable() {
    const tbody = document.getElementById('admin-products-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (adminProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">لا توجد منتجات مسجلة حالياً.</td></tr>`;
        return;
    }

    adminProducts.forEach((prod) => {
        let sizesSummary = prod.sizes.map(s => `${s.name.split(' ')[0]}: ${s.price_after}د.أ`).join(' | ');
        
        tbody.innerHTML += `
            <tr>
                <td><img src="${prod.image_url}" alt="" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid var(--gold-primary);"></td>
                <td><strong>${prod.title}</strong><br><small style="color:var(--text-muted);">${prod.description ? prod.description.substring(0, 35) + '...' : ''}</small></td>
                <td><small>${sizesSummary}</small></td>
                <td>
                    <button class="btn-action btn-edit" onclick="window.editProduct('${prod.id}')">تعديل</button>
                    <button class="btn-action btn-copy" onclick="window.duplicateProduct('${prod.id}')">نسخ</button>
                    <button class="btn-action btn-delete" onclick="window.deleteProduct('${prod.id}')">حذف</button>
                </td>
            </tr>
        `;
    });
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const title = document.getElementById('prod-title').value;
    const description = document.getElementById('prod-desc').value;
    const imageUrl = document.getElementById('prod-image').value;

    const sizes = [
        {
            name: document.getElementById('sz-0-name').value,
            price_before: parseFloat(document.getElementById('sz-0-before').value) || 0,
            price_after: parseFloat(document.getElementById('sz-0-after').value) || 0
        },
        {
            name: document.getElementById('sz-1-name').value,
            price_before: parseFloat(document.getElementById('sz-1-before').value) || 0,
            price_after: parseFloat(document.getElementById('sz-1-after').value) || 0
        },
        {
            name: document.getElementById('sz-2-name').value,
            price_before: parseFloat(document.getElementById('sz-2-before').value) || 0,
            price_after: parseFloat(document.getElementById('sz-2-after').value) || 0
        }
    ];

    const productData = { title, description, sizes, image_url: imageUrl };

    if (id) {
        const { error } = await supabase.from('products').update(productData).eq('id', id);
        if (error) return alert('خطأ أثناء التحديث: ' + error.message);
        alert('✅ تم تحديث المنتج بنجاح!');
    } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) return alert('خطأ أثناء الإضافة: ' + error.message);
        alert('✅ تم إضافة المنتج بنجاح!');
    }

    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('form-title').textContent = '➕ إضافة منتج جديد';
    const statusDiv = document.getElementById('admin-upload-status');
    if (statusDiv) statusDiv.style.display = 'none';
    await fetchAdminProducts();
}

window.editProduct = (id) => {
    const prod = adminProducts.find(p => p.id == id);
    if (!prod) return;

    document.getElementById('prod-id').value = prod.id;
    document.getElementById('prod-title').value = prod.title;
    document.getElementById('prod-desc').value = prod.description || '';
    document.getElementById('prod-image').value = prod.image_url;

    if (prod.sizes && prod.sizes.length >= 3) {
        document.getElementById('sz-0-before').value = prod.sizes[0].price_before;
        document.getElementById('sz-0-after').value = prod.sizes[0].price_after;
        document.getElementById('sz-1-before').value = prod.sizes[1].price_before;
        document.getElementById('sz-1-after').value = prod.sizes[1].price_after;
        document.getElementById('sz-2-before').value = prod.sizes[2].price_before;
        document.getElementById('sz-2-after').value = prod.sizes[2].price_after;
    }

    document.getElementById('form-title').textContent = '✏️ تعديل المنتج';
    window.switchTab('tab-products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.duplicateProduct = async (id) => {
    const prod = adminProducts.find(p => p.id == id);
    if (!prod) return;

    const duplicatedData = {
        title: prod.title + ' (نسخة)',
        description: prod.description,
        sizes: prod.sizes,
        image_url: prod.image_url
    };

    const { error } = await supabase.from('products').insert([duplicatedData]);
    if (error) return alert('خطأ أثناء النسخ: ' + error.message);
    alert('📋 تم نسخ المنتج بنجاح!');
    await fetchAdminProducts();
};

window.deleteProduct = async (id) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return alert('خطأ أثناء الحذف: ' + error.message);
    alert('🗑️ تم حذف المنتج بنجاح!');
    await fetchAdminProducts();
};

// 5. التحكم في ألوان وتصميم الموقع وحفظ الإعدادات في Supabase
async function fetchSiteSettings() {
    try {
        const { data, error } = await supabase.from('site_settings').select('*');
        if (!error && data) {
            data.forEach(item => {
                const el = document.getElementById(item.setting_key);
                if (el) el.value = item.setting_value;
            });
            updateLivePreview();
        }
    } catch (e) {
        console.error('Settings fetch error:', e);
    }
}

async function handleDesignSettingsSubmit(e) {
    e.preventDefault();
    const settings = [
        { setting_key: 'theme-border-color', setting_value: document.getElementById('theme-border-color').value },
        { setting_key: 'theme-bg-color', setting_value: document.getElementById('theme-bg-color').value },
        { setting_key: 'theme-frame-color', setting_value: document.getElementById('theme-frame-color').value },
        { setting_key: 'theme-text-color', setting_value: document.getElementById('theme-text-color').value },
        { setting_key: 'theme-font-family', setting_value: document.getElementById('theme-font-family').value },
        { setting_key: 'theme-font-size', setting_value: document.getElementById('theme-font-size').value },
        { setting_key: 'theme-bg-image', setting_value: document.getElementById('theme-bg-image').value },
        { setting_key: 'site-name-input', setting_value: document.getElementById('site-name-input').value },
        { setting_key: 'logo-day-input', setting_value: document.getElementById('logo-day-input').value },
        { setting_key: 'logo-night-input', setting_value: document.getElementById('logo-night-input').value },
        { setting_key: 'hero-img-input', setting_value: document.getElementById('hero-img-input').value },
        { setting_key: 'hero-text-input', setting_value: document.getElementById('hero-text-input').value },
        { setting_key: 'products-count-limit', setting_value: document.getElementById('products-count-limit').value }
    ];

    for (const setting of settings) {
        await supabase.from('site_settings').upsert(setting, { onConflict: 'setting_key' });
    }
    alert('🎨 تم حفظ إعدادات التصميم والألوان بنجاح!');
}

function setupLivePreviewListeners() {
    const inputs = ['theme-border-color', 'theme-bg-color', 'theme-frame-color', 'theme-text-color', 'site-name-input', 'logo-day-input', 'hero-img-input', 'hero-text-input'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateLivePreview);
    });
}

function updateLivePreview() {
    const previewBox = document.getElementById('live-preview-box');
    if (!previewBox) return;

    const borderColor = document.getElementById('theme-border-color').value;
    const bgColor = document.getElementById('theme-bg-color').value;
    const frameColor = document.getElementById('theme-frame-color').value;
    const textColor = document.getElementById('theme-text-color').value;
    const siteTitle = document.getElementById('site-name-input').value;
    const logoUrl = document.getElementById('logo-day-input').value;
    const heroImgUrl = document.getElementById('hero-img-input').value;
    const heroText = document.getElementById('hero-text-input').value;

    previewBox.style.borderColor = borderColor;
    previewBox.style.backgroundColor = bgColor;
    previewBox.style.color = textColor;

    const prevTitle = document.getElementById('prev-site-title');
    if (prevTitle) prevTitle.textContent = siteTitle || 'أورا للهدايا الفاخرة';

    const prevLogo = document.getElementById('prev-logo-img');
    if (prevLogo && logoUrl) prevLogo.src = logoUrl;

    const prevHeroImg = document.getElementById('prev-hero-img');
    if (prevHeroImg) {
        if (heroImgUrl) prevHeroImg.src = heroImgUrl;
        prevHeroImg.style.borderColor = frameColor;
    }

    const prevHeroHeading = document.getElementById('prev-hero-heading');
    if (prevHeroHeading) prevHeroHeading.textContent = heroText;
}

// 6. حفظ وتعديل خيارات التخصيص والمنتجات
async function handleCustomizationOptionsSubmit(e) {
    e.preventDefault();
    const leather = document.getElementById('opt-leather-colors').value;
    const covers = document.getElementById('opt-cover-types').value;
    const gifts = document.getElementById('opt-extra-gifts').value;
    const perfumes = document.getElementById('opt-perfumes').value;

    await supabase.from('site_settings').upsert({ setting_key: 'opt-leather-colors', setting_value: leather }, { onConflict: 'setting_key' });
    await supabase.from('site_settings').upsert({ setting_key: 'opt-cover-types', setting_value: covers }, { onConflict: 'setting_key' });
    await supabase.from('site_settings').upsert({ setting_key: 'opt-extra-gifts', setting_value: gifts }, { onConflict: 'setting_key' });
    await supabase.from('site_settings').upsert({ setting_key: 'opt-perfumes', setting_value: perfumes }, { onConflict: 'setting_key' });

    alert('⚙️ تم حفظ خيارات التخصيص والعطور بنجاح!');
}

// 7. إدارة أجور ومناطق التوصيل
async function fetchShippingZones() {
    try {
        const { data, error } = await supabase.from('shipping_zones').select('*');
        if (!error && data) {
            shippingZones = data;
            renderShippingZonesTable();
        }
    } catch (e) {
        console.error('Shipping fetch error:', e);
    }
}

function renderShippingZonesTable() {
    const tbody = document.getElementById('shipping-zones-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    shippingZones.forEach(zone => {
        tbody.innerHTML += `
            <tr>
                <td>${zone.zone_name}</td>
                <td>${Number(zone.shipping_price).toFixed(2)} د.أ</td>
                <td><button class="btn-action btn-delete" onclick="window.deleteShippingZone('${zone.id}')">حذف</button></td>
            </tr>
        `;
    });
}

async function handleShippingZoneSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('zone-name').value;
    const price = parseFloat(document.getElementById('zone-price').value) || 0;

    const { error } = await supabase.from('shipping_zones').insert([{ zone_name: name, shipping_price: price }]);
    if (error) return alert('خطأ في إضافة المنطقة: ' + error.message);

    alert('🚚 تم إضافة منطقة التوصيل بنجاح!');
    document.getElementById('shipping-zone-form').reset();
    await fetchShippingZones();
}

window.deleteShippingZone = async (id) => {
    if (!confirm('حذف هذه المنطقة؟')) return;
    await supabase.from('shipping_zones').delete().eq('id', id);
    await fetchShippingZones();
};

// 8. إدارة المستخدمين والصلاحيات وتعديل كلمات المرور
async function fetchAdminUsers() {
    try {
        const { data, error } = await supabase.from('admin_users').select('*');
        if (!error && data) {
            adminUsers = data;
            renderAdminUsersTable();
        }
    } catch (e) {
        console.error('User fetch error:', e);
    }
}

function renderAdminUsersTable() {
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    adminUsers.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${u.username}</strong></td>
                <td>${u.role === 'admin' ? 'مدير كامل الصلاحيات' : 'مشرف'}</td>
                <td><small>${new Date(u.created_at).toLocaleDateString('ar-EG')}</small></td>
                <td><button class="btn-action btn-delete" onclick="window.deleteUser('${u.id}')">حذف</button></td>
            </tr>
        `;
    });
}

async function handleUserSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('user-username').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;

    const { error } = await supabase.from('admin_users').upsert({ username, password_hash: password, role }, { onConflict: 'username' });
    if (error) return alert('خطأ في حفظ المستخدم: ' + error.message);

    alert('👤 تم حفظ المستخدم وتحديث كلمة المرور بنجاح!');
    document.getElementById('user-management-form').reset();
    await fetchAdminUsers();
}

window.deleteUser = async (id) => {
    if (!confirm('حذف هذا المستخدم؟')) return;
    await supabase.from('admin_users').delete().eq('id', id);
    await fetchAdminUsers();
};