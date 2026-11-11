// ==========================================
// أورا للهدايا الفاخرة - ملف التحكم الرئيسي (app.js)
// النسخة المحدثة: معالجة التكرار + الحسابات اللحظية المباشرة للمجموع الكلي والشحن
// ==========================================

import { supabase } from './supabaseClient.js';

let cart = [];
let fetchedProducts = [];
let currentUploadedImageUrl = '';
let currentLang = 'ar';

const translations = {
    ar: {
        site_title: "أورا للهدايا الفاخرة | AURA",
        nav_home: "الرئيسية",
        nav_products: "البكجات الفاخرة",
        nav_checkout: "صمّم صندوقك",
        nav_contact: "اتصل بنا",
        hero_heading: "فن العطاء بلمسة من الفخامة والذوق الرفيع",
        hero_desc: "نصنع لك بكجات وصناديق هدايا فائقة الرقي، مع حفر ورسم مخصص على الزجاج، الأكريليك والرخام لتبقى ذكرياتكم خالدة.",
        btn_design_now: "صمّم هديتك الآن",
        btn_explore: "اكتشف المجموعة",
        section_products_title: "صناديق وبكجات الهدايا المخصصة",
        checkout_main_title: "شاشة إضافة وتخصيص الطلبية",
        custom_title: "1. تخصيص وتفاصيل المنتج",
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
        currency: "د.أ",
        customer_info_title: "بيانات الاستلام والتحقق",
        btn_confirm_order: "تأكيد وإرسال الطلب",
        details_btn: "التفاصيل ∨",
        hide_details: "إخفاء التفاصيل ∧",
        add_btn_text: "إضافة"
    },
    en: {
        site_title: "AURA | Luxury Gifting",
        nav_home: "Home",
        nav_products: "Curated Boxes",
        nav_checkout: "Build a Box",
        nav_contact: "Contact Us",
        hero_heading: "The Art of Thoughtful Giving with Exquisite Luxury",
        hero_desc: "Hand-curated, premium gift collections wrapped in elegance and crafted with custom glass, acrylic and marble engraving.",
        btn_design_now: "Design Your Gift",
        btn_explore: "Discover Collection",
        section_products_title: "Curated Luxury Gift Boxes",
        checkout_main_title: "Order Customization & Checkout",
        custom_title: "1. Product Customization & Details",
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
        currency: "JOD",
        customer_info_title: "Delivery & Verification Details",
        btn_confirm_order: "Confirm & Send Order",
        details_btn: "Details ∨",
        hide_details: "Hide Details ∧",
        add_btn_text: "Add"
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    setupThemeAndLanguageToggles();
    setupImageUploaderPreview();
    setupVisitorCounter();
    setupShippingListeners();
});

// 1. إدارة عداد الزيارات الفعلي ابتداءً من 51433
async function setupVisitorCounter() {
    try {
        let { data, error } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'visitor_count').single();
        let count = 51433;
        if (!error && data) {
            count = parseInt(data.setting_value) + 1;
            await supabase.from('site_settings').update({ setting_value: count.toString() }).eq('setting_key', 'visitor_count');
        } else {
            await supabase.from('site_settings').insert([{ setting_key: 'visitor_count', setting_value: '51433' }]);
        }
        
        const counterEl = document.getElementById('counter-num');
        if (counterEl) counterEl.textContent = count;
    } catch (e) {
        console.error('Visitor counter error:', e);
    }
}

// 2. جلب وتعبئة المنتجات من Supabase
async function loadProducts() {
    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        fetchedProducts = data ? data.map(p => ({ ...p, sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes })) : [];
    } catch (err) {
        console.error('Error fetching products:', err);
        fetchedProducts = [];
    }
    renderProductsGrid();
    populateSelectDropdown();
}

