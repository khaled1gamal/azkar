let btn = document.querySelectorAll("h4 > button");
document.querySelector("body > div > main > section > h4 > button");

btn.forEach((item) => {
  item.addEventListener("click", (eo) => {
    Number(eo.target.innerText--);
    if (eo.target.innerText == 0) {
      eo.target.setAttribute("disabled", "");
      eo.target.style.backgroundColor = "red";
    }
  });
});

let morning = document.getElementById('morning');
let morningSec = document.getElementById('morning-sec');
let evening = document.getElementById('evening');
let eveningSec = document.getElementById('evening-sec');

morning.style.borderBottom = 'solid 3px red';
evening.addEventListener('click', (eo) => {
  eveningSec.style.display = 'grid'
  morningSec.style.display = 'none'
  evening.style.borderBottom = 'solid 3px red';
  morning.style.borderBottom = 'none';
})
morning.addEventListener('click', (eo) => {
  morningSec.style.display = 'grid'
  eveningSec.style.display = 'none'
  morning.style.borderBottom = 'solid 3px red';
  evening.style.borderBottom = 'none';
})
