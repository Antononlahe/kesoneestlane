const panel = document.getElementById("panel");
const nameEl = document.getElementById("panel-name");
const photoEl = document.getElementById("panel-photo");
const noteEl = document.getElementById("panel-note");
const coordsEl = document.getElementById("panel-coords");
const bars = {
  valimus: document.getElementById("bar-valimus"),
  temperament: document.getElementById("bar-temperament"),
  kultuur: document.getElementById("bar-kultuur"),
};
const nums = {
  valimus: document.getElementById("num-valimus"),
  temperament: document.getElementById("num-temperament"),
  kultuur: document.getElementById("num-kultuur"),
};

function fmt(n) {
  return n.toFixed(2);
}

export function showPerson(person) {
  nameEl.textContent = person.name;
  if (person.portrait) {
    photoEl.src = person.portrait;
    photoEl.hidden = false;
  } else {
    photoEl.removeAttribute("src");
    photoEl.hidden = true;
  }
  noteEl.textContent = person.note || "";
  noteEl.hidden = !person.note;
  for (const key of ["valimus", "temperament", "kultuur"]) {
    bars[key].style.width = `${person[key] * 100}%`;
    nums[key].textContent = fmt(person[key]);
  }
  coordsEl.textContent = `(${fmt(person.valimus)}, ${fmt(person.temperament)}, ${fmt(person.kultuur)})`;
  panel.hidden = false;
}

export function hidePanel() {
  panel.hidden = true;
}

export function bindPanelClose(onClose) {
  document.getElementById("panel-close").addEventListener("click", (e) => {
    e.stopPropagation();
    onClose();
  });
}
