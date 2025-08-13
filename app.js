let currentType = "lost";
let reports = JSON.parse(localStorage.getItem("reports") || "[]");

// === Elements ===
const homeView = document.getElementById("homeView");
const formView = document.getElementById("formView");
const successView = document.getElementById("successView");
const reportsView = document.getElementById("reportsView");
const reportForm = document.getElementById("reportForm");
const photoPreview = document.getElementById("photoPreview");
const petPhotoInput = document.getElementById("petPhoto");
const reportsContainer = document.getElementById("reportsContainer");
const filterSelect = document.getElementById("filterSelect");

// === Make functions global ===
window.openForm = openForm;
window.backHome = backHome;
window.showReports = showReports;
window.addComment = addComment;
window.openPopup = openPopup;
window.closePopup = closePopup;
window.markAsFound = markAsFound;
window.deleteReport = deleteReport;

// === Navigation functions ===
function openForm(type) {
  currentType = type;
  document.getElementById("nameLabel").innerText =
    type === "found" ? "Ονοματεπώνυμο" : "Όνομα κατοικιδίου";
  homeView.style.display = "none";
  formView.style.display = "block";
}

function backHome() {
  homeView.style.display = "block";
  formView.style.display = "none";
  successView.style.display = "none";
  reportsView.style.display = "none";
}

function openPopup(type) {
  document.getElementById("popupOverlay").style.display = "flex";
  if (type === "contact") {
    document.getElementById("popupTitle").innerText = "Επικοινωνία";
    document.getElementById("popupText").innerHTML =
      "Μπορείτε να επικοινωνήσετε μαζί μου στο:<br><b>sotiris.dimitriou.1988@gmail.com</b>";
  } else if (type === "about") {
    document.getElementById("popupTitle").innerText = "Σχετικά με";
    document.getElementById("popupText").innerHTML =
      "Η ιστοσελίδα Pet SOS Finder δημιουργήθηκε για να βοηθήσει τους ιδιοκτήτες κατοικιδίων να βρουν τα χαμένα τους ζώα ή να αναφέρουν κατοικίδια που βρέθηκαν.";
  }
}
function closePopup() {
  document.getElementById("popupOverlay").style.display = "none";
}

// === Preview image ===
petPhotoInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreview.innerHTML = `<img src="${e.target.result}">`;
      photoPreview.dataset.image = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// === Submit Report ===
reportForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("petName").value.trim();
  const desc = document.getElementById("petDesc").value.trim();
  const loc = document.getElementById("petLoc").value.trim();
  const contact = document.getElementById("petContact").value.trim();
  const photoURL = photoPreview.dataset.image || "";

  const newReport = {
    id: Date.now(),
    type: currentType,
    name,
    Desc: desc,
    loc,
    contact,
    Photo: photoURL,
    comments: []
  };

  reports.unshift(newReport);
  localStorage.setItem("reports", JSON.stringify(reports));

  reportForm.reset();
  photoPreview.innerHTML = "Προεπισκόπηση";
  delete photoPreview.dataset.image;

  formView.style.display = "none";
  successView.style.display = "block";
});

// === Render Comments ===
function renderComments(comments) {
  if (!comments || comments.length === 0)
    return "<p style='font-size:12px;color:gray;'>Κανένα σχόλιο</p>";
  return comments.map((c) => `<div class="comment">${c}</div>`).join("");
}

// === Add Comment with delete check ===
function addComment(id) {
  const input = document.getElementById("inp_" + id);
  const text = input.value.trim();
  if (!text) return;

  if (text === "Διαγραφή") {
    deleteReport(id);
    return;
  }

  const report = reports.find(r => r.id === id);
  if (report) {
    report.comments.push(text);
    localStorage.setItem("reports", JSON.stringify(reports));
  }
  showReports();
}

// === Mark as Found ===
function markAsFound(id) {
  const report = reports.find(r => r.id === id);
  if (report) {
    report.type = "found";
    localStorage.setItem("reports", JSON.stringify(reports));
  }
  showReports();
}

// === Delete Report ===
function deleteReport(id) {
  reports = reports.filter(r => r.id !== id);
  localStorage.setItem("reports", JSON.stringify(reports));
  showReports();
}

// === Show Reports ===
function showReports() {
  reportsContainer.innerHTML = "";
  const filter = filterSelect?.value || "all";

  let filtered = reports;
  if (filter !== "all") {
    filtered = reports.filter(r => r.type === filter);
  }

  if (filtered.length === 0) {
    reportsContainer.innerHTML = "<p>Δεν υπάρχουν αναφορές</p>";
    return;
  }

  filtered.forEach((r) => {
    const statusText = r.type === "lost" ? "Χαμένο" : "Βρέθηκε";
    const foundNote = r.type === "found"
      ? "<p style='color:green;font-weight:bold;'>✅ Βρέθηκε</p>"
      : "";

    const card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML = `
      <div class="report-top" style="flex-direction:column; align-items:center;">
        <div class="thumb" style="width:100%; height:auto; max-height:300px; border-radius:12px; overflow:hidden;">
          ${r.Photo ? `<img src="${r.Photo}" style="width:100%; height:100%; object-fit:cover; display:block;">` : ""}
        </div>
        <div class="meta" style="text-align:center; margin-top:10px;">
          <h3>${r.name} - ${statusText}</h3>
          <p>${r.Desc || ""}</p>
          ${foundNote}
          <p style="font-size:12px;color:gray;">📍 ${r.loc}</p>
          <p style="font-size:12px;color:#000;">📞 ${r.contact}</p>
          <div style="margin-top:10px; display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
            ${r.type !== "found" ? `<button class="btn btn-found" style="padding:6px 10px; font-size:13px;" onclick="markAsFound(${r.id})">Σήμανση ως Βρέθηκε</button>` : ""}
            <button class="btn btn-view" style="padding:6px 10px; font-size:13px; border-color:red; color:red;" onclick="deleteReport(${r.id})">Διαγραφή</button>
          </div>
        </div>
      </div>
      <div class="comments" id="c_${r.id}">${renderComments(r.comments)}</div>
      <div class="add-comment">
        <input type="text" id="inp_${r.id}" placeholder="Σχόλιο...">
        <button onclick="addComment(${r.id})">Αποστολή</button>
      </div>
    `;
    reportsContainer.appendChild(card);
  });

  homeView.style.display = "none";
  formView.style.display = "none";
  successView.style.display = "none";
  reportsView.style.display = "block";
}

// === Register Service Worker ===
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("✅ Service Worker registered"))
      .catch((err) => console.error("SW registration failed", err));
  });
}
