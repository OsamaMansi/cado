// ==========================================
// أورا للهدايا الفاخرة - ملف التحكم الرئيسي (app.js)
// محدث لدعم الأسعار المتعددة حسب الحجم من قاعدة البيانات
// ==========================================

import { supabase } from './supabaseClient.js';

let cart = [];
let fetchedProducts = [];
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
});

// 1. جلب المنتجات من جدول Supabase مع الأسعار الجديدة بالحجوم
async function loadProducts() {
    let data = null;
    try {
        const res = await supabase.from('products').select('*');
        data = res.data;
    } catch (err) {
        console.warn('Supabase fetch failed, using fallback.');
    }

    if (!data || data.length === 0) {
        // بيانات احتياطية مطابقة لهيكل الحجوم والأسعار الجديدة
        fetchedProducts = [
            {
                id: '1',
                title: 'صندوق "لمسة ياسمين" الذهبي',
                description: 'صندوق فاخر من الأكريليك والمرايا الذهبية مع حفر مخصص للأسماء والوجه.',
                sizes: [
                    { name: 'صغير (20x20 سم)', price_before: 35.00, price_after: 28.00 },
                    { name: 'وسط (25x25 سم)', price_before: 45.00, price_after: 38.00 },
                    { name: 'كبير (30x30 سم)', price_before: 50.00, price_after: 43.00 }
                ],
                image_url: 'assets/images/imajes (1).jpeg'
            },
            {
                id: '2',
                title: 'صندوق "نغمات وذكريات" الموسيقي',
                description: 'صندوق مخصص يحمل صورتك المفضلة مع رمز استجابة سريعة (QR) للأغنية وحفر باركود.',
                sizes: [
                    { name: 'صغير (20x20 سم)', price_before: 40.00, price_after: 31.00 },
                    { name: 'وسط (25x25 سم)', price_before: 50.00, price_after: 41.00 },
                    { name: 'كبير (30x30 سم)', price_before: 55.00, price_after: 46.00 }
                ],
                image_url: 'assets/images/imajes (2).jpeg'
            },
            {
                id: '3',
                title: 'بكج "مشاعر" المتكامل',
                description: 'بكج عطور فاخرة مع كتابة مخصصة على غطاء المرآة الداخلي المبطن بالساتان.',
                sizes: [
                    { name: 'صغير (20x20 سم)', price_before: 55.00, price_after: 45.00 },
                    { name: 'وسط (25x25 سم)', price_before: 65.00, price_after: 55.00 },
                    { name: 'كبير (30x30 سم)', price_before: 70.00, price_after: 60.00 }
                ],
                image_url: 'assets/images/imajes (3).jpeg'
            },
            {
                id: '4',
                title: 'صندوق "الأصالة" المحفور',
                description: 'علبة هدايا مخصصة تحتوي على حفر وجه فوتوغرافي بارز مع زخارف نجوم لامعة.',
                sizes: [
                    { name: 'صغير (20x20 سم)', price_before: 30.00, price_after: 24.00 },
                    { name: 'وسط (25x25 سم)', price_before: 40.00, price_after: 34.00 },
                    { name: 'كبير (30x30 سم)', price_before: 45.00, price_after: 39.00 }
                ],
                image_url: 'assets/images/imajes (4).jpeg'
            },
            {
                id: '5',
                title: 'صندوق "السند والحب" للرجال',
                description: 'صندوق هدايا مفتوح يحتوي على طقم فاخر (ساعة، محفظة، عطر) مع شعر مخصص.',
                sizes: [
                    { name: 'صغير (20x20 سم)', price_before: 60.00, price_after: 49.00 },
                    { name: 'وسط (25x25 سم)', price_before: 70.00, price_after: 59.00 },
                    { name: 'كبير (30x30 سم)', price_before: 75.00, price_after: 64.00 }
                ],
                image_url: 'assets/images/imajes (5).jpeg'
            },
            {
                id: '6',
                title: 'صندوق "الملكة" الملكي',
                description: 'تصميم خاص يدمج الزجاج المعشق والرسم اليدوي الفاخر لإهداء استثنائي.',
                sizes: [
                    { name: 'صغير (20x20 سم)', price_before: 45.00, price_after: 38.00 },
                    { name: 'وسط (25x25 سم)', price_before: 55.00, price_after: 48.00 },
                    { name: 'كبير (30x30 سم)', price_before: 60.00, price_after: 53.00 }
                ],
                image_url: 'assets/images/imajes (6).jpeg'
            },
            {
                id: '7',
                title: 'طقم الهدايا الماسي',
                description: 'صندوق زجاجي فاخر مع عطور مركبة خصيصاً وإكسسوارات راقية.',
                sizes: [
                    { name: 'صغير (20x20 سم)', price_before: 50.00, price_after: 42.00 },
                    { name: 'وسط (25x25 سم)', price_before: 60.00, price_after: 52.00 },
                    { name: 'كبير (30x30 سم)', price_before: 65.00, price_after: 57.00 }
                ],
                image_url: 'assets/images/imajes (7).jpeg'
            },
            {
                id: '8',
                title: 'صندوق "الذكرى الخالدة"',
                description: 'أفخم صناديق الأكريليك المخصصة للذكريات والتهاني الخاصة.',
                sizes: [
                    { name: 'صغير (20x20 سم)', price_before: 65.00, price_after: 54.00 },
                    { name: 'وسط (25x25 سم)', price_before: 75.00, price_after: 64.00 },
                    { name: 'كبير (30x30 سم)', price_before: 80.00, price_after: 69.00 }
                ],
                image_url: 'assets/images/imajes (8).jpeg'
            }
        ];
    } else {
        fetchedProducts = data.map((prod, index) => ({
            ...prod,
            image_url: prod.image_url || `assets/images/imajes (${(index % 8) + 1}).jpeg`,
            sizes: typeof prod.sizes === 'string' ? JSON.parse(prod.sizes) : prod.sizes
        }));
    }

    renderProductsGrid();
    populateSelectDropdown();
}

