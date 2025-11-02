document.addEventListener("DOMContentLoaded", function() {
    
    // Ambil elemen
    const loadBtn = document.getElementById("load-messages-btn");
    const postsFeed = document.getElementById("admin-posts-feed");
    const passwordInput = document.getElementById("admin-pass");
    const adminStatus = document.getElementById("admin-status");

    // Tambahkan listener ke tombol "Muat Pesan"
    loadBtn.addEventListener('click', loadAllMessages);

    async function loadAllMessages() {
        adminStatus.textContent = "Memuat pesan...";
        try {
            // 1. Ambil semua pesan (tidak perlu password untuk 'get')
            const response = await fetch('/api/messages');
            if (!response.ok) throw new Error('Gagal mengambil data');
            
            const messages = await response.json();
            postsFeed.innerHTML = ""; // Kosongkan feed

            if (messages.length === 0) {
                postsFeed.innerHTML = "<p>Belum ada pesan.</p>";
            } else {
                messages.forEach(msg => {
                    postsFeed.appendChild(createAdminPost(msg));
                });
            }
            adminStatus.textContent = `Berhasil memuat ${messages.length} pesan.`;
            
        } catch (error) {
            console.error('Error:', error);
            adminStatus.textContent = `Error: ${error.message}`;
            adminStatus.style.color = 'red';
        }
    }

    // Fungsi untuk membuat elemen post di panel admin
    function createAdminPost(message) {
        // Buat elemen (mirip app.js, tapi dengan tombol HAPUS)
        const postElement = document.createElement("div");
        postElement.classList.add("post", "admin-post");
        
        // --- PERUBAHAN 1 DI SINI ---
        // Kita gunakan '_id' dari MongoDB, bukan 'id'
        postElement.dataset.id = message._id; 

        // Header (Pengirim, Kategori)
        const postHeader = document.createElement("div");
        postHeader.classList.add("post-header");
        postHeader.innerHTML = `
            <span class="post-sender">${message.sender}</span>
            <span class="post-category category-${message.category}">${message.category}</span>
        `;
        
        // Konten
        const postContent = document.createElement("p");
        postContent.classList.add("post-text");
        postContent.textContent = message.text;
        
        // Waktu (Tampilkan ID yang benar)
        const postTime = document.createElement("span");
        postTime.classList.add("post-time");
        
        // --- PERUBAHAN 2 DI SINI ---
        // Tampilkan '_id' agar kita bisa melihatnya
        postTime.textContent = `ID: ${message._id} | Waktu: ${message.time}`;
        
        // Tombol Hapus
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-btn");
        deleteButton.textContent = "HAPUS PESAN INI";
        
        // Event listener untuk tombol hapus
        deleteButton.addEventListener('click', async function() {
            const currentPassword = passwordInput.value;
            if (!currentPassword) {
                alert('Silakan masukkan kata sandi admin terlebih dahulu.');
                return;
            }

            // Konfirmasi sebelum hapus
            if (!confirm(`Yakin ingin menghapus pesan dengan ID: ${message._id}?`)) {
                return;
            }

            adminStatus.textContent = `Menghapus pesan ${message._id}...`;
            adminStatus.style.color = '#333';

            try {
                // Panggil API delete dengan ID dan password
                const response = await fetch('/api/admin/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        // --- PERUBAHAN 3 DI SINI ---
                        // Kirim '_id' sebagai 'id' ke server
                        id: message._id, 
                        password: currentPassword
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Gagal menghapus');
                }

                // Jika sukses, hapus elemen dari halaman
                postElement.remove();
                adminStatus.textContent = `Pesan ${message._id} berhasil dihapus.`;
                
            } catch (error) {
                console.error('Error:', error);
                adminStatus.textContent = `Error: ${error.message}`;
                adminStatus.style.color = 'red';
            }
        });

        // Gabungkan semua
        postElement.appendChild(postHeader);
        postElement.appendChild(postContent);
        postElement.appendChild(postTime);
        postElement.appendChild(deleteButton);
        
        return postElement;
    }
});
