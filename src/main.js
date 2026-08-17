import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { palette, SIZE } from "./palette.js";
import { createCube } from "./cube.js";
import { people } from "./people.js";
import { createPerson, applySpriteScale, updateCrowdScales } from "./sprites.js";
import { createPicker } from "./pick.js";
import { bindPanelClose } from "./panel.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const viewport = document.getElementById("viewport");

const scene = new THREE.Scene();
scene.background = new THREE.Color(palette.night);
scene.fog = new THREE.Fog(palette.night, 13, 36);

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  80,
);
const home = new THREE.Vector3(7.4, 4.6, 9.2);
camera.position.copy(home);
camera.up.set(0, 1, 0);

const FACE = 17.5;
const pairViews = [
  { pos: new THREE.Vector3(0, 0, FACE), up: new THREE.Vector3(0, 1, 0) },
  { pos: new THREE.Vector3(0, -FACE, 0), up: new THREE.Vector3(0, 0, 1) },
  { pos: new THREE.Vector3(-FACE, 0, 0), up: new THREE.Vector3(0, 1, 0) },
];
let viewIndex = -1;
let camTween = null;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
viewport.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.inset = "0";
labelRenderer.domElement.style.pointerEvents = "none";
viewport.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 0, 0);
controls.minDistance = 6;
controls.maxDistance = 28;
controls.autoRotate = !reduced;
controls.autoRotateSpeed = 0.55;
controls.update();

controls.addEventListener("start", () => {
  controls.autoRotate = false;
});

scene.add(new THREE.AmbientLight(0xb7c9d6, 0.7));
const key = new THREE.DirectionalLight(0x9ec6e0, 1.1);
key.position.set(4, 8, 6);
scene.add(key);
const fill = new THREE.PointLight(palette.rye, 4, 24);
fill.position.set(-3, 2, 4);
scene.add(fill);

const cube = createCube();
scene.add(cube);

const peopleGroup = new THREE.Group();
scene.add(peopleGroup);

const picker = createPicker({
  camera,
  peopleGroup,
  tooltip: document.getElementById("tooltip"),
});

bindPanelClose(() => picker.clear());

function markView(index) {
  viewIndex = index;
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.view) === index);
  });
}

function goToPose(pos, up, { rotateAfter = false } = {}) {
  controls.autoRotate = false;
  controls.target.set(0, 0, 0);
  if (reduced) {
    camera.position.copy(pos);
    camera.up.copy(up);
    camera.lookAt(0, 0, 0);
    controls.update();
    if (rotateAfter) controls.autoRotate = true;
    return;
  }
  const fromPos = camera.position.clone();
  const fromUp = camera.up.clone();
  camTween = { t: 0, fromPos, fromUp, pos, up, rotateAfter };
}

function applyPairView(index) {
  const view = pairViews[(index + pairViews.length) % pairViews.length];
  markView((index + pairViews.length) % pairViews.length);
  goToPose(view.pos, view.up);
}

document.getElementById("reset").addEventListener("click", () => {
  markView(-1);
  goToPose(home, new THREE.Vector3(0, 1, 0), { rotateAfter: !reduced });
});

document.querySelectorAll(".view-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyPairView(Number(btn.dataset.view));
  });
});

window.addEventListener("keydown", (event) => {
  if (event.target.closest("input, textarea")) return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  const dir = event.key === "ArrowRight" ? 1 : -1;
  const next = viewIndex < 0 ? (dir > 0 ? 0 : 2) : viewIndex + dir;
  applyPairView(next);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  for (const mat of cube.userData.axisMaterials ?? []) {
    mat.resolution.set(window.innerWidth, window.innerHeight);
  }
});

function tick() {
  if (camTween) {
    camTween.t = Math.min(1, camTween.t + 0.07);
    const k = 1 - (1 - camTween.t) ** 3;
    camera.position.lerpVectors(camTween.fromPos, camTween.pos, k);
    camera.up.lerpVectors(camTween.fromUp, camTween.up, k).normalize();
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    if (camTween.t >= 1) {
      if (camTween.rotateAfter) controls.autoRotate = true;
      camTween = null;
    }
  }
  tickPeople();
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();

const floorY = -SIZE / 2;

function setAppear(group, a) {
  group.traverse((obj) => {
    const mat = obj.material;
    if (!mat || !mat.transparent || mat.opacity === undefined) return;
    if (obj === group.userData.hit) return;
    if (mat.userData.baseOpacity === undefined) {
      mat.userData.baseOpacity = mat.opacity > 0 ? mat.opacity : 1;
    }
    if (obj === group.userData.ring) return;
    mat.opacity = mat.userData.baseOpacity * a;
  });
  group.userData.appear = a;
  applySpriteScale(group);
}

function startEnter(group) {
  if (reduced) return;
  group.userData.homeY = group.position.y;
  group.userData.motion = { mode: "in", t: 0 };
  group.position.y = floorY;
  setAppear(group, 0);
}

function tickPeople() {
  for (const group of [...peopleGroup.children]) {
    const motion = group.userData.motion;
    if (!motion) continue;
    motion.t = Math.min(1, motion.t + 0.042);
    const k = 1 - (1 - motion.t) ** 3;
    group.position.y = floorY + (group.userData.homeY - floorY) * k;
    setAppear(group, k);
    if (motion.t >= 1) group.userData.motion = null;
  }
  updateCrowdScales(peopleGroup.children);
}

for (const person of people) {
  const group = await createPerson(person);
  startEnter(group);
  peopleGroup.add(group);
}
