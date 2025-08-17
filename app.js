Backendless.initApp("B04A6F3D-58B6-44F8-A4AC-02E62F559E6B", "D7A9D456-17DA-4810-AE0E-5AAADA5C95E2");

let currentType = "lost";
let reports = [];

const homeView = document.getElementById("homeView");
const formView = document.getElementById("formView");
const successView = document.getElementById("successView");
const reportsView = document.getElementById("reportsView");
const reportForm = document.getElementById("reportForm");
const photoPreview = document.getElementById("photoPreview");
const petPhotoInput = document.getElementById("petPhoto");
const reportsContainer = document.getElementById("reportsContainer");
const filterSelect = document.getElementById("filterSelect");

window.openForm = openForm;
window.backHome = backHome;
window.showReports = showReports;
window.addComment = addComment;
window.openPopup = openPopup;
window.closePopup = closePopup;

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
  } else if (type === "terms") {
    document.getElementById("popupTitle").innerText = "Όροι Χρήσης";
    document.getElementById("popupText").innerHTML =
      "Η ιστοσελίδα PET SOS FINDER ανήκει στον Σωτήρη Δημητρίου.<br><br>" +
      "Η χρήση της ιστοσελίδας συνεπάγεται την αποδοχή των όρων:<br>" +
      "• Οι αναφορές κατοικιδίων πρέπει να είναι αληθείς και χωρίς προσβλητικό περιεχόμενο.<br>" +
      "• Απαγορεύεται η κακόβουλη χρήση ή η δημοσίευση ψευδών στοιχείων.<br>" +
      "• Ο δημιουργός δεν φέρει ευθύνη για τυχόν ανακρίβειες που υποβάλλονται από χρήστες.";
  }
}
function closePopup() {
  document.getElementById("popupOverlay").style.display = "none";
}

petPhotoInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    photoPreview.innerHTML = `<img src="${url}">`;
  } else {
    photoPreview.textContent = "Προεπισκόπηση";
  }
});

reportForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("petName").value.trim();
  const desc = document.getElementById("petDesc").value.trim();
  const loc = document.getElementById("petLoc").value.trim();
  const contact = document.getElementById("petContact").value.trim();
  const file = petPhotoInput.files[0];

  try {
    let photoURL = "";
    if (file) {
      const uploaded = await Backendless.Files.upload(file, "pet_photos");
      photoURL = uploaded.fileURL;
    }

    await Backendless.Data.of("reports").save({
      type: currentType,
      name,
      desc,
      loc,
      contact,
      photo: photoURL,
      comments: [],
      createdAt: new Date().toISOString() // Ημερομηνία καταχώρησης
    });

    reportForm.reset();
    photoPreview.innerHTML = "Προεπισκόπηση";

    formView.style.display = "none";
    successView.style.display = "block";
  } catch (err) {
    console.error("Error saving report:", err);
    alert("Σφάλμα στην αποθήκευση της αναφοράς");
  }
});

function renderComments(comments) {
  if (!comments || comments.length === 0)
    return "<p style='font-size:12px;color:gray;'>Κανένα σχόλιο</p>";
  return comments.map((c) => `<div class="comment">${c}</div>`).join("");
}

async function addComment(id) {
  const input = document.getElementById("inp_" + id);
  const text = input.value.trim();
  if (!text) return;

  // Αν το σχόλιο είναι DELETE → Διαγραφή αναφοράς
  if (text.toUpperCase() === "DELETE") {
    if (confirm("Σίγουρα θέλεις να διαγράψεις αυτή την αναφορά;")) {
      try {
        await Backendless.Data.of("reports").remove(id);
        alert("Η αναφορά διαγράφηκε.");
        showReports();
      } catch (err) {
        console.error("Error deleting report:", err);
        alert("Σφάλμα κατά τη διαγραφή.");
      }
    }
    input.value = "";
    return;
  }

  try {
    const report = await Backendless.Data.of("reports").findById(id);
    report.comments = report.comments || [];
    report.comments.push(text);
    await Backendless.Data.of("reports").save(report);
    showReports();
  } catch (err) {
    console.error("Error adding comment:", err);
  }

  input.value = "";
}

async function showReports() {
  reportsContainer.innerHTML = "";
  const filter = filterSelect?.value || "all";

  try {
    let query = {};
    if (filter !== "all") {
      query = { where: `type = '${filter}'` };
    }
    reports = await Backendless.Data.of("reports").find(query);

    if (!reports || reports.length === 0) {
      reportsContainer.innerHTML = "<p>Δεν υπάρχουν αναφορές</p>";
      return;
    }

    reports.forEach((r) => {
      const statusText = r.type === "lost" ? "Χαμένο" : "Βρέθηκε";
      const foundNote = r.type === "found"
        ? "<p style='color:green;font-weight:bold;'>✅ Βρέθηκε</p>"
        : "";

      const card = document.createElement("div");
      card.className = "report-card";
      card.innerHTML = `
        <div class="report-top" style="flex-direction:column; align-items:center;">
          <div class="thumb" style="width:100%; max-height:300px; border-radius:12px; overflow:hidden;">
            ${r.photo ? `<img src="${r.photo}" style="width:100%; height:100%; object-fit:cover;">` : ""}
          </div>
          <div class="meta" style="text-align:center; margin-top:10px;">
            <h3>${r.name} - ${statusText}</h3>
            <p>${r.desc || ""}</p>
            ${foundNote}
            <p style="font-size:12px;color:gray;">📍 ${r.loc}</p>
            <p style="font-size:12px;color:#000;">📞 ${r.contact}</p>
            <p style="font-size:12px;color:#555;">📅 ${r.createdAt ? new Date(r.createdAt).toLocaleString("el-GR") : ""}</p>
          </div>
        </div>
        <div class="comments" id="c_${r.objectId}">${renderComments(r.comments)}</div>
        <div class="add-comment">
          <input type="text" id="inp_${r.objectId}" placeholder="Σχόλιο...">
          <button onclick="addComment('${r.objectId}')">Αποστολή</button>
        </div>
      `;
      reportsContainer.appendChild(card);
    });

    homeView.style.display = "none";
    formView.style.display = "none";
    successView.style.display = "none";
    reportsView.style.display = "block";
  } catch (err) {
    console.error("Error fetching reports:", err);
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("✅ Service Worker registered"))
      .catch((err) => console.error("SW registration failed", err));
  });
}
// Slide-in κουμπί
window.addEventListener('load', () => {
  const btn = document.getElementById('buyEbookBtn');
  setTimeout(() => btn.classList.add('show'), 300);
});

// Popup λειτουργικότητα
const popup = document.getElementById('ebookPopup');
const btn = document.getElementById('buyEbookBtn');
const closeBtn = document.querySelector('.close-btn');

btn.addEventListener('click', () => popup.classList.add('show'));
closeBtn.addEventListener('click', () => popup.classList.remove('show'));
window.addEventListener('click', (e) => {
  if(e.target === popup) popup.classList.remove('show');
});
