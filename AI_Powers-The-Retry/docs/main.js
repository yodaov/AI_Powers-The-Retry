// Set this to your deployed backend URL for production
// e.g. "https://your-backend.onrender.com/generatePower"
const API_URL = "https://YOUR-BACKEND.onrender.com/generatePower";

const btn = document.getElementById("generateBtn");
const input = document.getElementById("promptInput");
const brainstormBox = document.getElementById("brainstorm");
const changeKeyBtn = document.getElementById("changeKeyBtn");

const keyModal = document.getElementById("keyModal");
const keyInput = document.getElementById("keyInput");
const rememberTab = document.getElementById("rememberTab");
const cancelKey = document.getElementById("cancelKey");
const saveKey = document.getElementById("saveKey");

// Runtime key: held in memory unless user chooses sessionStorage
let runtimeKey = null;

function getStoredKey() {
  return sessionStorage.getItem("openai_key") || null;
}
function setStoredKey(valueOrNull) {
  if (valueOrNull) sessionStorage.setItem("openai_key", valueOrNull);
  else sessionStorage.removeItem("openai_key");
}
function openKeyModal(prefill = "") {
  keyInput.value = prefill || "";
  rememberTab.checked = false;
  keyModal.classList.add("open");
  keyInput.focus();
}
function closeKeyModal() {
  keyModal.classList.remove("open");
}
function ensureKey() {
  // priority: memory → sessionStorage → modal
  if (runtimeKey) return true;
  const stored = getStoredKey();
  if (stored) {
    runtimeKey = stored;
    return true;
  }
  openKeyModal("");
  return false;
}

// Change/set key
changeKeyBtn.onclick = () => openKeyModal(runtimeKey || getStoredKey() || "");

// Modal events
cancelKey.onclick = () => {
  closeKeyModal();
};
saveKey.onclick = () => {
  const val = keyInput.value.trim();
  if (!val) return;
  runtimeKey = val;
  if (rememberTab.checked) setStoredKey(val);
  else setStoredKey(null);
  closeKeyModal();
};

btn.onclick = async () => {
  const prompt = input.value.trim();
  if (!prompt) return;

  // ensure we have a key
  if (!ensureKey()) return; // modal opened; user must press Save

  brainstormBox.innerText = "⏳ Generating...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-OpenAI-Key": runtimeKey // BYOK header
      },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `HTTP ${res.status}`);
    }

    const { output } = await res.json();

    // Split brainstorm (first line) from JSON (rest)
    const firstBrace = output.indexOf("{");
    const brainstorm = firstBrace > 0 ? output.slice(0, firstBrace).trim() : output.trim();
    const jsonText = firstBrace > -1 ? output.slice(firstBrace) : "{}";

    let spec = {};
    try {
      spec = JSON.parse(jsonText);
    } catch (e) {
      brainstormBox.innerText = "⚠️ Failed to parse AI JSON.\n\n" + output;
      return;
    }

    // Show brainstorm to user
    brainstormBox.innerText = brainstorm || "(no brainstorm text)";

    // Expose power for renderer.js
    window.currentPower = spec;

  } catch (err) {
    brainstormBox.innerText = `❌ Error: ${err.message || err}`;
  }
};

// Optional: open key modal on page load if no key present
window.addEventListener("load", () => {
  if (!getStoredKey()) openKeyModal("");
});