function renderProductsGrid() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (fetchedProducts.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">لا توجد منتجات مسجلة.</p>`;
        return;
    }

    fetchedProducts.forEach((prod) => {
        const defaultSize = prod.sizes && prod.sizes[0] ? prod.sizes[0] : { price_before: 0, price_after: 0 };
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-wrapper">
                <img src="${prod.image_url}" alt="${prod.title}">
                <button class="btn-add-top" onclick="window.selectProductForCustomization('${prod.id}')">+ ${translations[currentLang].add_btn_text}</button>
            </div>
            <div class="product-info">
                <h3>${prod.title}</h3>
                <span class="details-toggle" onclick="window.toggleDetails('${prod.id}')">${translations[currentLang].details_btn}</span>
                <div id="details-${prod.id}" class="details-drawer">
                    <p>${prod.description || ''}</p>
                    <small>الأحجام المتاحة: ${prod.sizes.map(s => s.name).join(', ')}</small>
                </div>
                <div class="price-box">
                    <span class="price-before">${Number(defaultSize.price_before).toFixed(2)} ${translations[currentLang].currency}</span>
                    <span class="price-after">${Number(defaultSize.price_after).toFixed(2)} ${translations[currentLang].currency}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function populateSelectDropdown() {
    const select = document.getElementById('custom-product-select');
    if (!select) return;
    select.innerHTML = `<option value="">-- اختر المنتج --</option>`;
    fetchedProducts.forEach(prod => {
        const option = document.createElement('option');
        option.value = prod.id;
        option.textContent = prod.title;
        select.appendChild(option);
    });
}

window.toggleDetails = (id) => {
    const drawer = document.getElementById(`details-${id}`);
    if (drawer) drawer.style.display = drawer.style.display === 'block' ? 'none' : 'block';
};

window.selectProductForCustomization = (productId) => {
    const select = document.getElementById('custom-product-select');
    if (select) {
        select.value = productId;
        select.dispatchEvent(new Event('change'));
        document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
    }
};

function setupImageUploaderPreview() {
    const fileInput = document.getElementById('custom-image-file');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('upload-preview-img');

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    previewImg.src = ev.target.result;
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);

                const fileName = `${Date.now()}_${file.name}`;
                try {
                    const { error } = await supabase.storage.from('custom-drawings').upload(fileName, file);
                    if (!error) {
                        const { data: publicUrlData } = supabase.storage.from('custom-drawings').getPublicUrl(fileName);
                        currentUploadedImageUrl = publicUrlData.publicUrl;
                    }
                } catch (err) {
                    console.error('Storage error:', err);
                }
            }
        });
    }
}

// 3. اختيار المنتج وتحديث خيارات الأحجام
const productSelectEl = document.getElementById('custom-product-select');
if (productSelectEl) {
    productSelectEl.addEventListener('change', (e) => {
        const prod = fetchedProducts.find(p => p.id == e.target.value);
        const sizeContainer = document.getElementById('size-options');
        if (!sizeContainer) return;
        sizeContainer.innerHTML = '';

        if (prod && prod.sizes) {
            prod.sizes.forEach((sizeObj, index) => {
                sizeContainer.innerHTML += `
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="radio" name="selected-size" value="${sizeObj.name}" data-price="${sizeObj.price_after}" ${index === 0 ? 'checked' : ''} style="width: auto; margin:0;">
                        ${sizeObj.name} (${Number(sizeObj.price_after).toFixed(2)} د.أ)
                    </label>
                `;
            });
        }
    });
}

// 4. إضافة المنتج للسلة واحتساب الخصومات والإضافات بدقة
const addToCartBtn = document.getElementById('add-to-cart-btn');
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
        const productId = document.getElementById('custom-product-select').value;
        if (!productId) return alert('يرجى اختيار منتج أولاً.');

        const prod = fetchedProducts.find(p => p.id == productId);
        const selectedSizeRadio = document.querySelector('input[name="selected-size"]:checked');
        const selectedSize = selectedSizeRadio ? selectedSizeRadio.value : 'افتراضي';
        let basePrice = selectedSizeRadio ? parseFloat(selectedSizeRadio.getAttribute('data-price')) : (prod.sizes[0] ? prod.sizes[0].price_after : 0);

        const leatherColor = document.getElementById('leather-color-select') ? document.getElementById('leather-color-select').value : 'أسود';
        const coverType = document.getElementById('cover-type-select') ? document.getElementById('cover-type-select').value : 'زجاج';
        const perfumeType = document.getElementById('perfume-type-select') ? document.getElementById('perfume-type-select').value : 'هوجو';

        // خصومات نوع الكفر
        if (coverType === 'أكريليك' || coverType === 'اكريليك') basePrice -= 3;
        if (coverType === 'بلا') basePrice -= 5;

        // إضافات الهدايا الإضافية (+5 لكل هدية)
        let selectedGifts = [];
        document.querySelectorAll('.extra-gift-chk:checked').forEach(chk => {
            selectedGifts.push(chk.value);
            basePrice += 5;
        });

        const engravingText = document.getElementById('engraving-text').value;
        const innerText = document.getElementById('inner-text').value;

        cart.push({
            id: Date.now(),
            productId: prod.id,
            title: prod.title,
            price: basePrice > 0 ? basePrice : 0,
            size: selectedSize,
            leatherColor,
            coverType,
            extraGifts: selectedGifts.join(', ') || 'بدون',
            perfumeType,
            engravingText,
            innerText,
            customImageUrl: currentUploadedImageUrl || ''
        });

        updateCartUI();
        document.getElementById('customization-form').reset();
        currentUploadedImageUrl = '';
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer) previewContainer.style.display = 'none';
    });
}

