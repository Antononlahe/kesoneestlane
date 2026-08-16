import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { palette, SIZE, toWorld } from "./palette.js";

function makeLabel(text, className = "", color) {
  const el = document.createElement("div");
  el.className = `label2d ${className}`.trim();
  el.textContent = text;
  if (color) el.style.color = color;
  const obj = new CSS2DObject(el);
  obj.center.set(0.5, 0.5);
  return obj;
}

function fatAxis(from, to, color) {
  const geom = new LineGeometry();
  geom.setPositions([...from, ...to]);
  const mat = new LineMaterial({
    color,
    linewidth: 6,
    transparent: true,
    opacity: 0.98,
    depthTest: true,
    worldUnits: false,
  });
  mat.resolution.set(window.innerWidth, window.innerHeight);
  const axis = new Line2(geom, mat);
  axis.computeLineDistances();
  return axis;
}

export function createCube() {
  const group = new THREE.Group();
  const h = SIZE / 2;

  const box = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
  const edges = new THREE.EdgesGeometry(box);
  const frame = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({
      color: palette.ice,
      transparent: true,
      opacity: 0.28,
    }),
  );
  group.add(frame);

  const fill = new THREE.Mesh(
    box,
    new THREE.MeshBasicMaterial({
      color: palette.baltic,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  group.add(fill);

  const step = 0.25;
  const gridPositions = [];
  for (let i = 0; i <= 1; i += step) {
    const w = toWorld(i);
    gridPositions.push(-h, -h, w, h, -h, w);
    gridPositions.push(w, -h, -h, w, -h, h);
    gridPositions.push(-h, w, -h, h, w, -h);
    gridPositions.push(-h, -h, w, -h, h, w);
    gridPositions.push(w, -h, -h, w, h, -h);
    gridPositions.push(-h, w, -h, -h, w, h);
  }
  const gridGeom = new THREE.BufferGeometry();
  gridGeom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(gridPositions, 3),
  );
  group.add(
    new THREE.LineSegments(
      gridGeom,
      new THREE.LineBasicMaterial({
        color: palette.bone,
        transparent: true,
        opacity: 0.07,
      }),
    ),
  );

  const o = [-h, -h, -h];
  const axes = [
    {
      from: o,
      to: [h, -h, -h],
      color: palette.ice,
      css: "#7eb6d9",
      name: "SPF 50",
      label: [h + 0.45, -h - 0.4, -h],
    },
    {
      from: o,
      to: [-h, h, -h],
      color: palette.rye,
      css: "#c4a35a",
      name: "ei ütle tere tänaval",
      label: [-h - 0.35, h + 0.55, -h],
    },
    {
      from: o,
      to: [-h, -h, h],
      color: palette.pine,
      css: "#7aa38f",
      name: "käib saunas",
      label: [-h, -h, h + 0.55],
    },
  ];

  const axisMaterials = [];

  for (const axis of axes) {
    const fat = fatAxis(axis.from, axis.to, axis.color);
    axisMaterials.push(fat.material);
    group.add(fat);
    const name = makeLabel(axis.name, "axis", axis.css);
    name.position.set(...axis.label);
    group.add(name);
  }

  const originBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 16, 16),
    new THREE.MeshBasicMaterial({ color: palette.bone }),
  );
  originBall.position.set(-h, -h, -h);
  group.add(originBall);

  group.userData.axisMaterials = axisMaterials;
  return group;
}