// عرض الصناديق في الواجهة الرئيسية مع عرض سعر الحجم الأصغر كبداية
function renderProductsGrid() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

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
                    <p>${prod.description}</p>
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

// عند تغيير المنتج في شاشة التخصيص، يتم توليد أزرار الحجوم مع أسعارها الخاصة
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
        const selectedPrice = selectedSizeRadio ? parseFloat(selectedSizeRadio.getAttribute('data-price')) : prod.sizes[0].price_after;

        const engravingText = document.getElementById('engraving-text').value;
        const innerText = document.getElementById('inner-text').value;
        const fileInput = document.getElementById('custom-image-file');

        let customImageUrl = '';
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileName = `${Date.now()}_${file.name}`;
            try {
                const { data, error } = await supabase.storage.from('custom-drawings').upload(fileName, file);
                if (!error) {
                    const { data: publicUrlData } = supabase.storage.from('custom-drawings').getPublicUrl(fileName);
                    customImageUrl = publicUrlData.publicUrl;
                }
            } catch (err) {
                console.log('Storage upload simulated locally.');
            }
        }

        cart.push({
            productId: prod.id,
            title: prod.title,
            price: selectedPrice,
            size: selectedSize,
            engravingText,
            innerText,
            customImageUrl
        });

        updateCartUI();
        document.getElementById('customization-form').reset();
    });
}

