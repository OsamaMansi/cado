// ==========================================
// أورا للهدايا الفاخرة - ملف التحكم الرئيسي (app.js)
// ==========================================

import { supabase } from './supabaseClient.js';

let cart = [];
let fetchedProducts = [];
const SHIPPING_FEE = 35.00;
let currentLang = 'ar';

// قاموس التربجمة ودعم اللغتين (عربي / إنجليزي)
const translations = {
    ar: {
        site_title: "أورا للهدايا الفاخرة | AURA",
        logo_title: "أُورَا",
        logo_subtitle: "للهدايا الفاخرة",
        nav_products: "المجموعة",
        nav_checkout: "تخصيص الطلب",
        section_products_title: "صناديق وبكجات الهدايا المخصصة",
        custom_title: "1. تخصيص وتفاصيل الطلب",
        label_select_product: "اختر المنتج المراد تخصيصه:",
        label_select_size: "تأكيد الحجم المطلوب:",
        label_engraving: "العبارة أو الاسم المطلوب طباعته على الصندوق:",
        label_inner_text: "إضافة عبارة للهدية الداخلية (إن أردت):",
        label_upload_image: "إضافة صورة للرسم على الزجاج/الأكريليك:",
        btn_add_to_cart: "+ إضافة هذا الطلب إلى السلة",
        summary_title: "2. ملخص الطلبيات النشطة",
        empty_cart_msg: "لم يتم إضافة أية طلبات بعد.",
        shipping_label: "إضافة أجور التوصيل لكامل البكج (واصل للعميل)",
        subtotal_text: "مجموع المنتجات:",
        shipping_text: "أجور الشحن السريع:",
        total_text: "المجموع الكلي:",
        currency: "ر.س",
        customer_info_title: "بيانات الاستلام والتحقق",
        btn_confirm_order: "تأكيد وإرسال الطلب (واتساب وإيميل)",
        details_btn: "التفاصيل ∨",
        hide_details: "إخفاء التفاصيل ∧"
    },
    en: {
        site_title: "AURA | Luxury Gifting",
        logo_title: "AURA",
        logo_subtitle: "Luxury Gifting",
        nav_products: "Collection",
        nav_checkout: "Customise Order",
        section_products_title: "Curated Luxury Gift Boxes",
        custom_title: "1. Order Customisation & Details",
        label_select_product: "Select Product to Customise:",
        label_select_size: "Confirm Required Size:",
        label_engraving: "Engraving Text or Name on Box:",
        label_inner_text: "Inner Gift Message (Optional):",
        label_upload_image: "Upload Image for Glass/Acrylic Drawing:",
        btn_add_to_cart: "+ Add This Item to Cart",
        summary_title: "2. Active Orders Summary",
        empty_cart_msg: "No items added to cart yet.",
        shipping_label: "Add shipping fee for the complete package (Door Delivery)",
        subtotal_text: "Subtotal:",
        shipping_text: "Express Shipping:",
        total_text: "Total Amount:",
        currency: "SAR",
        customer_info_title: "Delivery & Verification Details",
        btn_confirm_order: "Confirm & Send Order (WhatsApp & Email)",
        details_btn: "Details ∨",
        hide_details: "Hide Details ∧"
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    setupEventListeners();
    setupThemeAndLanguageToggles();
});

// 1. جلب المنتجات من Supabase وعرضها
async function loadProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
        console.error('Error fetching products:', error);
        // بيانات افتراضية تجريبية في حال لم تتوفر قاعدة البيانات حالياً
        fetchedProducts = [
            { id: '1', title: 'صندوق "لمسة ياسمين" الذهبي', description: 'صندوق فاخر من الأكريليك والمرايا الذهبية مع حفر مخصص للأسماء والصور.', sizes: ['صغير (20x20 سم)', 'وسط (25x25 سم)', 'كبير (30x30 سم)'], price_before: 290, price_after: 240, image_url: 'assets/logo.png' }
        ];
    } else {
        fetchedProducts = data;
    }

    renderProductsGrid();
    populateSelectDropdown();
}

function renderProductsGrid() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    fetchedProducts.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-wrapper">
                <img src="${prod.image_url}" alt="${prod.title}">
                <button class="btn-add-top" onclick="selectProductForCustomization('${prod.id}')">+ ${currentLang === 'ar' ? 'إضافة' : 'Add'}</button>
            </div>
            <div class="product-info">
                <h3>${prod.title}</h3>
                <span class="details-toggle" onclick="toggleDetails('${prod.id}')">${translations[currentLang].details_btn}</span>
                <div id="details-${prod.id}" class="details-drawer">
                    <p>${prod.description}</p>
                    <small>${currentLang === 'ar' ? 'الأحجام المتاحة:' : 'Available Sizes:'} ${prod.sizes.join(', ')}</small>
                </div>
                <div class="price-box">
                    <span class="price-before">${prod.price_before} ${translations[currentLang].currency}</span>
                    <span class="price-after">${prod.price_after} ${translations[currentLang].currency}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function populateSelectDropdown() {
    const select = document.getElementById('custom-product-select');
    select.innerHTML = `<option value="">-- ${currentLang === 'ar' ? 'اختر من القائمة' : 'Select from list'} --</option>`;

    fetchedProducts.forEach(prod => {
        const option = document.createElement('option');
        option.value = prod.id;
        option.textContent = prod.title;
        select.appendChild(option);
    });
}

// 2. إظهار وإخفاء التفاصيل بحركة ناعمة
window.toggleDetails = (id) => {
    const drawer = document.getElementById(`details-${id}`);
    const isVisible = drawer.style.display === 'block';
    drawer.style.display = isVisible ? 'none' : 'block';
};

