window.startWebSync = async function() {
    try {
        const cloudName = 'k7wiev69';
        const apiKey = '285121773826433';
        const apiSecret = 'd4xCQS7OxTqRc02uLE4JWrrpraI';
        
        App.toast('Sitemap aliniyor...', 'info');
        const sitemapRes = await fetch('https://bayyildiz.com/sitemap.xml');
        const sitemapText = await sitemapRes.text();
        
        const urls = [];
        const regex = /<loc>(.*?\/urun\/.*?)<\/loc>/g;
        let match;
        while ((match = regex.exec(sitemapText)) !== null) {
            urls.push(match[1]);
        }
        
        App.toast('Sitemap te ' + urls.length + ' urun bulundu, taraniyor...', 'info');
        
        let newCount = 0;
        
        // Islem yapilacak urunleri biriktir
        const productsToAdd = [];
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const slug = url.split('/').pop();
            const barcode = slug; // Fallback barcode
            
            try {
                const res = await fetch('http://localhost:3032/?url=' + encodeURIComponent(url));
                const text = await res.text();
                
                const jsonLdMatch = text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
                if (jsonLdMatch) {
                    const data = JSON.parse(jsonLdMatch[1]);
                    const sku = data.sku || barcode;
                    const modelName = data.name;
                    
                    const exists = store.data.products.find(x => {
                        if (!x || !x.model) return false;
                        const modelCode = x.model.split(' ').pop().toLowerCase();
                        return slug.toLowerCase().includes(modelCode) || (x.barcode && x.barcode === sku) || (x.id && x.id === sku);
                    });
                    
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
            App.toast('Taranan urunlerin hepsi zaten sistemde mevcut.', 'success');
            return;
        }
        
        App.toast(productsToAdd.length + ' yeni urun bulundu, gorseller aktariliyor...', 'info');
        
        for (let i = 0; i < productsToAdd.length; i++) {
            const p = productsToAdd[i];
            let finalImageUrl = null;
            
            if (p.image) {
                try {
                    const timestamp = Math.floor(Date.now() / 1000);
                    const strToSign = `timestamp=${timestamp}${apiSecret}`;
                    const encoder = new TextEncoder();
                    const dataToSign = encoder.encode(strToSign);
                    const hashBuffer = await crypto.subtle.digest('SHA-1', dataToSign);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    
                    const formData = new FormData();
                    formData.append('file', p.image);
                    formData.append('api_key', apiKey);
                    formData.append('timestamp', timestamp);
                    formData.append('signature', signature);
                    
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
                brand: 'Bayyildiz',
                model: p.name,
                category: p.name.toLowerCase().includes('bot') ? 'Bot' : 'Gunluk',
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
        
        App.toast(newCount + ' yeni urun basariyla eklendi ve senkronize edildi!', 'success');
        
    } catch(err) {
        console.error('Sync error:', err);
        App.toast('Senkronizasyon sirasinda hata olustu: ' + err.message, 'error');
    }
};
