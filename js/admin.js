import { supabase } from './supabaseClient.js';

let adminProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    await fetchAdminProducts();
    
    const form = document.getElementById('product-form');
    form.addEventListener('submit', handleProductSubmit);

    document.getElementById('reset-form-btn').addEventListener('click', () => {
        form.reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('form-title').textContent = '➕ إضافة منتج جديد';
    });
});

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
        // تحديث منتج موجود
        const { error } = await supabase.from('products').update(productData).eq('id', id);
        if (error) return alert('خطأ أثناء التحديث: ' + error.message);
        alert('✅ تم تحديث المنتج بنجاح!');
    } else {
        // إضافة منتج جديد
        const { error } = await supabase.from('products').insert([productData]);
        if (error) return alert('خطأ أثناء الإضافة: ' + error.message);
        alert('✅ تم إضافة المنتج بنجاح وتمديد العرض تلقائياً!');
    }

    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('form-title').textContent = '➕ إضافة منتج جديد';
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