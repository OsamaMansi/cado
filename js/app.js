// ==========================================
// أورا للهدايا الفاخرة - ملف التحكم الرئيسي (app.js)
// النسخة النهائية المتكاملة: معاينة الصور، التخزين، واتساب، ومعاينة ما قبل الإرسال
// ==========================================

import { supabase } from './supabaseClient.js';

let cart = [];
let fetchedProducts = [];
let currentUploadedImageUrl = ''; // لحفظ رابط الصورة المؤقت للمنتج قيد التخصيص
const SHIPPING_FEE = 3.00;
let currentLang = 'ar';

const translations = {
    ar: {
        site_title: "أورا للهدايا الفاخرة | AURA",
        nav_home: "الرئيسية",
        nav_products: "البكجات الفاخرة",
        nav_checkout: "صمّم صندوقك",
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
});

// جلب المنتجات حصرياً من قاعدة بيانات Supabase
async function loadProducts() {
    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        if (data && data.length > 0) {
            fetchedProducts = data.map((prod) => ({
                ...prod,
                sizes: typeof prod.sizes === 'string' ? JSON.parse(prod.sizes) : prod.sizes
            }));
        } else {
            fetchedProducts = [];
        }
    } catch (err) {
        console.error('Error fetching products from database:', err);
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
        grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">لا توجد منتجات معروضة حالياً. يمكنك إضافتها عبر لوحة التحكم.</p>`;
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
                    <small>${currentLang === 'ar' ? 'الأحجام المتاحة:' : 'Available Sizes:'} ${prod.sizes.map(s => s.name).join(', ')}</small>
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
    select.innerHTML = `<option value="">-- ${currentLang === 'ar' ? 'اختر من القائمة' : 'Select from list'} --</option>`;

    fetchedProducts.forEach(prod => {
        const option = document.createElement('option');
        option.value = prod.id;
        option.textContent = prod.title;
        select.appendChild(option);
    });
}

window.toggleDetails = (id) => {
    const drawer = document.getElementById(`details-${id}`);
    if (!drawer) return;
    const isVisible = drawer.style.display === 'block';
    drawer.style.display = isVisible ? 'none' : 'block';
};

window.selectProductForCustomization = (productId) => {
    const select = document.getElementById('custom-product-select');
    if (!select) return;
    select.value = productId;
    select.dispatchEvent(new Event('change'));
    document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
};

// تفعيل معاينة الصورة المرفقة لحظياً في شاشة التخصيص ورفعها لـ Supabase Storage
function setupImageUploaderPreview() {
    const fileInput = document.getElementById('custom-image-file');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('upload-preview-img');

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (uploadEvent) => {
                    previewImg.src = uploadEvent.target.result;
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);

                const fileName = `${Date.now()}_${file.name}`;
                try {
                    const { data, error } = await supabase.storage.from('custom-drawings').upload(fileName, file);
                    if (!error) {
                        const { data: publicUrlData } = supabase.storage.from('custom-drawings').getPublicUrl(fileName);
                        currentUploadedImageUrl = publicUrlData.publicUrl;
                    } else {
                        console.error('Error uploading image to storage:', error.message);
                    }
                } catch (err) {
                    console.error('Storage upload exception:', err);
                }
            }
        });
    }
}

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

const addToCartBtn = document.getElementById('add-to-cart-btn');
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', async () => {
        const productId = document.getElementById('custom-product-select').value;
        if (!productId) return alert(currentLang === 'ar' ? 'يرجى اختيار منتج أولاً.' : 'Please select a product first.');

        const prod = fetchedProducts.find(p => p.id == productId);
        const selectedSizeRadio = document.querySelector('input[name="selected-size"]:checked');
        const selectedSize = selectedSizeRadio ? selectedSizeRadio.value : 'افتراضي';
        const selectedPrice = selectedSizeRadio ? parseFloat(selectedSizeRadio.getAttribute('data-price')) : (prod.sizes[0] ? prod.sizes[0].price_after : 0);

        const engravingText = document.getElementById('engraving-text').value;
        const innerText = document.getElementById('inner-text').value;

        const imageUrlToSave = currentUploadedImageUrl || '';

        cart.push({
            productId: prod.id,
            title: prod.title,
            price: selectedPrice,
            size: selectedSize,
            engravingText,
            innerText,
            customImageUrl: imageUrlToSave
        });

        updateCartUI();
        
        document.getElementById('customization-form').reset();
        currentUploadedImageUrl = '';
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer) previewContainer.style.display = 'none';
    });
}

