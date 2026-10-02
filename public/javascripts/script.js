document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // LOCAL STORAGE
  // =========================

  let applications = JSON.parse(localStorage.getItem("applications")) || [];

  // =========================
  // APPLICATION PAGE ELEMENTS
  // =========================

  const openBtn = document.getElementById("openModalBtn");

  const modal = document.getElementById("applicationModal");

  const closeBtn = document.getElementById("closeModalBtn");

  const closeBtn2 = document.getElementById("closeModalBtn2");

  const form = document.getElementById("applicationForm");

  const tableBody = document.getElementById("applicationTableBody");
const resumeBtn = document.getElementById("resumeBtn");

if (resumeBtn) {
    resumeBtn.addEventListener("click", () => {
        window.location.href = "/resume";
    });
}
const suggestions = [
  "Improve your DSA and React skills to increase placement chances.",
  "Practice 2 LeetCode problems daily.",
  "Build one full-stack MERN project.",
  "Strengthen your SQL and DBMS concepts.",
  "Update your resume with recent projects.",
  "Practice HR interview questions.",
  "Improve communication and aptitude skills.",
  "Contribute to an open-source project.",
  "Revise OOPs and Operating System concepts.",
  "Optimize your LinkedIn profile."
];
const suggestion = document.getElementById("aiSuggestion");

if (suggestion) {
    const randomIndex = Math.floor(Math.random() * suggestions.length);
    suggestion.textContent = suggestions[randomIndex];
}
const progressBar = document.getElementById("progressBar");

if (progressBar) {
    const atsScore = Number(progressBar.dataset.score) || 0;
    const progressFill = document.getElementById("progressFill");

    if (progressFill) {
        progressFill.style.width = Math.min(atsScore, 100) + "%";
    }
}

  // =========================
  // OPEN MODAL
  // =========================

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    });
  }

  // =========================
  // CLOSE MODAL
  // =========================

  function closeModal() {
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  if (closeBtn2) {
    closeBtn2.addEventListener("click", closeModal);
  }

  // =========================
  // DISPLAY APPLICATIONS
  // =========================

  function displayApplications() {
    if (!tableBody) return;

    tableBody.innerHTML = "";

    applications.forEach((app, index) => {
      const row = `
      
      <tr class="border-b hover:bg-gray-700 hover:border-violet-500  transition">

        <td class="py-4 ">${app.company||"-"}</td>

        <td>${app.role ||"-"}</td>

        <td>${app.date ||"-"}</td>

        <td>
          <span class="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm">
            ${app.status ||"-"}
          </span>
        </td>

        <td>${app.packageValue ||"-"}</td>
        <td>${app.notes ||"-"}</td>

       ${
        window.location.pathname.includes("application")?`
         <td>
          <button
            onclick="deleteApplication(${index})"
            class="text-red-500"
          >
            Delete
          </button>
        </td>
      ` : ""
       }
      </tr>

      `;

      tableBody.innerHTML += row;
    });
  }

  displayApplications();

  // =========================
  // ADD APPLICATION
  // =========================

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const inputs = form.querySelectorAll("input");

      const company = inputs[0].value;

      const role = inputs[1].value;

      const packageValue = inputs[2].value;

      const status = form.querySelector("select").value;

      const notes = form.querySelector("textarea").value;

      const date = new Date().toLocaleDateString();

      const newApplication = {
        company,
        role,
        packageValue,
        status,
        notes,
        date,
      };

      applications.push(newApplication);

      localStorage.setItem("applications", JSON.stringify(applications));

      displayApplications();

      form.reset();

      closeModal();

      updateDashboard();
    });
  }

  // =========================
  // DELETE
  // =========================

  window.deleteApplication = function (index) {
    applications.splice(index, 1);

    localStorage.setItem("applications", JSON.stringify(applications));

    displayApplications();

    updateDashboard();
  };

  // =========================
  // DASHBOARD

  function updateDashboard() {
    const totalApplications = document.getElementById("totalApplications");

    const totalInterviews = document.getElementById("totalInterviews");

    const totalSelected = document.getElementById("totalSelected");
    const totalOA = document.getElementById("totalOA");
    

    if (totalApplications) {
      totalApplications.innerText = applications.length;
    }

    if (totalInterviews) {
      const interviews = applications.filter(
        (app) => app.status === "Interview",
      );

      totalInterviews.innerText = interviews.length;
    }

    if (totalSelected) {
      const selected = applications.filter((app) => app.status === "Selected");

      totalSelected.innerText = selected.length;
    }
    if (totalOA) {
      const OA = applications.filter((app) => app.status === "OA Round");

      totalOA.innerText = OA.length;
    }

  }

  updateDashboard();
  // =========================
  // SEARCH
  // =========================

  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("keyup", () => {
      const value = searchInput.value.toLowerCase();

      const rows = tableBody.querySelectorAll("tr");

      rows.forEach((row) => {
        const text = row.innerText.toLowerCase();

        if (text.includes(value)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  }
  // =========================
  // FILTER
  const statusFilter = document.getElementById("statusFilter");

  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      const value = statusFilter.value;

      const rows = tableBody.querySelectorAll("tr");

      rows.forEach((row) => {
        if (value === "All Status") {
          row.style.display = "";
        } else {
          if (row.innerText.includes(value)) {
            row.style.display = "";
          } else {
            row.style.display = "none";
          }
        }
      });
    });
  }
});

