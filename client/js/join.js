// =========================
// DEBUG (STEP 3)
// =========================
console.log("join.js loaded");

// =========================
// DOM ELEMENTS
// =========================
const input = document.getElementById("roomCode");
const joinBtn = document.getElementById("joinBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const errorMsg = document.getElementById("errorMsg");

// Safety check (VERY IMPORTANT)
if (!joinBtn || !createRoomBtn || !input) {
  console.error("Required DOM elements not found");
}

// =========================
// AUTO FORMAT XXXX-XXXX
// =========================
input?.addEventListener("input", () => {
  let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (value.length > 4) {
    value = value.slice(0, 4) + "-" + value.slice(4, 8);
  }

  input.value = value;
  hideError();
});

// =========================
// JOIN ROOM
// =========================
joinBtn?.addEventListener("click", async () => {
  console.log("Join Room clicked");

  const code = input.value;
  const roomCodeRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  if (!code) {
    triggerError("Room code is required");
    return;
  }

  if (!roomCodeRegex.test(code)) {
    triggerError("Invalid room code format (XXXX-XXXX)");
    return;
  }

  setLoading(true);

  try {
    const isValid = await validateRoomOnServer(code);

    if (!isValid) {
      triggerError("Room does not exist");
      setLoading(false);
      return;
    }

    console.log("Room valid, redirecting...");
    window.location.href = `/pages/canvas.html?code=${code}`;

  } catch (err) {
    console.error(err);
    triggerError("Server error. Please try again.");
    setLoading(false);
  }
});

// =========================
// CREATE NEW ROOM
// =========================
createRoomBtn?.addEventListener("click", async () => {
  console.log("Create New Room clicked");

  setLoading(true);

  try {
    const res = await fetch("/api/rooms/create", {
      method: "POST",
    });

    if (!res.ok) throw new Error("API failed");

    const data = await res.json();
    console.log("Room created:", data.code);

    window.location.href = `/pages/canvas.html?code=${data.code}`;

  } catch (err) {
    console.error(err);
    triggerError("Unable to create room. Try again.");
    setLoading(false);
  }
});

// =========================
// SERVER VALIDATION API
// =========================
async function validateRoomOnServer(code) {
  const res = await fetch(`/api/rooms/validate?code=${code}`);

  if (!res.ok) return false;

  const data = await res.json();
  return data.exists === true;
}

// =========================
// UI HELPERS
// =========================
function triggerError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = "block";

  const card = document.querySelector(".card");
  card.classList.remove("shake");
  void card.offsetWidth; // restart animation
  card.classList.add("shake");
}

function hideError() {
  errorMsg.style.display = "none";
}

function setLoading(state) {
  joinBtn.classList.toggle("loading", state);
}