// تحديث السلة وإجمالي الحسابات
function updateCartUI() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
        cartContainer.innerHTML = `<p class="empty-msg" style="color: var(--text-muted);">${translations[currentLang].empty_cart_msg}</p>`;
    } else {
        cart.forEach((item, index) => {
            cartContainer.innerHTML += `
                <div class="cart-item" style="padding: 10px 0; border-bottom: 1px dashed var(--border-color); font-size: 0.95rem;">
                    <strong>${index + 1}. ${item.title}</strong> (${item.size}) - ${Number(item.price).toFixed(2)} ${translations[currentLang].currency}
                    <br><small style="color: var(--text-muted);">العبارة: ${item.engravingText || 'بدون'}</small>
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

// إرسال الطلبية والتفاصيل عبر الواتساب مع نافذة الأزرار التفاعلية
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

        let detailedItemsList = cart.map((item, i) => 
            `📦 *المنتج رقم (${i + 1}):* ${item.title}\n` +
            `  • *الحجم المطلوب:* ${item.size}\n` +
            `  • *العبارة المحفورة:* ${item.engravingText || 'بدون'}\n` +
            `  • *عبارة الهدية الداخلية:* ${item.innerText || 'بدون'}\n` +
            `  • *صورة الرسم المرفقة:* ${item.customImageUrl || 'بدون مرفق'}\n` +
            `  • *السعر:* ${Number(item.price).toFixed(2)} د.أ`
        ).join('\n\n');

        const fullReportText = `✨ *التقرير النهائي المفصل للطلبية - أورا للهدايا الفاخرة* ✨\n` +
            `==================================\n` +
            `👤 *بيانات العميل المستلم:*\n` +
            `  - الاسم: ${name}\n` +
            `  - الهاتف: ${phone}\n` +
            `  - الإيميل: ${email}\n` +
            `  - العنوان: ${address}\n` +
            `==================================\n` +
            `🛒 *المنتجات المطلوبة:*\n\n` +
            `${detailedItemsList}\n` +
            `==================================\n` +
            `📊 *الملخص المالي:*\n` +
            `  - مجموع المنتجات: ${subtotal.toFixed(2)} د.أ\n` +
            `  - أجور التوصيل: ${shippingFee.toFixed(2)} د.أ\n` +
            `  - 💰 *المجموع الكلي:* ${totalAmount.toFixed(2)} د.أ\n` +
            `==================================`;

        const storePhone = "962778060651";
        const whatsappUrlStore = `https://wa.me/${storePhone}?text=${encodeURIComponent(fullReportText)}`;
        
        let formattedCustomerPhone = phone.replace(/[^0-9]/g, '');
        if (formattedCustomerPhone.startsWith('07')) {
            formattedCustomerPhone = '962' + formattedCustomerPhone.substring(1);
        }
        const whatsappUrlCustomer = formattedCustomerPhone ? `https://wa.me/${formattedCustomerPhone}?text=${encodeURIComponent(fullReportText)}` : '';

        let actionContainer = document.getElementById('whatsapp-action-popup');
        if (!actionContainer) {
            actionContainer = document.createElement('div');
            actionContainer.id = 'whatsapp-action-popup';
            actionContainer.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--card-bg, #fff); padding:25px; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.3); z-index:9999; text-align:center; max-width:450px; width:90%; border:2px solid var(--gold-primary, #C5A059);';
            document.body.appendChild(actionContainer);
        }

        actionContainer.innerHTML = `
            <h3 style="color:var(--gold-primary, #C5A059); margin-bottom:15px;">✅ تم تجهيز الطلبية بنجاح!</h3>
            <p style="margin-bottom:20px; font-size:0.95rem; line-height:1.5;">الرجاء الضغط على الأزرار أدناه لفتح شاشات الواتساب وإرسال التقرير المفصل فوراً:</p>
            
            <a href="${whatsappUrlStore}" target="_blank" style="display:block; background:#25D366; color:#ffffff; padding:12px; border-radius:8px; text-decoration:none; font-weight:bold; margin-bottom:10px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                💬 إرسال الطلبية إلى واتساب الشركة
            </a>
            
            ${whatsappUrlCustomer ? `
            <a href="${whatsappUrlCustomer}" target="_blank" style="display:block; background:#128C7E; color:#ffffff; padding:12px; border-radius:8px; text-decoration:none; font-weight:bold; margin-bottom:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                👤 إرسال نسخة إلى واتساب العميل
            </a>` : ''}

            <button type="button" id="close-popup-btn" style="background:transparent; border:1px solid var(--text-muted, #777); padding:8px 20px; border-radius:6px; cursor:pointer; font-weight:600;">
                إغلاق وإنهاء
            </button>
        `;

        document.getElementById('close-popup-btn').addEventListener('click', () => {
            actionContainer.remove();
            cart = [];
            updateCartUI();
            orderSubmitForm.reset();
        });
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