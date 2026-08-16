import * as THREE from "three";
import { setPersonState } from "./sprites.js";
import { hidePanel, showPerson } from "./panel.js";

export function createPicker({ camera, peopleGroup, tooltip, onSelect }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  let selected = null;

  function hits() {
    return peopleGroup.children.flatMap((g) => [g.userData.hit, g.userData.sprite]);
  }

  function personFrom(obj) {
    return obj?.userData?.person
      ? peopleGroup.children.find((g) => g.userData.person === obj.userData.person)
      : null;
  }

  function refresh() {
    for (const g of peopleGroup.children) {
      setPersonState(g, {
        hovered: g === hovered,
        selected: g === selected,
      });
    }
  }

  function setHovered(group, event) {
    hovered = group;
    if (group) {
      tooltip.hidden = false;
      tooltip.textContent = group.userData.person.name;
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
    } else {
      tooltip.hidden = true;
    }
    refresh();
  }

  function select(group) {
    selected = group;
    if (group) showPerson(group.userData.person);
    else hidePanel();
    refresh();
    onSelect?.(group);
  }

  function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hits(), false)[0];
    const group = personFrom(hit?.object) ?? null;
    if (group !== hovered) setHovered(group, event);
    else if (group) {
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
    }
    document.body.style.cursor = group ? "pointer" : "";
  }

  function onClick(event) {
    if (
      event.target.closest("#panel") ||
      event.target.closest("#reset") ||
      event.target.closest("#bucket") ||
      event.target.closest("#views")
    ) {
      return;
    }
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hits(), false)[0];
    const group = personFrom(hit?.object) ?? null;
    select(group);
  }

  let down = null;
  window.addEventListener("pointerdown", (event) => {
    down = { x: event.clientX, y: event.clientY };
  });
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("click", (event) => {
    if (
      down &&
      Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5
    ) {
      return;
    }
    onClick(event);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") select(null);
  });

  return { clear: () => select(null), get selected() { return selected; } };
}