// تحديث السلة وإجمالي الحسابات مع إظهار صورة العميل بجانب الطلب في ملخص الطلبيات النشطة
function updateCartUI() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
        cartContainer.innerHTML = `<p class="empty-msg" style="color: var(--text-muted);">${translations[currentLang].empty_cart_msg}</p>`;
    } else {
        cart.forEach((item, index) => {
            cartContainer.innerHTML += `
                <div class="cart-item" style="display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px dashed var(--border-color); font-size: 0.95rem;">
                    ${item.customImageUrl ? `
                        <img src="${item.customImageUrl}" alt="صورة الطلب" style="width: 55px; height: 55px; object-fit: cover; border-radius: 8px; border: 1px solid var(--gold-primary); flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    ` : `<div style="width: 55px; height: 55px; background: rgba(197,160,89,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--text-muted); flex-shrink: 0;">بدون صورة</div>`}
                    <div style="flex-grow: 1;">
                        <strong>${index + 1}. ${item.title}</strong> (${item.size}) - ${Number(item.price).toFixed(2)} ${translations[currentLang].currency}
                        <br><small style="color: var(--text-muted);">العبارة: ${item.engravingText || 'بدون'}</small>
                        ${item.innerText ? `<br><small style="color: var(--text-muted);">الهدية الداخلية: ${item.innerText}</small>` : ''}
                    </div>
                </div>
            `;
        });
    }

    const subtotal = cart.reduce((sum, item) => sum + Number(item.price), 0);
    const shippingCheckbox = document.getElementById('shipping-checkbox');
    const citySelect = document.getElementById('shipping-city-select');
    
    const selectedShippingRate = citySelect ? parseFloat(citySelect.value) : 3.00;
    const hasShipping = shippingCheckbox ? shippingCheckbox.checked : true;
    
    const cityWrapper = document.getElementById('city-select-wrapper');
    if (cityWrapper) cityWrapper.style.display = hasShipping ? 'block' : 'none';

    const shippingFee = cart.length > 0 && hasShipping ? selectedShippingRate : 0;
    const total = subtotal + shippingFee;

    const subEl = document.getElementById('subtotal-val');
    const shipEl = document.getElementById('shipping-val');
    const totEl = document.getElementById('total-val');

    if (subEl) subEl.textContent = subtotal.toFixed(2);
    if (shipEl) shipEl.textContent = shippingFee.toFixed(2);
    if (totEl) totEl.textContent = total.toFixed(2);
}

const shippingCheckboxEl = document.getElementById('shipping-checkbox');
const citySelectEl = document.getElementById('shipping-city-select');

if (shippingCheckboxEl) shippingCheckboxEl.addEventListener('change', updateCartUI);
if (citySelectEl) citySelectEl.addEventListener('change', updateCartUI);

// إرسال الطلبية وعرض نافذة المعاينة النهائية قبل الحفظ والإرسال للواتساب
const orderSubmitForm = document.getElementById('order-submit-form');
if (orderSubmitForm) {
    orderSubmitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) return alert('سلة الطلبات فارغة!');

        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const email = document.getElementById('cust-email').value;
        const address = document.getElementById('cust-address').value;
        
        const shippingCheckbox = document.getElementById('shipping-checkbox');
        const citySelect = document.getElementById('shipping-city-select');
        const hasShipping = shippingCheckbox ? shippingCheckbox.checked : true;
        const shippingFee = hasShipping && citySelect ? parseFloat(citySelect.value) : 0;

        const subtotal = cart.reduce((sum, item) => sum + Number(item.price), 0);
        const totalAmount = subtotal + shippingFee;

        // 1. عرض نافذة معاينة الطلبية النهائية مع الصور قبل الإرسال الفعلي
        showOrderPreviewModal({
            name, phone, email, address, shippingFee, subtotal, totalAmount
        });
    });
}

// دالة عرض نافذة المعاينة النهائية للطلبية (معاينة الصور والملخص قبل التأكيد)
function showOrderPreviewModal(customerData) {
    let existingModal = document.getElementById('order-preview-modal');
    if (existingModal) existingModal.remove();

    let itemsPreviewHtml = cart.map((item, i) => `
        <div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border-color); text-align: right;">
            ${item.customImageUrl ? `
                <img src="${item.customImageUrl}" alt="صورة المعاينة" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 2px solid var(--gold-primary); flex-shrink: 0;">
            ` : `<div style="width: 60px; height: 60px; background: rgba(197,160,89,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--text-muted); flex-shrink: 0;">بلا صورة</div>`}
            <div style="flex-grow: 1; font-size: 0.9rem;">
                <strong>(${i + 1}) ${item.title}</strong> - ${item.size}<br>
                <span style="color: var(--text-muted);">العبارة: ${item.engravingText || 'بدون'}</span><br>
                <span style="color: var(--gold-primary); font-weight: bold;">السعر: ${Number(item.price).toFixed(2)} د.أ</span>
            </div>
        </div>
    `).join('');

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'order-preview-modal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        backdrop-filter: blur(4px);
    `;

    modalOverlay.innerHTML = `
        <div style="background: var(--card-bg, #ffffff); padding: 30px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 550px; width: 95%; max-height: 90vh; overflow-y: auto; border: 2px solid var(--gold-primary, #C5A059); text-align: right; direction: rtl;">
            <h3 style="color: var(--gold-primary, #C5A059); margin-bottom: 15px; font-size: 1.3rem; text-align: center;">🔍 معاينة الطلبية النهائية قبل التأكيد</h3>
            <p style="font-size: 0.9rem; color: var(--text-muted); text-align: center; margin-bottom: 20px;">يرجى مراجعة تفاصيل المنتجات والصور المرفقة أدناه قبل الإرسال النهائي:</p>
            
            <div style="background: rgba(197,160,89,0.05); padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 0.9rem;">
                <strong>👤 بيانات العميل:</strong> ${customerData.name} | ${customerData.phone}<br>
                <strong>📍 العنوان:</strong> ${customerData.address}
            </div>

            <div style="margin-bottom: 15px;">
                <strong>🛒 المنتجات والصور المرفقة:</strong>
                <div style="max-height: 200px; overflow-y: auto; margin-top: 8px;">
                    ${itemsPreviewHtml}
                </div>
            </div>

            <div style="border-top: 1px dashed var(--border-color); padding-top: 10px; margin-bottom: 20px; font-size: 0.95rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>مجموع المنتجات:</span> <span>${customerData.subtotal.toFixed(2)} د.أ</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>أجور الشحن:</span> <span>${customerData.shippingFee.toFixed(2)} د.أ</span></div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; color: var(--gold-primary); font-size: 1.1rem; margin-top: 8px;"><span>المجموع الكلي:</span> <span>${customerData.totalAmount.toFixed(2)} د.أ</span></div>
            </div>

            <div style="display: flex; gap: 10px;">
                <button type="button" id="confirm-final-order-btn" style="flex: 2; background: #27ae60; color: #fff; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    ✅ تأكيد وإرسال نهائي للواتساب
                </button>
                <button type="button" id="cancel-preview-btn" style="flex: 1; background: #95a5a6; color: #fff; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    تعديل الطلب
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // زر الإلغاء للعودة والتعديل
    document.getElementById('cancel-preview-btn').addEventListener('click', () => {
        modalOverlay.remove();
    });

    // زر التأكيد النهائي لتنفيذ الحفظ في قاعدة البيانات وفتح واتساب
    document.getElementById('confirm-final-order-btn').addEventListener('click', async () => {
        modalOverlay.remove();
        await executeFinalOrderSubmission(customerData);
    });
}

// تنفيذ الحفظ الفعلي في Supabase وفتح رسائل الواتساب
async function executeFinalOrderSubmission(customerData) {
    let createdOrderId = 'جديد';

    try {
        // 1. حفظ الطلب الرئيسي في Supabase
        const { data: orderData, error: orderErr } = await supabase.from('orders').insert([{
            customer_name: customerData.name,
            customer_phone: customerData.phone,
            customer_email: customerData.email,
            delivery_address: customerData.address,
            shipping_fee: customerData.shippingFee,
            subtotal: customerData.subtotal,
            total_amount: customerData.totalAmount,
            status: 'قيد المعالجة',
            notes: 'تم استلام الطلب بنجاح عبر المتجر الإلكتروني'
        }]).select().single();

        if (!orderErr && orderData) {
            createdOrderId = orderData.id;
            
            // 2. حفظ عناصر الطلب في جدول order_items مع تخزين روابط صور العملاء
            const orderItems = cart.map(item => ({
                order_id: orderData.id,
                product_id: item.productId,
                selected_size: item.size,
                engraving_text: item.engravingText,
                inner_text: item.innerText,
                custom_image_url: item.customImageUrl || null,
                unit_price: item.price
            }));
            await supabase.from('order_items').insert(orderItems);
        }
    } catch (dbErr) {
        console.error('Database order logging error:', dbErr);
    }

    // 3. صياغة تقرير الواتساب المفصل مع روابط الصور ورقم الطلب واسم العميل
    let detailedItemsList = cart.map((item, i) => 
        `📦 *المنتج رقم (${i + 1}):* ${item.title}\n` +
        `  • *الحجم المطلوب:* ${item.size}\n` +
        `  • *العبارة المحفورة:* ${item.engravingText || 'بدون'}\n` +
        `  • *عبارة الهدية الداخلية:* ${item.innerText || 'بدون'}\n` +
        `  • *صورة العميل (رقم الطلب: ${createdOrderId} - ${customerData.name}):*\n` +
        `    ${item.customImageUrl ? item.customImageUrl : 'بدون مرفق صوري'}\n` +
        `  • *السعر:* ${Number(item.price).toFixed(2)} د.أ`
    ).join('\n\n');

    const fullReportText = `✨ *التقرير النهائي للطلبية (رقم: ${createdOrderId}) - أورا* ✨\n` +
        `==================================\n` +
        `👤 *بيانات العميل المستلم:*\n` +
        `  - اسم العميل: ${customerData.name}\n` +
        `  - رقم الطلبية: #${createdOrderId}\n` +
        `  - الهاتف: ${customerData.phone}\n` +
        `  - الإيميل: ${customerData.email}\n` +
        `  - العنوان: ${customerData.address}\n` +
        `==================================\n` +
        `🛒 *المنتجات المطلوبة وروابط الصور:*\n\n` +
        `${detailedItemsList}\n` +
        `==================================\n` +
        `📊 *الملخص المالي:*\n` +
        `  - مجموع المنتجات: ${customerData.subtotal.toFixed(2)} د.أ\n` +
        `  - أجور التوصيل: ${customerData.shippingFee.toFixed(2)} د.أ\n` +
        `  - 💰 *المجموع الكلي:* ${customerData.totalAmount.toFixed(2)} د.أ\n` +
        `==================================`;

    const storePhone = "962778060651";
    const whatsappUrlStore = `https://wa.me/${storePhone}?text=${encodeURIComponent(fullReportText)}`;
    
    let formattedCustomerPhone = customerData.phone.replace(/[^0-9]/g, '');
    if (formattedCustomerPhone.startsWith('07')) {
        formattedCustomerPhone = '962' + formattedCustomerPhone.substring(1);
    }
    const whatsappUrlCustomer = formattedCustomerPhone ? `https://wa.me/${formattedCustomerPhone}?text=${encodeURIComponent(fullReportText)}` : '';

    // 4. إظهار الشاشة المنبثقة النهائية في منتصف الشاشة بدقة
    let actionContainer = document.getElementById('whatsapp-action-popup');
    if (!actionContainer) {
        actionContainer = document.createElement('div');
        actionContainer.id = 'whatsapp-action-popup';
        actionContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--card-bg, #ffffff);
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.4);
            z-index: 99999;
            text-align: center;
            max-width: 480px;
            width: 90%;
            border: 2px solid var(--gold-primary, #C5A059);
        `;
        document.body.appendChild(actionContainer);
    }

    actionContainer.innerHTML = `
        <h3 style="color: var(--gold-primary, #C5A059); margin-bottom: 15px; font-size: 1.3rem;">✅ تم تسجيل وحفظ الطلبية (#${createdOrderId}) بنجاح!</h3>
        <p style="margin-bottom: 20px; font-size: 0.95rem; line-height: 1.5; color: var(--text-main, #333);">الرجاء الضغط على الأزرار أدناه لإرسال التقرير المفصل ورابط صورة العميل إلى الواتساب:</p>
        
        <a href="${whatsappUrlStore}" target="_blank" style="display: block; background: #25D366; color: #ffffff; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            💬 إرسال الطلبية إلى واتساب الشركة
        </a>
        
        ${whatsappUrlCustomer ? `
        <a href="${whatsappUrlCustomer}" target="_blank" style="display: block; background: #128C7E; color: #ffffff; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            👤 إرسال نسخة إلى واتساب العميل
        </a>` : ''}

        <button type="button" id="close-popup-btn" style="background: transparent; border: 1px solid var(--text-muted, #777); padding: 8px 25px; border-radius: 6px; cursor: pointer; font-weight: 600; color: var(--text-main, #333);">
            إغلاق وإنهاء
        </button>
    `;

    document.getElementById('close-popup-btn').addEventListener('click', () => {
        actionContainer.remove();
        cart = [];
        updateCartUI();
        orderSubmitForm.reset();
    });
}

function setupThemeAndLanguageToggles() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const langBtn = document.getElementById('lang-toggle-btn');
    const htmlRoot = document.getElementById('html-root');

    const logoEnImg = document.getElementById('logo-en-img');
    const logoArImg = document.getElementById('logo-ar-img');
    const bgLogoImg = document.getElementById('bg-logo-img');

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');

            if (isDarkMode) {
                if (logoEnImg) logoEnImg.src = 'assets/blogo.png';
                if (logoArImg) logoArImg.src = 'assets/baura.png';
                if (bgLogoImg) bgLogoImg.src = 'assets/baura.png';
            } else {
                if (logoEnImg) logoEnImg.src = 'assets/logo.png';
                if (logoArImg) logoArImg.src = 'assets/aura.png';
                if (bgLogoImg) bgLogoImg.src = 'assets/aura.png';
            }
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
                if (translations[currentLang][key]) {
                    el.textContent = translations[currentLang][key];
                }
            });
            renderProductsGrid();
            updateCartUI();
        });
    }
}