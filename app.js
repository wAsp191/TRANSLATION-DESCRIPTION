// =========================
// GLOSSARIO (LOCALSTORAGE)
// =========================

let glossary = {};

// Carica glossario da LocalStorage all'avvio
function loadGlossaryFromStorage() {
    const stored = localStorage.getItem("glossary");
    if (stored) {
        try {
            glossary = JSON.parse(stored);
        } catch (e) {
            console.error("Errore parsing glossario:", e);
            glossary = {};
        }
    } else {
        glossary = {};
    }
    renderGlossaryTable();
}

// Salva glossario su LocalStorage
function saveGlossaryToStorage() {
    localStorage.setItem("glossary", JSON.stringify(glossary));
    alert("Glossario salvato nel browser.");
}

// =========================
// TABELLA GLOSSARIO
// =========================

function renderGlossaryTable() {
    const tbody = document.querySelector("#glossaryTable tbody");
    tbody.innerHTML = "";

    const entries = Object.entries(glossary);

    if (entries.length === 0) {
        // riga vuota iniziale
        const row = document.createElement("tr");
        row.innerHTML = `
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
        `;
        tbody.appendChild(row);
        return;
    }

    entries.forEach(([it, en]) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td contenteditable="true">${it}</td>
            <td contenteditable="true">${en}</td>
        `;
        tbody.appendChild(row);
    });
}

// Legge la tabella e aggiorna l'oggetto glossary
function readGlossaryFromTable() {
    const rows = document.querySelectorAll("#glossaryTable tbody tr");
    const newGlossary = {};

    rows.forEach(row => {
        const it = row.children[0].innerText.trim();
        const en = row.children[1].innerText.trim();
        if (it && en) {
            newGlossary[it.toLowerCase()] = en;
        }
    });

    glossary = newGlossary;
}

// Aggiungi una riga vuota alla tabella
function addGlossaryRow() {
    const tbody = document.querySelector("#glossaryTable tbody");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
    `;
    tbody.appendChild(row);
}

// =========================
// IMPORT / EXPORT CSV
// =========================

// Import CSV (Italiano;Inglese)
function importGlossaryFromCSV(file) {
    const reader = new FileReader();
    reader.onload = function (evt) {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/);
        const imported = {};

        lines.forEach((line, index) => {
            if (!line.trim()) return;
            const parts = line.split(";");
            if (parts.length < 2) return;

            let it = parts[0].trim();
            let en = parts[1].trim();

            // salta eventuali header tipo "Italiano;Inglese"
            if (index === 0 && it.toLowerCase() === "italiano") return;

            if (it && en) {
                imported[it.toLowerCase()] = en;
            }
        });

        glossary = imported;
        saveGlossaryToStorage();
        renderGlossaryTable();
        alert("Glossario importato dal CSV.");
    };

    reader.readAsText(file, "UTF-8");
}

