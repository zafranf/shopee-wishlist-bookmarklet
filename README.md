# ❤ Wishlist Shopee — Bookmarklet

Lihat wishlist / favorite Shopee kamu langsung di browser desktop, tanpa app,
tanpa login ke pihak ketiga, tanpa server.

## Pakai

1. Buka **<https://zafranf.github.io/shopee-wishlist-bookmarklet/>** di browser kamu.
2. **Drag** tombol oranye **❤ Wishlist Shopee** ke bookmarks bar
   (kalau bar-nya belum kelihatan: `Ctrl+Shift+B` / `Cmd+Shift+B`).
3. Buka dan **login** di [shopee.co.id](https://shopee.co.id), lalu klik bookmarknya.

Wishlist kamu muncul dalam overlay: gambar, harga, rating, terjual, nama toko.

## Fitur

- **Urutkan**: terbaru favorit, harga termurah/termahal, terjual terbanyak,
  paling disukai, rating tertinggi, nama A-Z.
- **Filter**: range harga, rating minimum, Official only, stok ada.
- **Cari** di seluruh data (nama barang & nama toko).
- **Pagination** 60 item/halaman.
- **Ekspor JSON / CSV** (ikut filter yang aktif).
- **Cache**: buka kedua kali langsung tampil (disimpan di browser kamu,
  klik tombol ↻ buat ambil data terbaru).

## Privasi & keamanan

- **Cookie kamu tidak ke mana-mana.** Kode ini berjalan di browser kamu sendiri,
  di halaman `shopee.co.id`. Ia membaca wishlist lewat session login yang sudah ada —
  tidak ada server, tidak ada data dikirim ke pihak ketiga, tidak ada cookie disimpan.
- Hanya membaca wishlist **sendiri**, bersifat read-only.
- Source-nya terbuka — klik kanan bookmark → Edit, atau baca
  [`bookmarklet_core.js`](./bookmarklet_core.js) untuk memverifikasi isinya.

## Cara kerja

Bookmarklet memanggil endpoint internal Shopee

```
GET https://shopee.co.id/api/v4/pages/get_liked_items?limit=48&cursor=<cursor>
```

dari halaman shopee (same-origin), sehingga lolos CORS dan memakai session login
pengguna. Fitur ini memang ada di app mobile tapi tidak ditampilkan di web —
bookmarklet ini hanya membukanya.

## Disclaimer

Tidak berafiliasi dengan Shopee. Endpoint internal bisa berubah atau diblokir
kapan saja. Gunakan dengan bijak, hanya untuk membaca wishlist sendiri.

## Lisensi

MIT
