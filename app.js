let glossary = JSON.parse(localStorage.getItem("glossary")) || {};

function saveGlossary() {
    const rows = document.querySelectorAll("#glossaryTable tbody tr");
    glossary = {};

    rows.forEach(row => {
        const it = row.children[0].innerText.trim();
        const en = row.children[1].innerText.trim();
        if (it && en) glossary[it.toLowerCase()] = en;
    });

    localStorage.setItem("glossary", JSON.stringify(glossary));
    alert("Glossario salvato");
}

function exportGlossary() {
    const data = Object.entries(glossary)
        .map(([it, en]) => `${it};${en}`)
        .join("\n");

    const blob = new Blob([data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "glossario.csv";
    a.click();
}

function translateText() {
    const text = document.getElementById("inputText").value;
    const words = text.split(/[\s,.;:]+/);

    let missing = new Set();

    function applyGlossary(str) {
        return str.split(" ").map(w => {
            const key = w.toLowerCase();
            if (glossary[key]) return glossary[key].toUpperCase();
            missing.add(w);
            return w.toUpperCase();
        }).join(" ");
    }

    const t1 = applyGlossary(text);
    const t2 = applyGlossary(text.replace("LISCIO", "PLAIN"));

    document.getElementById("output1").value = t1;
    document.getElementById("output2").value = t2;
    document.getElementById("missingTerms").value = [...missing].join("\n");
}

document.getElementById("fileInput").addEventListener("change", function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(evt) {
        const lines = evt.target.result.split("\n");
        const tbody = document.querySelector("#glossaryTable tbody");
        tbody.innerHTML = "";

        lines.forEach(line => {
            const [it, en] = line.split(";");
            if (it && en) {
                const row = document.createElement("tr");
                row.innerHTML = `<td contenteditable="true">${it}</td><td contenteditable="true">${en}</td>`;
                tbody.appendChild(row);
            }
        });
    };

    reader.readAsText(file);
});
