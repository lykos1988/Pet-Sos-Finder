// === Supabase Config ===
const SUPABASE_URL = "https://wvpgrjykqzkolaczbcqr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cGdyanlrcXprb2xhY3piY3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzczMDYsImV4cCI6MjA3MDY1MzMwNn0.OyjI4flh86LTOXp8LaR04xhS7pkrTbZYy-62YU7ovJI";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentType = "lost";

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

// === Make functions global for inline onclick ===
window.openForm = openForm;
window.backHome = backHome;
window.showReports = showReports;
window.addComment = addComment;
window.openPopup = openPopup;
window.closePopup = closePopup;

// === Functions ===
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

// === Preview Image ===
petPhotoInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreview.innerHTML = `<img src="${e.target.result}">`;
    };
    reader.readAsDataURL(file);
  }
});

// === Submit Report ===
reportForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("petName").value.trim();
  const desc = document.getElementById("petDesc").value.trim();
  const loc = document.getElementById("petLoc").value.trim();
  const contact = document.getElementById("petContact").value.trim();

  let photoURL = "";

  const file = petPhotoInput.files[0];
  if (file) {
    const fileName = `${Date.now()}_${file.name}`;
    const { error: imgError } = await supabaseClient.storage
      .from("pets")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (imgError) {
      alert("Σφάλμα κατά το ανέβασμα της φωτογραφίας");
      console.error(imgError);
      return;
    }

    const { data: publicUrl } = supabaseClient.storage
      .from("pets")
      .getPublicUrl(fileName);
    photoURL = publicUrl.publicUrl;
  }

  const { error } = await supabaseClient.from("reports").insert([
    {
      type: currentType,
      name: name,
      Desc: desc,
      loc: loc,
      contact: contact,
      Photo: photoURL,
      comments: []
    }
  ]);

  if (error) {
    alert("Σφάλμα καταχώρησης αναφοράς");
    console.error(error);
    return;
  }

  reportForm.reset();
  photoPreview.innerHTML = "Προεπισκόπηση";
  formView.style.display = "none";
  successView.style.display = "block";
});

// === Render Comments ===
function renderComments(comments) {
  if (!comments || comments.length === 0)
    return "<p style='font-size:12px;color:gray;'>Κανένα σχόλιο</p>";
  return comments.map((c) => `<div class="comment">${c}</div>`).join("");
}

// === Add Comment ===
async function addComment(id) {
  const input = document.getElementById("inp_" + id);
  const text = input.value.trim();
  if (!text) return;

  const { data, error } = await supabaseClient
    .from("reports")
    .select("comments")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  let comments = data.comments || [];
  comments.push(text);

  const { error: updateError } = await supabaseClient
    .from("reports")
    .update({ comments })
    .eq("id", id);

  if (updateError) {
    console.error(updateError);
    return;
  }

  showReports();
}

// === Show Reports ===
async function showReports() {
  reportsContainer.innerHTML = "";
  const filter = filterSelect?.value || "all";

  let query = supabaseClient
    .from("reports")
    .select("*")
    .order("id", { ascending: false });

  if (filter !== "all") {
    query = query.eq("type", filter);
  }

  const { data: reports, error } = await query;
  if (error) {
    console.error(error);
    return;
  }

  if (!reports || reports.length === 0) {
    reportsContainer.innerHTML = "<p>Δεν υπάρχουν αναφορές</p>";
    return;
  }

  reports.forEach((r) => {
    const statusText = r.type === "lost" ? "Χαμένο" : "Βρέθηκε";
    const foundNote =
      r.type === "found"
        ? "<p style='color:green;font-weight:bold;'>✅ Βρέθηκε</p>"
        : "";

    const card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML = `
      <div class="report-top" style="flex-direction:column; align-items:center;">
        <div class="thumb" style="width:100%; height:auto; max-height:300px; border-radius:12px; overflow:hidden;">
          ${
            r.Photo
              ? `<img src="${r.Photo}" style="width:100%; height:100%; object-fit:cover; display:block;">`
              : ""
          }
        </div>
        <div class="meta" style="text-align:center; margin-top:10px;">
          <h3>${r.name} - ${statusText}</h3>
          <p>${r.Desc || ""}</p>
          ${foundNote}
          <p style="font-size:12px;color:gray;">📍 ${r.loc}</p>
          <p style="font-size:12px;color:#000;">📞 ${r.contact}</p>
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
