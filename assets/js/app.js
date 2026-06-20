/* =========================================================================
   PASSWORD GENERATOR PRO — APP.JS
   File ini dibagi menjadi beberapa "modul" sederhana (bukan ES module,
   cukup dipisah berdasarkan tanggung jawab) supaya mudah dipelajari:

   1. CHARSET            -> kumpulan karakter yang tersedia
   2. PASSWORD GENERATOR -> algoritma utama pembuatan password
   3. STRENGTH CHECKER   -> menilai kekuatan sebuah password
   4. ENTROPY            -> estimasi entropy sederhana
   5. PASSWORD ANALYZER  -> menganalisis password yang diketik user
   6. HISTORY (localStorage) -> menyimpan 10 password terakhir
   7. UI BINDINGS        -> menghubungkan semua modul di atas ke tampilan
   ========================================================================= */

(function () {
  "use strict";

  /* =======================================================================
     1. CHARSET
     Setiap kategori karakter disimpan sebagai string terpisah agar mudah
     digabung sesuai pilihan checkbox pengguna.
     ======================================================================= */
  const CHARSET = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    number: "0123456789",
    symbol: "!@#$%^&*",
  };

  // Karakter yang secara visual mudah tertukar (huruf kecil L, huruf besar I,
  // huruf besar O, angka 1 dan 0, dst). Dipakai untuk opsi "Sertakan Karakter
  // Ambigu" — saat dimatikan, karakter-karakter ini disaring keluar dari pool.
  const AMBIGUOUS_CHARS = "il1IO0|";

  /* =======================================================================
     2. PASSWORD GENERATOR
     Algoritma:
       a. Bangun "pool" karakter dari kategori yang dicentang user.
       b. Jika opsi karakter ambigu dimatikan, buang karakter ambigu dari pool.
       c. Validasi: pool tidak boleh kosong & panjang harus valid.
       d. Pilih karakter secara acak dari pool sebanyak `length` kali
          menggunakan Math.random().
       e. Gabungkan semua karakter terpilih menjadi satu string password.
     ======================================================================= */

  /**
   * Membangun pool karakter berdasarkan opsi yang dipilih pengguna.
   * @param {{lower:boolean, upper:boolean, number:boolean, symbol:boolean, ambiguous:boolean}} options
   * @returns {string} kumpulan karakter unik yang siap diacak
   */
  function buildCharacterPool(options) {
    let pool = "";

    // Langkah 1: gabungkan setiap kategori yang dicentang.
    if (options.lower) pool += CHARSET.lower;
    if (options.upper) pool += CHARSET.upper;
    if (options.number) pool += CHARSET.number;
    if (options.symbol) pool += CHARSET.symbol;

    // Langkah 2: jika user MEMATIKAN opsi "karakter ambigu", saring keluar
    // karakter-karakter yang mudah tertukar dari pool.
    if (!options.ambiguous) {
      pool = pool
        .split("")
        .filter((ch) => !AMBIGUOUS_CHARS.includes(ch))
        .join("");
    }

    return pool;
  }

  /**
   * Menghasilkan satu password acak.
   * @param {number} length panjang password (8-64)
   * @param {object} options opsi karakter, lihat buildCharacterPool
   * @returns {{password: string|null, error: string|null, poolSize: number}}
   */
  function generatePassword(length, options) {
    const pool = buildCharacterPool(options);

    // Validasi dasar: minimal satu kategori karakter harus aktif.
    if (pool.length === 0) {
      return { password: null, error: "Pilih minimal satu jenis karakter.", poolSize: 0 };
    }

    // Langkah 3 & 4: pilih karakter secara acak sebanyak `length` kali.
    // Math.random() menghasilkan angka 0 <= x < 1, dikalikan dengan panjang
    // pool lalu dibulatkan ke bawah (Math.floor) untuk mendapatkan index
    // karakter yang valid di dalam string pool.
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      result += pool[randomIndex];
    }

    return { password: result, error: null, poolSize: pool.length };
  }

  /* =======================================================================
     3. STRENGTH CHECKER
     Skor dihitung dari kombinasi: panjang password + jumlah kategori
     karakter yang dipakai (variasi) + sedikit bonus untuk password panjang.
     Skor 0-100 lalu dipetakan ke salah satu dari 5 kategori.
     ======================================================================= */

  function detectCharacterTypes(password) {
    return {
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^a-zA-Z0-9]/.test(password),
    };
  }

  /**
   * Menghitung skor kekuatan password (0-100).
   * Logika sederhana agar mudah dipahami pemula:
   *   - Variasi karakter: setiap kategori yang terpenuhi menyumbang 15 poin
   *     (maksimal 4 kategori = 60 poin).
   *   - Panjang: setiap karakter di atas 4 menyumbang ~1.1 poin,
   *     dibatasi maksimal 40 poin (tercapai pada panjang 40+).
   */
  function calculateStrengthScore(password) {
    if (!password) return 0;

    const types = detectCharacterTypes(password);
    const varietyCount = Object.values(types).filter(Boolean).length;
    const varietyScore = varietyCount * 15; // maksimal 60

    const lengthScore = Math.min(40, Math.max(0, (password.length - 4) * 1.1));

    const total = Math.round(varietyScore + lengthScore);
    return Math.max(0, Math.min(100, total));
  }

  /**
   * Memetakan skor (0-100) ke kategori kekuatan.
   */
  function scoreToLevel(score) {
    if (score < 30) return { level: "weak", label: "Weak" };
    if (score < 50) return { level: "fair", label: "Fair" };
    if (score < 70) return { level: "good", label: "Good" };
    if (score < 90) return { level: "strong", label: "Strong" };
    return { level: "very-strong", label: "Very Strong" };
  }

  /* =======================================================================
     4. ENTROPY ESTIMATION
     Rumus sederhana: Entropy (bits) = panjang × log2(ukuran character set)
     Semakin besar character set & semakin panjang password, semakin besar
     jumlah kemungkinan kombinasi yang harus ditebak penyerang.
     ======================================================================= */

  function calculateEntropy(length, poolSize) {
    if (poolSize <= 1 || length <= 0) return 0;
    const bits = length * Math.log2(poolSize);
    return Math.round(bits);
  }

  /* =======================================================================
     5. PASSWORD ANALYZER
     Menganalisis password yang diketik manual oleh pengguna, lalu
     memberi daftar rekomendasi konkret untuk meningkatkan keamanannya.
     ======================================================================= */

  function analyzePassword(password) {
    const types = detectCharacterTypes(password);
    const checks = {
      length: password.length >= 12,
      lower: types.lower,
      upper: types.upper,
      number: types.number,
      symbol: types.symbol,
    };

    const recommendations = [];
    if (!checks.length) recommendations.push("Gunakan panjang minimal 12 karakter");
    if (!checks.lower) recommendations.push("Tambahkan huruf kecil");
    if (!checks.upper) recommendations.push("Tambahkan huruf besar");
    if (!checks.number) recommendations.push("Tambahkan angka");
    if (!checks.symbol) recommendations.push("Tambahkan simbol");

    // Estimasi ukuran pool berdasarkan jenis karakter yang TERDETEKSI di
    // password (bukan dari pilihan generator), untuk estimasi entropy kasar.
    let estimatedPoolSize = 0;
    if (checks.lower) estimatedPoolSize += CHARSET.lower.length;
    if (checks.upper) estimatedPoolSize += CHARSET.upper.length;
    if (checks.number) estimatedPoolSize += CHARSET.number.length;
    if (checks.symbol) estimatedPoolSize += CHARSET.symbol.length;

    const entropy = calculateEntropy(password.length, estimatedPoolSize || 1);
    const score = calculateStrengthScore(password);

    return { checks, recommendations, entropy, score };
  }

  /* =======================================================================
     6. HISTORY (localStorage)
     Menyimpan maksimal 10 entri terakhir. Setiap entri berisi password,
     level kekuatan, dan timestamp pembuatan.
     ======================================================================= */

  const HISTORY_KEY = "pwgen_history_v1";
  const HISTORY_LIMIT = 10;

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn("Gagal membaca riwayat dari localStorage:", err);
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (err) {
      console.warn("Gagal menyimpan riwayat ke localStorage:", err);
    }
  }

  function addToHistory(password, level) {
    const history = loadHistory();
    history.unshift({
      password,
      level,
      createdAt: new Date().toISOString(),
    });
    const trimmed = history.slice(0, HISTORY_LIMIT);
    saveHistory(trimmed);
    return trimmed;
  }

  function clearHistory() {
    saveHistory([]);
    return [];
  }

  function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /* =======================================================================
     7. UI BINDINGS
     Bagian ini menghubungkan modul-modul di atas ke elemen HTML.
     ======================================================================= */

  document.addEventListener("DOMContentLoaded", () => {
    // --- Referensi elemen: Generator ---
    const lengthSlider = document.getElementById("length-slider");
    const lengthValue = document.getElementById("length-value");
    const optLower = document.getElementById("opt-lower");
    const optUpper = document.getElementById("opt-upper");
    const optNumber = document.getElementById("opt-number");
    const optSymbol = document.getElementById("opt-symbol");
    const optAmbiguous = document.getElementById("opt-ambiguous");
    const btnGenerate = document.getElementById("btn-generate");
    const generatorError = document.getElementById("generator-error");

    // --- Referensi elemen: Hasil ---
    const passwordOutput = document.getElementById("password-output");
    const btnCopy = document.getElementById("btn-copy");
    const btnRegenerate = document.getElementById("btn-regenerate");
    const strengthTag = document.getElementById("strength-tag");
    const strengthFill = document.getElementById("strength-fill");
    const strengthProgress = document.getElementById("strength-progress");
    const strengthScoreEl = document.getElementById("strength-score");
    const entropyValueEl = document.getElementById("entropy-value");

    // --- Referensi elemen: Analyzer ---
    const analyzerInput = document.getElementById("analyzer-input");
    const btnToggleVisibility = document.getElementById("btn-toggle-visibility");
    const checklistItems = document.querySelectorAll("#analyzer-checklist .checklist-item");
    const recommendList = document.getElementById("recommend-list");

    // --- Referensi elemen: Riwayat ---
    const historyBody = document.getElementById("history-body");
    const btnClearHistory = document.getElementById("btn-clear-history");

    // --- Toast ---
    const toastEl = document.getElementById("toast");
    let toastTimer = null;

    let currentPassword = null;

    /* ---------------------------------------------------------------------
       Helper: Toast Notification
       --------------------------------------------------------------------- */
    function showToast(message) {
      toastEl.textContent = message;
      toastEl.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toastEl.classList.remove("show");
      }, 2400);
    }

    /* ---------------------------------------------------------------------
       Helper: Update tampilan slider (nilai + warna track terisi)
       --------------------------------------------------------------------- */
    function updateSliderUI() {
      const min = Number(lengthSlider.min);
      const max = Number(lengthSlider.max);
      const val = Number(lengthSlider.value);
      const percent = ((val - min) / (max - min)) * 100;
      lengthSlider.style.setProperty("--fill", percent + "%");
      lengthValue.textContent = val;
    }

    /* ---------------------------------------------------------------------
       Helper: Render meter kekuatan password (progress bar + tag + skor)
       --------------------------------------------------------------------- */
    function renderStrength(password) {
      const score = calculateStrengthScore(password);
      const { level, label } = scoreToLevel(score);

      strengthFill.style.width = score + "%";
      strengthProgress.setAttribute("aria-valuenow", String(score));
      strengthTag.textContent = label;
      strengthTag.dataset.level = level;
      strengthScoreEl.innerHTML = score + "<small>/100</small>";

      const colorMap = {
        weak: "var(--color-danger)",
        fair: "var(--color-warning)",
        good: "var(--color-accent)",
        strong: "var(--color-success)",
        "very-strong": "var(--color-success)",
      };
      strengthFill.style.background = colorMap[level];

      return { score, level, label };
    }

    /* ---------------------------------------------------------------------
       Helper: Render daftar riwayat dari localStorage ke tabel
       --------------------------------------------------------------------- */
    function renderHistory() {
      const history = loadHistory();

      if (history.length === 0) {
        historyBody.innerHTML =
          '<tr class="history-empty-row"><td colspan="4">Belum ada riwayat. Password yang kamu generate akan muncul di sini.</td></tr>';
        return;
      }

      const colorMap = {
        weak: "var(--color-danger)",
        fair: "var(--color-warning)",
        good: "var(--color-accent)",
        strong: "var(--color-success)",
        "very-strong": "var(--color-success)",
      };

      historyBody.innerHTML = history
        .map((entry, idx) => {
          const levelInfo = scoreToLevel(calculateStrengthScore(entry.password));
          const color = colorMap[entry.level] || colorMap[levelInfo.level];
          return `
            <tr>
              <td>${escapeHtml(maskPassword(entry.password))}</td>
              <td><span class="history-strength-pill" style="background:${color}22;color:${color}">${entry.level ? capitalize(entry.level) : levelInfo.label}</span></td>
              <td class="history-date">${formatDate(entry.createdAt)}</td>
              <td>
                <button type="button" class="history-copy-btn" data-history-index="${idx}" aria-label="Copy password">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="1.8"/></svg>
                </button>
              </td>
            </tr>`;
        })
        .join("");

      // Bind tombol copy pada setiap baris riwayat.
      historyBody.querySelectorAll(".history-copy-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.historyIndex);
          const entry = history[idx];
          if (entry) copyText(entry.password);
        });
      });
    }

    function maskPassword(pw) {
      // Tampilkan penuh di tabel (riwayat lokal, tidak dikirim ke mana pun),
      // namun fungsi ini disediakan agar mudah diganti jadi mode tersamar
      // jika dibutuhkan saat dipelajari/dimodifikasi mahasiswa.
      return pw;
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).replace("-", " ");
    }

    /* ---------------------------------------------------------------------
       Helper: Copy ke clipboard + toast
       --------------------------------------------------------------------- */
    function copyText(text) {
      if (!text) return;
      navigator.clipboard
        .writeText(text)
        .then(() => showToast("Password berhasil disalin"))
        .catch(() => showToast("Gagal menyalin password"));
    }

    /* ---------------------------------------------------------------------
       Event: Slider panjang password
       --------------------------------------------------------------------- */
    lengthSlider.addEventListener("input", updateSliderUI);
    updateSliderUI();

    /* ---------------------------------------------------------------------
       Event: Tombol Generate Password
       --------------------------------------------------------------------- */
    function handleGenerate() {
      const options = {
        lower: optLower.checked,
        upper: optUpper.checked,
        number: optNumber.checked,
        symbol: optSymbol.checked,
        ambiguous: optAmbiguous.checked,
      };
      const length = Number(lengthSlider.value);

      const { password, error, poolSize } = generatePassword(length, options);

      if (error) {
        generatorError.textContent = error;
        generatorError.hidden = false;
        return;
      }
      generatorError.hidden = true;

      currentPassword = password;
      passwordOutput.textContent = password;
      passwordOutput.dataset.empty = "false";

      const { level } = renderStrength(password);
      const entropy = calculateEntropy(length, poolSize);
      entropyValueEl.innerHTML = entropy + "<small>bits</small>";

      btnCopy.disabled = false;
      btnRegenerate.disabled = false;

      const updated = addToHistory(password, level);
      renderHistory(updated);
    }

    btnGenerate.addEventListener("click", handleGenerate);
    btnRegenerate.addEventListener("click", handleGenerate);

    /* ---------------------------------------------------------------------
       Event: Tombol Copy Password (hasil generate)
       --------------------------------------------------------------------- */
    btnCopy.addEventListener("click", () => copyText(currentPassword));

    /* ---------------------------------------------------------------------
       Event: Password Analyzer (input manual)
       --------------------------------------------------------------------- */
    function handleAnalyzerInput() {
      const value = analyzerInput.value;

      if (!value) {
        checklistItems.forEach((item) => item.removeAttribute("data-pass"));
        recommendList.innerHTML = '<li class="recommend-empty">Masukkan password untuk melihat rekomendasi.</li>';
        return;
      }

      const { checks, recommendations } = analyzePassword(value);

      checklistItems.forEach((item) => {
        const key = item.dataset.key;
        item.dataset.pass = checks[key] ? "true" : "false";
      });

      if (recommendations.length === 0) {
        recommendList.innerHTML = '<li class="recommend-success">Password sudah memenuhi semua kriteria dasar!</li>';
      } else {
        recommendList.innerHTML = recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
      }
    }

    analyzerInput.addEventListener("input", handleAnalyzerInput);

    btnToggleVisibility.addEventListener("click", () => {
      const isPassword = analyzerInput.type === "password";
      analyzerInput.type = isPassword ? "text" : "password";
    });

    /* ---------------------------------------------------------------------
       Event: Hapus Riwayat
       --------------------------------------------------------------------- */
    btnClearHistory.addEventListener("click", () => {
      clearHistory();
      renderHistory();
      showToast("Riwayat password telah dihapus");
    });

    /* ---------------------------------------------------------------------
       Inisialisasi awal
       --------------------------------------------------------------------- */
    renderHistory();
  });
})();
