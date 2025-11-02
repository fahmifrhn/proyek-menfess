document.addEventListener("DOMContentLoaded", function() {

    // Elemen Form (SAMA)
    const confessForm = document.getElementById("confess-form");
    const confessText = document.getElementById("confess-text");
    const postsFeed = document.getElementById("posts-feed");
    const categorySelect = document.getElementById("category-select");
    const anonCheck = document.getElementById("anon-check");
    const senderNameInput = document.getElementById("sender-name");
    const senderNameWrapper = document.getElementById("sender-name-wrapper");
    
    // --- ELEMEN SORTING BARU ---
    const sortNewBtn = document.getElementById("sort-new");
    const sortPopularBtn = document.getElementById("sort-popular");
    let currentSort = 'new'; // Default sort

    // Interaktivitas Form (SAMA)
    function toggleSenderName() { 
        if (anonCheck.checked) {
            senderNameWrapper.style.display = 'none';
            senderNameInput.value = '';
            senderNameInput.required = false;
        } else {
            senderNameWrapper.style.display = 'block';
            senderNameInput.required = true;
        }
    }
    anonCheck.addEventListener('change', toggleSenderName);
    toggleSenderName();

    // --- EVENT LISTENER SORTING BARU ---
    sortNewBtn.addEventListener('click', () => {
        if (currentSort === 'new') return; // Jangan lakukan apa-apa jika sudah aktif
        currentSort = 'new';
        sortNewBtn.classList.add('active');
        sortPopularBtn.classList.remove('active');
        loadMessages(currentSort);
    });

    sortPopularBtn.addEventListener('click', () => {
        if (currentSort === 'popular') return;
        currentSort = 'popular';
        sortPopularBtn.classList.add('active');
        sortNewBtn.classList.remove('active');
        loadMessages(currentSort);
    });

    // --- 1. MEMUAT PESAN (DIPERBARUI) ---
    async function loadMessages(sort = 'new') {
        try {
            // Tambahkan query parameter 'sort'
            const response = await fetch(`/api/messages?sort=${sort}`);
            if (!response.ok) throw new Error('Gagal mengambil data');
            
            const messages = await response.json();
            postsFeed.innerHTML = ""; 

            if (messages.length === 0) {
                postsFeed.innerHTML = "<p>Belum ada pesan. Jadilah yang pertama!</p>";
            } else {
                messages.forEach(msg => {
                    addNewPost(msg, false); // 'false' = append (tambah di bawah)
                });
            }
        } catch (error) {
            console.error('Error:', error);
            postsFeed.innerHTML = "<p>Gagal memuat pesan. Coba refresh.</p>";
        }
    }

    // --- 2. MENGIRIM PESAN (SAMA) ---
    confessForm.addEventListener("submit", async function(event) {
        event.preventDefault(); 
        const messageText = confessText.value;
        const category = categorySelect.value;
        const senderName = anonCheck.checked ? "Anonim" : senderNameInput.value.trim();
        
        // Validasi
        if (messageText.trim() === '' || category === '') {
            alert('Pesan dan kategori harus diisi!');
            return;
        }
        if (!anonCheck.checked && senderName.trim() === '') {
            alert('Nama samaran harus diisi jika tidak anonim!');
            return;
        }

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: messageText, category: category, sender: senderName })
            });

            if (!response.ok) {
                 const errData = await response.json();
                throw new Error(errData.error || 'Gagal mengirim pesan');
            }
            
            const newMessage = await response.json();
            
            if (postsFeed.querySelector('p')) {
                postsFeed.innerHTML = "";
            }

            addNewPost(newMessage, true); // 'true' = prepend (tambah di atas)
            
            // Reset form
            confessText.value = "";
            categorySelect.value = "";
            anonCheck.checked = true;
            toggleSenderName();
        } catch (error) {
             console.error('Error:', error);
            alert(`Terjadi kesalahan: ${error.message}`);
        }
    });

    // --- 3. FUNGSI MENAMPILKAN POST (DIPERBARUI) ---
    function addNewPost(message, prepend) {
        const newPost = document.createElement("div");
        newPost.classList.add("post");
        newPost.dataset.id = message.id;
        
        // Buat link wrapper untuk navigasi ke halaman detail
        const postLink = document.createElement("a");
        postLink.classList.add("post-link");
        postLink.href = `/detail.html?id=${message.id}`;
        
        // 1. Header (Pengirim & Kategori)
        const postHeader = document.createElement("div");
        postHeader.classList.add("post-header");
        postHeader.innerHTML = `
            <span class="post-sender">${message.sender}</span>
            <span class="post-category category-${message.category}">${message.category}</span>
        `;
        postLink.appendChild(postHeader);

        // 2. Konten Teks
        const postContent = document.createElement("p");
        postContent.classList.add("post-text");
        postContent.textContent = message.text;
        
        // Logika "Read More"
        const MAX_CHAR_LIMIT = 400;
        if (message.text.length > MAX_CHAR_LIMIT) {
            postContent.classList.add("truncated");
            // Buat 'read more' sebagai bagian dari link
            const readMoreLink = document.createElement("span");
            readMoreLink.classList.add("read-more-link");
            readMoreLink.textContent = "Lihat lebih banyak";
            postContent.appendChild(readMoreLink);
        }
        postLink.appendChild(postContent);
        
        // Tambahkan link ke post
        newPost.appendChild(postLink);
        
        // 3. Buat Footer (Waktu & Like)
        // Ini DILUAR <a> tag, jadi tidak akan memicu navigasi
        const postFooter = document.createElement("div");
        postFooter.classList.add("post-footer");

        const postTime = document.createElement("span");
        postTime.classList.add("post-time");
        postTime.textContent = message.time;

        const likeContainer = document.createElement("div");
        likeContainer.classList.add("like-container");

        const likeBtn = document.createElement("button");
        likeBtn.classList.add("like-btn");
        likeBtn.innerHTML = "❤️"; // Emoji hati
        
        const likeCount = document.createElement("span");
        likeCount.classList.add("like-count");
        likeCount.textContent = `${message.likes || 0} Suka`;

        likeContainer.appendChild(likeBtn);
        likeContainer.appendChild(likeCount);
        
        // Event listener untuk Tombol LIKE
        likeBtn.addEventListener('click', async (e) => {
            // Kita tidak perlu e.stopPropagation() karena tombol ini
            // sudah berada di luar tag <a>
            likeBtn.disabled = true; // Cegah spam klik

            try {
                const response = await fetch(`/api/messages/${message.id}/like`, { method: 'POST' });
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

        postFooter.appendChild(postTime);
        postFooter.appendChild(likeContainer);
        newPost.appendChild(postFooter);

        // 4. Tambahkan ke DOM
        if (prepend) {
            postsFeed.prepend(newPost);
        } else {
            postsFeed.append(newPost);
        }
    }

    // Panggil fungsi untuk memuat pesan saat halaman pertama kali dibuka
    loadMessages(currentSort);
});