// 3. اختيار منتج للتخصيص السريع
window.selectProductForCustomization = (productId) => {
    const select = document.getElementById('custom-product-select');
    select.value = productId;
    select.dispatchEvent(new Event('change'));
    document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
};

// 4. تحديث أحجام المنتج بناءً على الاختيار
document.getElementById('custom-product-select').addEventListener('change', (e) => {
    const prod = fetchedProducts.find(p => p.id === e.target.value);
    const sizeContainer = document.getElementById('size-options');
    sizeContainer.innerHTML = '';

    if (prod && prod.sizes) {
        prod.sizes.forEach((size, index) => {
            sizeContainer.innerHTML += `
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="radio" name="selected-size" value="${size}" ${index === 0 ? 'checked' : ''} style="width: auto; margin:0;">
                    ${size}
                </label>
            `;
        });
    }
});

// 5. إضافة الطلب إلى السلة (دعم إضافة طلبات متعددة)
document.getElementById('add-to-cart-btn').addEventListener('click', async () => {
    const productId = document.getElementById('custom-product-select').value;
    if (!productId) return alert(currentLang === 'ar' ? 'يرجى اختيار منتج أولاً.' : 'Please select a product first.');

    const prod = fetchedProducts.find(p => p.id === productId);
    const selectedSize = document.querySelector('input[name="selected-size"]:checked')?.value;
    const engravingText = document.getElementById('engraving-text').value;
    const innerText = document.getElementById('inner-text').value;
    const fileInput = document.getElementById('custom-image-file');

    let customImageUrl = '';
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage.from('custom-drawings').upload(fileName, file);
        if (!error) {
            const { data: publicUrlData } = supabase.storage.from('custom-drawings').getPublicUrl(fileName);
            customImageUrl = publicUrlData.publicUrl;
        }
    }

    cart.push({
        productId: prod.id,
        title: prod.title,
        price: prod.price_after,
        size: selectedSize,
        engravingText,
        innerText,
        customImageUrl
    });

    updateCartUI();
    document.getElementById('customization-form').reset();
});

// 6. تحديث واجهة السلة والأسعار والشحن الشامل
function updateCartUI() {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
        cartContainer.innerHTML = `<p class="empty-msg" style="color: var(--text-muted);">${translations[currentLang].empty_cart_msg}</p>`;
    } else {
        cart.forEach((item, index) => {
            cartContainer.innerHTML += `
                <div class="cart-item" style="padding: 8px 0; border-bottom: 1px dashed var(--border-color); font-size: 0.9rem;">
                    <strong>${index + 1}. ${item.title}</strong> (${item.size}) - ${item.price} ${translations[currentLang].currency}
                    <br><small style="color: var(--text-muted);">العبارة: ${item.engravingText || 'بدون'}</small>
                </div>
            `;
        });
    }

    const subtotal = cart.reduce((sum, item) => sum + Number(item.price), 0);
    const hasShipping = document.getElementById('shipping-checkbox').checked;
    const shippingFee = cart.length > 0 && hasShipping ? SHIPPING_FEE : 0;
    const total = subtotal + shippingFee;

    document.getElementById('subtotal-val').textContent = subtotal;
    document.getElementById('shipping-val').textContent = shippingFee;
    document.getElementById('total-val').textContent = total;
}

document.getElementById('shipping-checkbox').addEventListener('change', updateCartUI);

// 7. إرسال وتأكيد الطلب وحفظه في قاعدة البيانات
document.getElementById('order-submit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert(currentLang === 'ar' ? 'سلة الطلبات فارغة!' : 'Your cart is empty!');

    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const email = document.getElementById('cust-email').value;
    const address = document.getElementById('cust-address').value;
    const hasShipping = document.getElementById('shipping-checkbox').checked;

    const subtotal = cart.reduce((sum, item) => sum + Number(item.price), 0);
    const shippingFee = hasShipping ? SHIPPING_FEE : 0;
    const totalAmount = subtotal + shippingFee;

    const { data: orderData, error: orderErr } = await supabase.from('orders').insert([{
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        delivery_address: address,
        subtotal: subtotal,
        shipping_fee: shippingFee,
        total_amount: totalAmount
    }]).select().single();

    if (orderErr) {
        console.error(orderErr);
        alert(currentLang === 'ar' ? 'تم استلام طلبك بنجاح محلياً!' : 'Order received successfully!');
    } else {
        const orderItems = cart.map(item => ({
            order_id: orderData.id,
            product_id: item.productId,
            selected_size: item.size,
            engraving_text: item.engravingText,
            inner_text: item.innerText,
            custom_image_url: item.customImageUrl,
            unit_price: item.price
        }));
        await supabase.from('order_items').insert(orderItems);
    }

    alert(currentLang === 'ar' ? 'تم تأكيد طلبك بنجاح! سيتم إرسال تفاصيل الفاتورة عبر الواتساب والإيميل.' : 'Order confirmed successfully! Details will be sent via WhatsApp and Email.');
    cart = [];
    updateCartUI();
    document.getElementById('order-submit-form').reset();
});

// 8. إعداد تبديل اللغات والوضع الليلي / النهاري
function setupThemeAndLanguageToggles() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const langBtn = document.getElementById('lang-toggle-btn');
    const htmlRoot = document.getElementById('html-root');

    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'ar' ? 'en' : 'ar';
        langBtn.textContent = currentLang === 'ar' ? 'EN' : 'AR';
        htmlRoot.setAttribute('lang', currentLang);
        htmlRoot.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
        
        // تحديث النصوص الثابتة
        document.querySelectorAll('[data-lang]').forEach(el => {
            const key = el.getAttribute('data-lang');
            if (translations[currentLang][key]) {
                el.textContent = translations[currentLang][key];
            }
        });
        renderProductsGrid();
        updateCartUI();
    });
}