// 5. ربط أحداث الشحن لإعادة التحديث اللحظي المباشر للمجموع الكلي
function setupShippingListeners() {
    const shippingCheckbox = document.getElementById('shipping-checkbox');
    const citySelect = document.getElementById('shipping-city-select');

    if (shippingCheckbox) {
        shippingCheckbox.addEventListener('change', () => {
            const cityWrapper = document.getElementById('city-select-wrapper');
            if (cityWrapper) cityWrapper.style.display = shippingCheckbox.checked ? 'block' : 'none';
            updateCartUI();
        });
    }

    if (citySelect) {
        citySelect.addEventListener('change', () => {
            updateCartUI();
        });
    }
}

// 6. حذف عنصر من السلة مع تحديث فوري للمجموع الكلي
window.removeCartItem = (itemId) => {
    cart = cart.filter(item => item.id !== itemId);
    updateCartUI();
};

// 7. تحديث السلة وإعادة حساب مجموع المنتجات وأجور الشحن والمجموع الكلي لحظياً
function updateCartUI() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
        cartContainer.innerHTML = `<p class="empty-msg" style="color: var(--text-muted);">${translations[currentLang].empty_cart_msg}</p>`;
    } else {
        cart.forEach((item, index) => {
            cartContainer.innerHTML += `
                <div class="cart-item" style="display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px dashed var(--border-color); font-size: 0.9rem;">
                    ${item.customImageUrl ? `
                        <img src="${item.customImageUrl}" alt="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid var(--gold-primary); flex-shrink: 0;">
                    ` : `<div style="width: 50px; height: 50px; background: rgba(197,160,89,0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--text-muted); flex-shrink: 0;">بلا صورة</div>`}
                    <div style="flex-grow: 1;">
                        <strong>${index + 1}. ${item.title}</strong> (${item.size}) - ${Number(item.price).toFixed(2)} د.أ<br>
                        <small style="color: var(--text-muted);">جلد: ${item.leatherColor} | كفر: ${item.coverType} | عطر: ${item.perfumeType}</small><br>
                        <small style="color: var(--text-muted);">هدايا إضافية: ${item.extraGifts}</small><br>
                        <button type="button" onclick="window.removeCartItem(${item.id})" style="background: #e74c3c; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; margin-top: 4px;">❌ حذف المنتج</button>
                    </div>
                </div>
            `;
        });
    }

    const subtotal = cart.reduce((sum, item) => sum + Number(item.price), 0);
    const shippingCheckbox = document.getElementById('shipping-checkbox');
    const citySelect = document.getElementById('shipping-city-select');
    
    // احتساب أجور التوصيل بناءً على تحديد الزر والقائمة
    const isShippingChecked = shippingCheckbox ? shippingCheckbox.checked : true;
    const selectedShippingRate = citySelect ? parseFloat(citySelect.value) : 3.00;
    const shippingFee = cart.length > 0 && isShippingChecked ? selectedShippingRate : 0;
    
    const totalAmount = subtotal + shippingFee;

    const subtotalEl = document.getElementById('subtotal-val');
    const shippingEl = document.getElementById('shipping-val');
    const totalEl = document.getElementById('total-val');

    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
    if (shippingEl) shippingEl.textContent = shippingFee.toFixed(2);
    if (totalEl) totalEl.textContent = totalAmount.toFixed(2);
}

