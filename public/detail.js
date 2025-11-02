document.addEventListener("DOMContentLoaded", async function() {
    
    // 1. Ambil elemen kontainer
    const storyContainer = document.getElementById("story-detail");

    // 2. Dapatkan ID cerita dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id');

    if (!storyId) {
        storyContainer.innerHTML = "<p>Error: ID cerita tidak ditemukan.</p>";
        return;
    }

    // 3. Panggil API untuk mengambil data satu cerita
    try {
        const response = await fetch(`/api/messages/${storyId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                storyContainer.innerHTML = "<p>Cerita tidak ditemukan.</p>";
            } else {
                throw new Error('Gagal mengambil data');
            }
            return;
        }

        const message = await response.json();
        
        // 4. Render cerita ke halaman
        renderStory(message);

    } catch (error) {
        console.error('Error:', error);
        storyContainer.innerHTML = `<p>Gagal memuat cerita: ${error.message}</p>`;
    }

    // 5. Fungsi untuk merender HTML cerita (DIPERBARUI DENGAN LIKE)
    function renderStory(message) {
        // Kosongkan kontainer "Memuat..."
        storyContainer.innerHTML = "";
        
        // Buat elemen-elemen
        
        // Header (Pengirim & Kategori)
        const postHeader = document.createElement("div");
        postHeader.classList.add("post-header");
        postHeader.innerHTML = `
            <span class="post-sender">${message.sender}</span>
            <span class="post-category category-${message.category}">${message.category}</span>
        `;
        
        // Konten Teks (ditampilkan penuh)
        const postContent = document.createElement("p");
        postContent.classList.add("post-text");
        postContent.textContent = message.text;
        postContent.style.whiteSpace = "pre-wrap"; // Menjaga format spasi/enter

        // Footer (Waktu & Tombol Like)
        const postFooter = document.createElement("div");
        postFooter.classList.add("post-footer");

        const postTime = document.createElement("span");
        postTime.classList.add("post-time");
        postTime.textContent = "Dikirim pada: " + message.time;

        const likeContainer = document.createElement("div");
        likeContainer.classList.add("like-container");

        const likeBtn = document.createElement("button");
        likeBtn.classList.add("like-btn");
        likeBtn.innerHTML = "❤️"; 
        
        const likeCount = document.createElement("span");
        likeCount.classList.add("like-count");
        likeCount.textContent = `${message.likes || 0} Suka`;

        likeContainer.appendChild(likeBtn);
        likeContainer.appendChild(likeCount);
        
        // Event listener untuk Tombol LIKE (sama seperti di app.js)
        likeBtn.addEventListener('click', async (e) => {
            likeBtn.disabled = true; // Cegah spam klik
            try {
                const response = await fetch(`/api/messages/${storyId}/like`, { method: 'POST' });
                if (!response.ok) throw new Error('Gagal like');
                
                const updatedMessage = await response.json();
                // Update jumlah like di halaman
                likeCount.textContent = `${updatedMessage.likes} Suka`;
            } catch (error) {
                console.error('Error liking post:', error);
                alert('Gagal menyukai postingan.');
            } finally {
                likeBtn.disabled = false; // Aktifkan kembali tombol
            }
        });

        // Gabungkan footer
        postFooter.appendChild(postTime);
        postFooter.appendChild(likeContainer);

        // Gabungkan semua ke kontainer utama
        storyContainer.appendChild(postHeader);
        storyContainer.appendChild(postContent);
        storyContainer.appendChild(postFooter);
    }
});