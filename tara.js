let itemidincre=0;

const divisions = {
  "asset identification": {
    class: "asset",
    fields: ["item id", "asset name", "asset type", "cybersecurity prospect"]
  },
  "damage scenario": {
    class: "damage",
    fields: ["severe consequences", "damage scenario", "damage scenario rationale"]
  },
  "threat identification": {
    class: "threat",
    fields: ["STRIDE classification", "threat level", "threat scenario"]
  },
  "impact rating": {
    class: "impact",
    fields: ["safety (road view)", "privacy (road view)", "operational (road view)",
             "financial (road view)", "brand (OEM view)", "financial (OEM view)",
             "operational (OEM view)", "impact sum", "impact rating"]
  },
  "attack path analysis": {
    class: "attack-path",
    fields: ["attack path id", "attack path", "attack vector", "CAL analysis"]
  },
  "attack feasibility rating": {
    class: "attack-rating",
    fields: ["elapsed time", "special expertise", "knowledge of item", "window of opportunity",
             "equipment", "attack potential", "attack feasibility rating", "attack feasibility rationale"]
  },
  "risk treatment decision": {
    class: "risk-decision",
    fields: ["maximal risk value", "risk rating", "risk treatment", "risk treatment decision rationale",
             "cyber security goals", "cybersecurity claims"]
  },
  "security control": {
    class: "security-control",
    fields: ["strategy for security control"]
  },
  "new attack feasibility and residual risk": {
    class: "residual-risk",
    fields: ["elapsed time", "specialist expertise", "knowledge of item", "window of opportunity",
             "equipment", "attack potential", "attack feasibility rating", "attack feasibility rationale",
             "new maximal risk value", "new maximal risk rating"]
  }
};

const allFields = Object.values(divisions).flatMap(d => d.fields);
let assetAutofillData = [];
let dropdownData = {};

function buildHeader() {
  const headerRow = document.getElementById("header-row");
  const divisionRow = document.getElementById("division-labels");
  headerRow.innerHTML = "";
  divisionRow.innerHTML = "";

  for (const [divisionName, def] of Object.entries(divisions)) {
    const colspan = def.fields.length;
    const divTh = document.createElement("th");
    divTh.setAttribute("colspan", colspan);
    divTh.className = `division-label ${def.class}`;
    divTh.textContent = divisionName.charAt(0).toUpperCase() + divisionName.slice(1);
    divisionRow.appendChild(divTh);

    def.fields.forEach(field => {
      const th = document.createElement("th");
      th.className = def.class;
      th.textContent = field;
      headerRow.appendChild(th);
    });
  }

  const divTh = document.createElement("th");
  divTh.className = "division-label";
  divTh.textContent = "";
  divisionRow.appendChild(divTh);

  const delTh = document.createElement("th");
  delTh.textContent = "❌";
  headerRow.appendChild(delTh);
}

function loadDropdowns() {
  allFields.forEach(field => {
    const saved = localStorage.getItem("tara_dropdown_" + field);
    dropdownData[field] = saved ? JSON.parse(saved) : [];
  });
}

function saveDropdownValue(field, value) {
  if (!dropdownData[field]) dropdownData[field] = [];
  if (value && !dropdownData[field].includes(value)) {
    dropdownData[field].push(value);
    localStorage.setItem("tara_dropdown_" + field, JSON.stringify(dropdownData[field]));
  }
}

function createInput(field, value = "", rowRef = null) {
  const input = document.createElement("input");
  input.setAttribute("placeholder", field);
  input.setAttribute("list", `list-${field}`);
  input.className = "cell-input";
  input.value = value;

  input.addEventListener("change", () => {
    saveDropdownValue(field, input.value);
    if (["asset name", "asset type", "cybersecurity prospect"].includes(field) && rowRef) {
      autofillAsset(field, input.value, rowRef);
    }
    saveTable();
    populateDatalist(field);
  });

  return input;
}

function createDatalist(field) {
  const datalist = document.createElement("datalist");
  datalist.id = `list-${field}`;
  return datalist;
}

function populateDatalist(field) {
  const datalist = document.querySelector(`#list-${CSS.escape(field)}`);
  if (!datalist) return;
  datalist.innerHTML = "";
  (dropdownData[field] || []).forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    datalist.appendChild(option);
  });
}

function autofillAsset(changedField, value, row) {
  const fields = ["asset name", "asset type", "asset id", "cybersecurity prospect"];
  const inputs = row.querySelectorAll("input");

  // Build the current row's asset values
  const current = {};
  fields.forEach(field => {
    const idx = allFields.indexOf(field);
    if (idx !== -1 && inputs[idx]) {
      current[field] = inputs[idx].value;
    }
  });

  // Try to find a matching entry in the assetAutofillData
  const match = assetAutofillData.find(item =>
    fields.every(field => !current[field] || item[field] === current[field])
  );

  if (!match) return;

  // Fill in any missing fields from the match
  fields.forEach(field => {
    const idx = allFields.indexOf(field);
    const input = inputs[idx];
    if (input && (!input.value || input.value.trim() === "")) {
      input.value = match[field] || "";
    }
  });
}