// Esporta glossario in CSV (Italiano;Inglese)
function exportGlossaryToCSV() {
    const entries = Object.entries(glossary);
    if (entries.length === 0) {
        alert("Glossario vuoto, niente da esportare.");
        return;
    }

    let csv = "Italiano;Inglese\n";
    entries.forEach(([it, en]) => {
        csv += `${it};${en}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "glossario_itab.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =========================
// TRADUZIONE ASSISTITA
// =========================

// Dizionario base per suggerimenti automatici (puoi espanderlo)
function autoTranslate(word) {
    const dictionary = {
        "liscio": "smooth",
        "scantonato": "notched",
        "sganciabile": "detachable",
        "piede": "foot",
        "piedino": "foot",
        "nervato": "ribbed",
        "non nervato": "unribbed",
        "centrale": "central",
        "filo": "wire",
        "multilame": "multistrip",
        "multibarra": "multibar"
    };

    return dictionary[word.toLowerCase()] || "";
}

// Mostra la lista di suggerimenti modificabili
function showSuggestions(list) {
    const container = document.getElementById("suggestions");
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p style='font-size:12px; color:#6b7280;'>Nessun termine nuovo da suggerire.</p>";
        return;
    }

    list.forEach(item => {
        const div = document.createElement("div");
        div.className = "suggestion-row";

        div.innerHTML = `
            <input value="${item.it}" readonly>
            <input value="${item.en}" class="en-edit" placeholder="Inserisci traduzione...">
            <button class="add-btn">Aggiungi al glossario</button>
        `;

        const addBtn = div.querySelector(".add-btn");
        const enInput = div.querySelector(".en-edit");

        addBtn.onclick = () => {
            const itKey = item.it.trim().toLowerCase();
            const enValue = enInput.value.trim();
            if (!enValue) {
                alert("Inserisci una traduzione inglese prima di aggiungere al glossario.");
                return;
            }
            glossary[itKey] = enValue;
            saveGlossaryToStorage();
            renderGlossaryTable();
            alert(`Aggiunto al glossario:\n${item.it} → ${enValue}`);
            div.remove();
        };

        container.appendChild(div);
    });
}

// =========================
// MOTORE DI TRADUZIONE
// =========================

function translateText() {
    const input = document.getElementById("inputText").value;
    if (!input.trim()) {
        alert("Inserisci del testo da tradurre.");
        return;
    }

    // Ordina il glossario per lunghezza decrescente della chiave italiana
    const entries = Object.entries(glossary)
        .sort((a, b) => b[0].length - a[0].length);

    // Lavoriamo su una versione maiuscola del testo, per rispettare il requisito
    let translated = input.toUpperCase();

    // MATCH INTELLIGENTE: sostituisce termini del glossario anche dentro frasi più lunghe
    entries.forEach(([it, en]) => {
        if (!it) return;
        const escaped = it.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(escaped, "gi");
        translated = translated.replace(pattern, en.toUpperCase());
    });

    // Rilevazione termini mancanti (grezza ma utile per suggerimenti)
    const words = input.split(/[\s,.;:()\/\-]+/);
    const missing = new Set();

    words.forEach(w => {
        const clean = w.trim();
        if (!clean) return;
        const key = clean.toLowerCase();

        // verifica se esiste esattamente come voce di glossario
        const found = entries.some(([it]) => it.toLowerCase() === key);
        if (!found) {
            missing.add(clean);
        }
    });

    // TRADUZIONE 1
    document.getElementById("output1").value = translated;

    // TRADUZIONE 2 (esempio semplice: LISCIO → PLAIN)
    const variant = translated.replace(/LISCIO/g, "PLAIN");
    document.getElementById("output2").value = variant;

    // Lista testuale dei termini mancanti
    const missingList = [...missing];
    document.getElementById("missingTerms").value = missingList.join("\n");

    // Costruisci lista di suggerimenti con traduzione assistita
    const suggestions = missingList.map(it => ({
        it,
        en: autoTranslate(it)
    }));

    showSuggestions(suggestions);
}

// =========================
// EVENT LISTENERS
// =========================

document.addEventListener("DOMContentLoaded", () => {
    // Carica glossario da LocalStorage
    loadGlossaryFromStorage();

    // Pulsante salva glossario
    document.getElementById("saveBtn").addEventListener("click", () => {
        readGlossaryFromTable();
        saveGlossaryToStorage();
    });

    // Pulsante esporta glossario
    document.getElementById("exportBtn").addEventListener("click", () => {
        readGlossaryFromTable();
        exportGlossaryToCSV();
    });

    // Pulsante aggiungi riga
    document.getElementById("addRowBtn").addEventListener("click", () => {
        addGlossaryRow();
    });

    // Pulsante traduci
    document.getElementById("translateBtn").addEventListener("click", () => {
        readGlossaryFromTable();
        translateText();
    });

    // Import CSV
    document.getElementById("fileInput").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        importGlossaryFromCSV(file);
        e.target.value = "";
    });
});
