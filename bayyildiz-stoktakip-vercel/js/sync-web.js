window.startWebSync = async function() {
    try {
        const cloudName = 'k7wiev69';
        const uploadPreset = 'bayyildiz_unsigned';
        
        App.toast('Sitemap alınıyor...', 'info');
        const sitemapRes = await fetch('https://bayyildiz.com/sitemap.xml');
        const sitemapText = await sitemapRes.text();
        
        const urls = [];
        const regex = /<loc>(.*?\/urun\/.*?)<\/loc>/g;
        let match;
        while ((match = regex.exec(sitemapText)) !== null) {
            urls.push(match[1]);
        }
        
        App.toast(`Sitemap'te ${urls.length} ürün bulundu, taranıyor...`, 'info');
        
        let newCount = 0;
        let updateCount = 0;
        
        // Islem yapilacak urunleri biriktir
        const productsToAdd = [];
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const slug = url.split('/').pop();
            const barcode = slug; // Fallback barcode
            
            // Oncelikle veritabaninda var mi hizlica kontrol edelim (URL slug'dan yola cikarak)
            // Normalde tam eslesme icin json-ld'yi cekmek daha iyidir ama hizlandirmak icin
            // once json-ld'yi cekiyoruz.
            try {
                const res = await fetch(url);
                const text = await res.text();
                
                const jsonLdMatch = text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
                if (jsonLdMatch) {
                    const data = JSON.parse(jsonLdMatch[1]);
                    const sku = data.sku || barcode;
                    const modelName = data.name;
                    
                    const exists = store.data.products.find(x => x.model === modelName || x.barcode === sku || x.id === sku);
                    
                    if (!exists) {
                        productsToAdd.push({
                            id: sku,
                            name: modelName,
                            price: data.offers && data.offers.price ? data.offers.price : 0,
                            image: (data.image && data.image.length > 0) ? data.image[0] : null,
                            barcode: sku
                        });
                    }
                }
            } catch (e) {
                console.error('Error fetching ' + url, e);
            }
        }
        
        if (productsToAdd.length === 0) {
            App.toast('Taranan ürünlerin hepsi zaten sistemde mevcut.', 'success');
            return;
        }
        
        App.toast(`${productsToAdd.length} yeni ürün bulundu, görseller Cloudinary'ye aktarılıyor...`, 'info');
        
        for (let i = 0; i < productsToAdd.length; i++) {
            const p = productsToAdd[i];
            let finalImageUrl = null;
            
            if (p.image) {
                try {
                    const formData = new FormData();
                    formData.append('file', p.image);
                    formData.append('upload_preset', uploadPreset);
            
                    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
            
                    if (result.secure_url) {
                        finalImageUrl = result.secure_url;
                    }
                } catch(e) {
                    console.error('Cloudinary upload error', e);
                }
            }
            
            store.addProduct({
                brand: 'Bayyıldız',
                model: p.name,
                category: p.name.toLowerCase().includes('bot') ? 'Bot' : 'Günlük',
                gender: 'Erkek',
                season: '4 Mevsim',
                price: p.price,
                costPrice: p.price * 0.5,
                image: finalImageUrl,
                images: finalImageUrl ? [finalImageUrl] : [],
                barcode: p.barcode,
                stock: 10
            });
            newCount++;
        }
        
        if(typeof ProductsPage !== 'undefined' && ProductsPage.render) {
            ProductsPage.render();
        }
        
        App.toast(`${newCount} yeni ürün başarıyla eklendi ve senkronize edildi!`, 'success');
        
    } catch(err) {
        console.error('Sync error:', err);
        App.toast('Senkronizasyon sırasında hata oluştu: ' + err.message, 'error');
    }
};
