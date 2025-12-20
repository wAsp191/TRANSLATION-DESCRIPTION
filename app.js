// ======================================================
// 1. GESTIONE GLOSSARIO (LOCALSTORAGE)
// ======================================================

let glossary = {};

// Carica glossario da LocalStorage
function loadGlossary() {
    const stored = localStorage.getItem("glossary");
    glossary = stored ? JSON.parse(stored) : {};
    renderGlossaryTable();
}

// Salva glossario su LocalStorage
function saveGlossary() {
    localStorage.setItem("glossary", JSON.stringify(glossary));
    alert("Glossario salvato.");
}

// ======================================================
// 2. TABELLA GLOSSARIO
// ======================================================

function renderGlossaryTable() {
    const tbody = document.querySelector("#glossaryTable tbody");
    tbody.innerHTML = "";

    const entries = Object.entries(glossary);

    if (entries.length === 0) {
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

// Legge la tabella e aggiorna il glossario
function readGlossaryFromTable() {
    const rows = document.querySelectorAll("#glossaryTable tbody tr");
    const newGlossary = {};

    rows.forEach(row => {
        const it = row.children[0].innerText.trim();
        const en = row.children[1].innerText.trim();
        if (it && en) newGlossary[it.toLowerCase()] = en;
    });

    glossary = newGlossary;
}

// Aggiunge una riga vuota
function addRow() {
    const tbody = document.querySelector("#glossaryTable tbody");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
    `;
    tbody.appendChild(row);
}

// ======================================================
// 3. IMPORT / EXPORT CSV
// ======================================================

// Import CSV (Italiano;Inglese)
function importCSV(file) {
    const reader = new FileReader();

    reader.onload = function (evt) {
        const lines = evt.target.result.split(/\r?\n/);
        const imported = {};

        lines.forEach((line, index) => {
            if (!line.trim()) return;
            const parts = line.split(";");

            if (parts.length < 2) return;

            let it = parts[0].trim();
            let en = parts[1].trim();

            if (index === 0 && it.toLowerCase() === "italiano") return;

            imported[it.toLowerCase()] = en;
        });

        glossary = imported;
        saveGlossary();
        renderGlossaryTable();
        alert("Glossario importato.");
    };

    reader.readAsText(file, "UTF-8");
}

// Esporta CSV
function exportCSV() {
    let csv = "Italiano;Inglese\n";

    Object.entries(glossary).forEach(([it, en]) => {
        csv += `${it};${en}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "glossario_itab.csv";
    a.click();

    URL.revokeObjectURL(url);
}

// ======================================================
// 4. TRADUZIONE ASSISTITA
// ======================================================

// Mini-dizionario per suggerimenti automatici
function autoTranslate(word) {
    const dict = {
        "liscio": "smooth",
        "scantonato": "notched",
        "sganciabile": "detachable",
        "nervato": "ribbed",
        "non nervato": "unribbed",
        "centrale": "central",
        "filo": "wire",
        "multilame": "multistrip",
        "multibarra": "multibar"
    };

    return dict[word.toLowerCase()] || "";
}

// Mostra suggerimenti
function showSuggestions(list) {
    const container = document.getElementById("suggestions");
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p style='font-size:12px;color:#666;'>Nessun termine nuovo.</p>";
        return;
    }

    list.forEach(item => {
        const div = document.createElement("div");
        div.className = "suggestion-row";

        div.innerHTML = `
            <input value="${item.it}" readonly>
            <input value="${item.en}" class="en-edit" placeholder="Traduzione...">
            <button class="add-btn">Aggiungi</button>
        `;

        div.querySelector(".add-btn").onclick = () => {
            const en = div.querySelector(".en-edit").value.trim();
            if (!en) {
                alert("Inserisci una traduzione valida.");
                return;
            }

            glossary[item.it.toLowerCase()] = en;
            saveGlossary();
            renderGlossaryTable();
            div.remove();
        };

        container.appendChild(div);
    });
}

// ======================================================
// 5. MOTORE DI TRADUZIONE (MATCH INTELLIGENTE)
// ======================================================

function translateText() {
    const input = document.getElementById("inputText").value;
    if (!input.trim()) {
        alert("Inserisci del testo.");
        return;
    }

    readGlossaryFromTable();

    // Ordina per lunghezza decrescente (match frasi lunghe prima)
    const entries = Object.entries(glossary)
        .sort((a, b) => b[0].length - a[0].length);

    let translated = input.toUpperCase();

    // MATCH INTELLIGENTE
    entries.forEach(([it, en]) => {
        const escaped = it.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "gi");
        translated = translated.replace(regex, en.toUpperCase());
    });

    // TRADUZIONE 1
    document.getElementById("output1").value = translated;

    // TRADUZIONE 2 (variante)
    document.getElementById("output2").value = translated.replace(/LISCIO/g, "PLAIN");

    // TERMINI MANCANTI
    const words = input.split(/[\s,.;:()\/\-]+/);
    const missing = [];

    words.forEach(w => {
        const key = w.toLowerCase();
        const found = entries.some(([it]) => it.toLowerCase() === key);
        if (!found && w.trim()) missing.push(w);
    });

    document.getElementById("missingTerms").value = missing.join("\n");

    // Suggerimenti
    const suggestions = missing.map(it => ({
        it,
        en: autoTranslate(it)
    }));

    showSuggestions(suggestions);
}

// ======================================================
// 6. EVENTI
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    loadGlossary();

    document.getElementById("saveBtn").onclick = () => {
        readGlossaryFromTable();
        saveGlossary();
    };

    document.getElementById("exportBtn").onclick = exportCSV;

    document.getElementById("addRowBtn").onclick = addRow;

    document.getElementById("translateBtn").onclick = translateText;

    document.getElementById("fileInput").addEventListener("change", e => {
        const file = e.target.files[0];
        if (file) importCSV(file);
        e.target.value = "";
    });
});