function addRow(data = {}) {
  const tr = document.createElement("tr");
  allFields.forEach(field => {
    const td = document.createElement("td");
    const input = createInput(field, data[field] || "", tr);
    const datalist = createDatalist(field);
    td.appendChild(input);
    td.appendChild(datalist);
    tr.appendChild(td);
  });
  const tdDel = document.createElement("td");
  const del = document.createElement("button");
  del.textContent = "❌";
  del.onclick = () => { tr.remove(); saveTable(); };
  tdDel.appendChild(del);
  tr.appendChild(tdDel);
  document.querySelector("#tara-table tbody").appendChild(tr);

  allFields.forEach(populateDatalist);
}

function saveTable() {
  const rows = document.querySelectorAll("#tara-table tbody tr");
  const tableData = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const rowData = {};
    inputs.forEach((input, i) => {
      rowData[allFields[i]] = input.value;
      saveDropdownValue(allFields[i], input.value);
    });

    const assetRow = {};
    ["asset name", "asset type", "asset id", "cybersecurity prospect"].forEach(f => {
      assetRow[f] = rowData[f];
    });
    if (!assetAutofillData.some(entry => JSON.stringify(entry) === JSON.stringify(assetRow))) {
      assetAutofillData.push(assetRow);
    }

    const impactCols = [
      "safety (road view)", "privacy (road view)", "operational (road view)",
      "financial (road view)", "brand (OEM view)", "financial (OEM view)",
      "operational (OEM view)"
    ];
    const sum = impactCols.reduce((acc, k) => acc + (parseFloat(rowData[k]) || 0), 0);
    rowData["impact sum"] = sum.toFixed(2);
    rowData["impact rating"] = sum > 15 ? "High" : sum > 7 ? "Medium" : "Low";

    tableData.push(rowData);
  });
  localStorage.setItem("tara_full_table", JSON.stringify(tableData));
  document.getElementById("output").style.display = "block";
  document.getElementById("output").textContent = JSON.stringify(tableData, null, 2);
}

function loadTable() {
  const saved = JSON.parse(localStorage.getItem("tara_full_table") || "[]");
  saved.forEach(row => addRow(row));
}

function exportTable() {
  const data = localStorage.getItem("tara_full_table");
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tara_table_export.json";
  a.click();
}

function importTable() {
  document.getElementById("importFile").click();
  document.getElementById("importFile").onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = JSON.parse(evt.target.result);
      // ✅ No longer clears the table — it appends
      data.forEach(row => addRow(row));
      saveTable(); // saves the updated table with appended rows
    };
    reader.readAsText(file); // ✅ reading as text instead of binary
  };
}


window.onload = () => {
  buildHeader();
  loadDropdowns();
  loadTable();
};

function exportToExcel() {
  const data = JSON.parse(localStorage.getItem("tara_full_table") || "[]");
  if (data.length === 0) return alert("No data to export!");

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "TARA Data");

  XLSX.writeFile(workbook, "tara_table_export.xlsx");
}

async function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const rows = document.querySelectorAll("#tara-table tbody tr");
  if (rows.length === 0) {
    alert("No data to export!");
    return;
  }

  const headers = allFields.map(f => f.toUpperCase());
  const data = [];

  rows.forEach(row => {
    const rowData = [];
    const inputs = row.querySelectorAll("input");
    inputs.forEach(input => rowData.push(input.value));
    data.push(rowData);
  });

  doc.setFontSize(10);
  doc.text("TARA Table Export", 10, 10);

  doc.autoTable({
    head: [headers],
    body: data,
    startY: 15,
    styles: {
      fontSize: 5,
      cellWidth: 'wrap',
      overflow: 'linebreak'
    },
    theme: "grid",
    margin: { top: 15, left: 5, right: 5 },
    tableWidth: 'wrap',
    pageBreak: 'auto',
    horizontalPageBreak: true, // <-- Enables horizontal paging for wide tables
    horizontalPageBreakRepeat: 0 // don't repeat columns
  });

  doc.save("tara_table_export.pdf");
}

function importFromExcel() {
  const input = document.getElementById("excelImportInput");
  input.click();

  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Append each new row to the existing table
      jsonData.forEach(row => addRow(row));
      saveTable(); // save updated table
    };

    reader.readAsBinaryString(file);
  };
}

