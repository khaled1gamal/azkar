let morning = document.getElementById("morning");
let morningSec = document.getElementById("morning-sec");
let evening = document.getElementById("evening");
let eveningSec = document.getElementById("evening-sec");

morning.style.borderBottom = "solid 3px red";
evening.addEventListener("click", () => {
  eveningSec.style.display = "grid";
  morningSec.style.display = "none";
  evening.style.borderBottom = "solid 3px red";
  morning.style.borderBottom = "none";
});
morning.addEventListener("click", () => {
  morningSec.style.display = "grid";
  eveningSec.style.display = "none";
  morning.style.borderBottom = "solid 3px red";
  evening.style.borderBottom = "none";
});

async function loadAzkar() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();

    // Filter data
    const morningData = data.filter((item) => item.category === "صباح");
    const eveningData = data.filter((item) => item.category === "مساء");

    // Render Function
    const renderAzkar = (azkarList, container) => {
      container.innerHTML = ""; // Clear existing content
      azkarList.forEach((item) => {
        const h4 = document.createElement("h4");
        h4.innerText = item.text; // Add text

        const br = document.createElement("br");
        h4.appendChild(br);

        const button = document.createElement("button");
        button.innerText = item.count; // Add count

        // Add event listener immediately
        button.addEventListener("click", (eo) => {
          let count = Number(eo.target.innerText);
          count--;
          eo.target.innerText = count;

          if (count === 0) {
            eo.target.setAttribute("disabled", "");
            eo.target.style.backgroundColor = "red";
            eo.target.style.color = "white"; // Make text readable on red bg
          }
        });

        h4.appendChild(button);
        container.appendChild(h4);
      });
    };

    // Render for both sections
    renderAzkar(morningData, morningSec);
    renderAzkar(eveningData, eveningSec);
  } catch (error) {
    console.error("Error loading Azkar:", error);
  }
}

// Load Azkar on page load
loadAzkar();
