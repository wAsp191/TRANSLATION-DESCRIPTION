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
// 4. DIZIONARIO ASSISTITO (VERSIONE ESTESA + ABBREVIAZIONI TECNICHE)
// ======================================================

function autoTranslate(word) {
    const dict = {

        // ============================
        // ARTICOLI
        // ============================
        "il": "the", "lo": "the", "la": "the", "i": "the", "gli": "the", "le": "the",
        "un": "a", "uno": "a", "una": "a",

        // ============================
        // PREPOSIZIONI
        // ============================
        "di": "of", "a": "to", "da": "from", "in": "in", "con": "with", "su": "on",
        "per": "for", "tra": "between", "fra": "between",

        "del": "of the", "dello": "of the", "della": "of the",
        "dei": "of the", "degli": "of the", "delle": "of the",

        "al": "to the", "allo": "to the", "alla": "to the",
        "ai": "to the", "agli": "to the", "alle": "to the",

        "nel": "in the", "nello": "in the", "nella": "in the",
        "nei": "in the", "negli": "in the", "nelle": "in the",

        "sul": "on the", "sullo": "on the", "sulla": "on the",
        "sui": "on the", "sugli": "on the", "sulle": "on the",

        // ============================
        // ABBREVIAZIONI TECNICHE COMUNI
        // ============================
        "dx": "RH",          // destra
        "sx": "LH",          // sinistra
        "sup": "upper",      // superiore
        "inf": "lower",      // inferiore
        "ant": "front",      // anteriore
        "post": "rear",      // posteriore
        "int": "inner",      // interno
        "est": "outer",      // esterno
        "qty": "qty",        // quantità
        "q.tà": "qty",
        "qta": "qty",
        "ass": "assy",       // assembly
        "ass.": "assy",
        "dim": "dim",        // dimension
        "ref": "ref",        // reference
        "rif": "ref",
        "cod": "code",
        "cod.": "code",

        // ============================
        // AVVERBI
        // ============================
        "qui": "here", "qua": "here", "lì": "there", "là": "there",
        "sempre": "always", "mai": "never", "spesso": "often",
        "subito": "immediately", "ora": "now", "poi": "then",
        "dopo": "after", "prima": "before", "insieme": "together",

        // ============================
        // CONGIUNZIONI
        // ============================
        "e": "and", "ed": "and", "o": "or", "oppure": "or",
        "ma": "but", "però": "however", "anche": "also",
        "quindi": "therefore", "se": "if", "come": "as",

        // ============================
        // VERBI COMUNI
        // ============================
        "essere": "be", "avere": "have", "fare": "do",
        "andare": "go", "venire": "come", "usare": "use",
        "montare": "assemble", "smontare": "disassemble",
        "tagliare": "cut", "fissare": "fix",

        // PARTICIPI
        "montato": "assembled", "montata": "assembled",
        "smontato": "disassembled", "smontata": "disassembled",
        "tagliato": "cut", "tagliata": "cut",
        "fissato": "fixed", "fissata": "fixed",

        // ============================
        // PAROLE FUNZIONALI
        // ============================
        "tutto": "all", "tutta": "all", "tutti": "all", "tutte": "all",
        "ogni": "every", "qualche": "some", "alcuni": "some", "alcune": "some",

        // ============================
        // DIREZIONI E POSIZIONI
        // ============================
        "sopra": "above", "sotto": "below", "davanti": "in front",
        "dietro": "behind", "vicino": "near", "lontano": "far",
        "sinistra": "left", "destra": "right", "centro": "center",

        // ============================
        // NUMERI
        // ============================
        "uno": "one", "due": "two", "tre": "three", "quattro": "four",
        "cinque": "five", "sei": "six", "sette": "seven", "otto": "eight",
        "nove": "nine", "dieci": "ten", "venti": "twenty",
        "trenta": "thirty", "quaranta": "forty", "cinquanta": "fifty",
        "cento": "hundred",

        // ============================
        // PAROLE TECNICHE GENERICHE
        // ============================
        "parte": "part", "parti": "parts",
        "zona": "area", "zone": "areas",
        "punto": "point", "punti": "points",
        "linea": "line", "linee": "lines",
        "livello": "level", "livelli": "levels",
        "sezione": "section", "sezioni": "sections",
        "tipo": "type", "versione": "version",
        "modello": "model", "codice": "code",
        "nota": "note", "note": "notes"
    };

    return dict[word.toLowerCase()] || "";
}

// ======================================================
// 5. MOTORE DI TRADUZIONE (MATCH INTELLIGENTE + ASSISTITO)
// ======================================================

function translateText() {
    const input = document.getElementById("inputText").value;
    if (!input.trim()) {
        alert("Inserisci del testo.");
        return;
    }

    readGlossaryFromTable();

    const entries = Object.entries(glossary)
        .sort((a, b) => b[0].length - a[0].length);

    let translated = input.toUpperCase();

    entries.forEach(([it, en]) => {
        const escaped = it.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "gi");
        translated = translated.replace(regex, en.toUpperCase());
    });

    const tokens = input.split(/([\s,.;:()\/\-]+)/);
    let finalTranslated = "";
    const missing = [];
    const suggestions = [];

    for (let token of tokens) {
        if (!token.trim() || token.match(/^[\s,.;:()\/\-]+$/)) {
            finalTranslated += token;
            continue;
        }

        const lower = token.toLowerCase();
        const inGlossary = entries.some(([it]) => it.toLowerCase() === lower);

        if (inGlossary) {
            const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escaped, "gi");
            const match = translated.match(regex);
            finalTranslated += match ? match[0] : token.toUpperCase();
        } else {
            const suggestion = autoTranslate(token);
            if (suggestion) {
                finalTranslated += suggestion.toUpperCase();
                suggestions.push({ it: token, en: suggestion });
            } else {
                finalTranslated += token.toUpperCase();
                missing.push(token);
            }
        }
    }

    document.getElementById("output1").value = finalTranslated;
    document.getElementById("output2").value = finalTranslated.replace(/LISCIO/g, "PLAIN");

    const uniqueMissing = [...new Set(missing)];
    document.getElementById("missingTerms").value = uniqueMissing.join("\n");

    const uniqueSuggestions = Object.values(
        suggestions.reduce((acc, s) => {
            acc[s.it.toLowerCase()] = s;
            return acc;
        }, {})
    );

    showSuggestions(uniqueSuggestions);
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
