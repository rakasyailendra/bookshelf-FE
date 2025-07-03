document.addEventListener('DOMContentLoaded', () => {
    // --- KONSTANTA DAN STATE APLIKASI ---
    const STORAGE_KEY = 'BOOKSHELF_PRO_DATA';
    const THEME_KEY = 'BOOKSHELF_THEME';
    const RENDER_EVENT = 'render-bookshelf';
    
    let bookCollection = [];
    let activeEditId = null;
    let bookIdToDelete = null;

    // --- SELEKTOR DOM ---
    const DOM = {
        // Form Tambah Buku
        bookForm: document.getElementById('bookForm'),
        bookFormTitle: document.getElementById('bookFormTitle'),
        bookFormAuthor: document.getElementById('bookFormAuthor'),
        bookFormYear: document.getElementById('bookFormYear'),
        bookFormIsComplete: document.getElementById('bookFormIsComplete'),
        bookFormSubmit: document.getElementById('bookFormSubmit'),
        submitButtonText: document.getElementById('submitButtonText'),
        
        // Form Pencarian
        searchForm: document.getElementById('searchBook'),
        searchInput: document.getElementById('searchBookTitle'),

        // Rak Buku
        incompleteShelf: document.getElementById('incompleteBookList'),
        completeShelf: document.getElementById('completeBookList'),
        
        // Modal Konfirmasi
        modal: document.getElementById('confirmationModal'),
        modalConfirm: document.getElementById('modalConfirm'),
        modalCancel: document.getElementById('modalCancel'),

        // Tombol Tema
        themeSwitcher: document.getElementById('theme-switcher')
    };

    // --- FUNGSI TEMA (DARK/LIGHT MODE) ---
    const applyTheme = (theme) => {
        document.body.setAttribute('data-theme', theme);
        const icon = DOM.themeSwitcher.querySelector('i');
        icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (error) {
            console.error("Gagal menyimpan tema:", error);
        }
    };

    const toggleTheme = () => {
        const currentTheme = localStorage.getItem(THEME_KEY) || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    };

    const loadTheme = () => {
        try {
            const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
            applyTheme(savedTheme);
        } catch (error) {
            console.error("Gagal memuat tema:", error);
            applyTheme('light');
        }
    };

    // --- FUNGSI UTAMA & PEMROSESAN DATA ---
    const loadDataFromStorage = () => {
        try {
            const serializedData = localStorage.getItem(STORAGE_KEY);
            if (serializedData) {
                bookCollection = JSON.parse(serializedData);
            }
        } catch (error) {
            console.error("Gagal memuat data:", error);
            bookCollection = [];
        }
        document.dispatchEvent(new Event(RENDER_EVENT));
    };

    const saveDataToStorage = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(bookCollection));
        } catch (error) {
            console.error("Gagal menyimpan data:", error);
        }
    };

    const createUniqueId = () => +new Date();

    const createBookObject = (id, title, author, year, isComplete) => ({
        id, title, author, year: Number(year), isComplete
    });
    
    const findBookById = (bookId) => bookCollection.find(book => book.id === bookId);
    const findBookIndex = (bookId) => bookCollection.findIndex(book => book.id === bookId);
    
    const addBook = () => {
        const id = createUniqueId();
        const title = DOM.bookFormTitle.value.trim();
        const author = DOM.bookFormAuthor.value.trim();
        const year = DOM.bookFormYear.value.trim();
        const isComplete = DOM.bookFormIsComplete.checked;

        if (!title || !author || !year) {
            alert("Harap isi semua kolom: Judul, Penulis, dan Tahun.");
            return;
        }

        const newBook = createBookObject(id, title, author, year, isComplete);
        bookCollection.push(newBook);
        
        DOM.bookForm.reset();
        saveDataToStorage();
        document.dispatchEvent(new Event(RENDER_EVENT));
    };

    // --- FUNGSI INTERAKSI BUKU ---
    const toggleBookStatus = (bookId) => {
        const book = findBookById(bookId);
        if (!book) return;
        book.isComplete = !book.isComplete;
        saveDataToStorage();
        document.dispatchEvent(new Event(RENDER_EVENT));
    };
    
    const openDeleteModal = (bookId) => {
        bookIdToDelete = bookId;
        DOM.modal.classList.add('show');
    };

    const closeDeleteModal = () => {
        bookIdToDelete = null;
        DOM.modal.classList.remove('show');
    };

    const confirmDelete = () => {
        if (!bookIdToDelete) return;
        const bookIndex = findBookIndex(bookIdToDelete);
        if (bookIndex > -1) {
            bookCollection.splice(bookIndex, 1);
            saveDataToStorage();
            document.dispatchEvent(new Event(RENDER_EVENT));
        }
        closeDeleteModal();
    };

    // --- FUNGSI RENDER TAMPILAN ---
    const buildBookElement = (book) => {
        const bookItem = document.createElement('div');
        bookItem.setAttribute('data-bookid', book.id);
        bookItem.setAttribute('data-testid', 'bookItem');
        bookItem.classList.add('book-item');

        const bookTitle = document.createElement('h3');
        bookTitle.setAttribute('data-testid', 'bookItemTitle');
        bookTitle.innerText = book.title;

        const bookAuthor = document.createElement('p');
        bookAuthor.setAttribute('data-testid', 'bookItemAuthor');
        bookAuthor.innerText = `Penulis: ${book.author}`;

        const bookYear = document.createElement('p');
        bookYear.setAttribute('data-testid', 'bookItemYear');
        bookYear.innerText = `Tahun: ${book.year}`;
        
        const actionContainer = document.createElement('div');
        actionContainer.classList.add('book-item-actions');

        const moveButton = document.createElement('button');
        moveButton.setAttribute('data-testid', 'bookItemIsCompleteButton');
        moveButton.classList.add('action-btn');
        
        const deleteButton = document.createElement('button');
        deleteButton.setAttribute('data-testid', 'bookItemDeleteButton');
        deleteButton.classList.add('action-btn', 'delete');
        deleteButton.innerHTML = `<i class="fa-solid fa-trash"></i>`;
        deleteButton.title = 'Hapus buku';
        deleteButton.addEventListener('click', () => openDeleteModal(book.id));

        if (book.isComplete) {
            moveButton.classList.add('undo');
            moveButton.innerHTML = `<i class="fa-solid fa-rotate-left"></i>`;
            moveButton.title = 'Tandai belum dibaca';
            moveButton.addEventListener('click', () => toggleBookStatus(book.id));
        } else {
            moveButton.classList.add('move');
            moveButton.innerHTML = `<i class="fa-solid fa-check"></i>`;
            moveButton.title = 'Tandai sudah dibaca';
            moveButton.addEventListener('click', () => toggleBookStatus(book.id));
        }

        actionContainer.append(moveButton, deleteButton);
        bookItem.append(bookTitle, bookAuthor, bookYear, actionContainer);

        return bookItem;
    };
    
    const refreshBookShelves = (query = '') => {
        DOM.incompleteShelf.innerHTML = '';
        DOM.completeShelf.innerHTML = '';
        
        const filteredBooks = bookCollection.filter(book => 
            book.title.toLowerCase().includes(query.toLowerCase())
        );

        let incompleteCount = 0;
        let completeCount = 0;

        for (const book of filteredBooks) {
            const bookElement = buildBookElement(book);
            if (book.isComplete) {
                DOM.completeShelf.appendChild(bookElement);
                completeCount++;
            } else {
                DOM.incompleteShelf.appendChild(bookElement);
                incompleteCount++;
            }
        }
        
        if (incompleteCount === 0) {
            DOM.incompleteShelf.innerHTML = `<p class="empty-message">${query ? 'Tidak ada hasil di rak ini' : 'Tidak ada buku di rak ini.'}</p>`;
        }
        if (completeCount === 0) {
            DOM.completeShelf.innerHTML = `<p class="empty-message">${query ? 'Tidak ada hasil di rak ini' : 'Belum ada buku yang selesai dibaca.'}</p>`;
        }
    };
    
    // --- EVENT LISTENERS ---
    DOM.bookForm.addEventListener('submit', (event) => {
        event.preventDefault();
        addBook();
    });

    // PERBAIKAN: Listener untuk live search. Setiap kali user mengetik, rak akan difilter.
    DOM.searchInput.addEventListener('input', () => {
        const query = DOM.searchInput.value;
        refreshBookShelves(query);
    });

    // Mencegah form pencarian me-reload halaman saat tombol Enter atau tombol Cari diklik.
    // Logika pencarian sudah ditangani oleh listener 'input'.
    DOM.searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    DOM.themeSwitcher.addEventListener('click', toggleTheme);
    
    // Listener ini memastikan tampilan tetap terfilter setelah aksi lain (tambah/hapus/pindah)
    document.addEventListener(RENDER_EVENT, () => {
        const query = DOM.searchInput.value;
        refreshBookShelves(query);
    });

    DOM.modalConfirm.addEventListener('click', confirmDelete);
    DOM.modalCancel.addEventListener('click', closeDeleteModal);

    DOM.bookFormIsComplete.addEventListener('change', () => {
        const text = DOM.bookFormIsComplete.checked ? 'Selesai dibaca' : 'Belum selesai dibaca';
        DOM.submitButtonText.innerText = `Masukkan Buku ke rak "${text}"`;
    });

    // --- INISIALISASI APLIKASI ---
    loadTheme();
    loadDataFromStorage();
});