// 8. إرسال الطلبية وحفظها وتوليد تقرير الواتساب المفصل
const orderSubmitForm = document.getElementById('order-submit-form');
if (orderSubmitForm) {
    orderSubmitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) return alert('سلة الطلبات فارغة!');

        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value || '00962778060651';
        const email = document.getElementById('cust-email').value;
        const address = document.getElementById('cust-address').value;
        
        const shippingCheckbox = document.getElementById('shipping-checkbox');
        const citySelect = document.getElementById('shipping-city-select');
        const isShippingChecked = shippingCheckbox ? shippingCheckbox.checked : true;
        const shippingFee = isShippingChecked && citySelect ? parseFloat(citySelect.value) : 0;

        const subtotal = cart.reduce((sum, item) => sum + Number(item.price), 0);
        const totalAmount = subtotal + shippingFee;

        let createdOrderId = 'جديد';
        try {
            const { data: orderData, error } = await supabase.from('orders').insert([{
                customer_name: name,
                customer_phone: phone,
                customer_email: email,
                delivery_address: address,
                shipping_fee: shippingFee,
                subtotal: subtotal,
                total_amount: totalAmount,
                status: 'قيد المعالجة'
            }]).select().single();

            if (!error && orderData) {
                createdOrderId = orderData.id;
                const orderItems = cart.map(item => ({
                    order_id: orderData.id,
                    product_id: item.productId,
                    selected_size: item.size,
                    leather_color: item.leatherColor,
                    cover_type: item.coverType,
                    extra_gift: item.extraGifts,
                    perfume_type: item.perfumeType,
                    engraving_text: item.engravingText,
                    inner_text: item.innerText,
                    custom_image_url: item.customImageUrl,
                    unit_price: item.price
                }));
                await supabase.from('order_items').insert(orderItems);
            }
        } catch (dbErr) {
            console.error('DB order error:', dbErr);
        }

        let detailedItemsList = cart.map((item, i) => 
            `📦 *المنتج (${i + 1}):* ${item.title}\n` +
            `  • الحجم: ${item.size}\n` +
            `  • لون الجلد: ${item.leatherColor}\n` +
            `  • الكفر: ${item.coverType}\n` +
            `  • الهدايا الإضافية: ${item.extraGifts}\n` +
            `  • العطر السويسري: ${item.perfumeType}\n` +
            `  • العبارة المحفورة: ${item.engravingText || 'بدون'}\n` +
            `  • صورة العميل: ${item.customImageUrl || 'بدون'}\n` +
            `  • السعر: ${Number(item.price).toFixed(2)} د.أ`
        ).join('\n\n');

        const fullReportText = `✨ *طلب جديد (#${createdOrderId}) - أورا للهدايا الفاخرة* ✨\n\n` +
            `👤 *العميل:* ${name} | الهاتف: ${phone}\n` +
            `📍 *العنوان:* ${address}\n` +
            `----------------------------------\n` +
            `${detailedItemsList}\n` +
            `----------------------------------\n` +
            `💰 *المجموع الكلي مع الشحن:* ${totalAmount.toFixed(2)} د.أ\n` +
            `📞 *للاستفسار والتواصل:* 00962778060651`;

        const storePhone = "962778060651";
        const whatsappUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(fullReportText)}`;
        window.open(whatsappUrl, '_blank');
        
        cart = [];
        updateCartUI();
        orderSubmitForm.reset();
        alert('✅ تم إرسال الطلبية بنجاح وتحويلك إلى الواتساب!');
    });
}

function setupThemeAndLanguageToggles() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const langBtn = document.getElementById('lang-toggle-btn');
    const htmlRoot = document.getElementById('html-root');

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
        });
    }

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'ar' ? 'en' : 'ar';
            langBtn.textContent = currentLang === 'ar' ? 'EN' : 'AR';
            if (htmlRoot) {
                htmlRoot.setAttribute('lang', currentLang);
                htmlRoot.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
            }
            document.querySelectorAll('[data-lang]').forEach(el => {
                const key = el.getAttribute('data-lang');
                if (translations[currentLang][key]) el.textContent = translations[currentLang][key];
            });
            renderProductsGrid();
            updateCartUI();
        });
    }
}