import * as THREE from "three";
import { palette, SIZE, toWorld, lerpHex } from "./palette.js";

function mixRgb(t) {
  const c = lerpHex(palette.bone, palette.ice, t);
  return {
    r: (c >> 16) & 255,
    g: (c >> 8) & 255,
    b: c & 255,
    hex: c,
  };
}

export function drawStickFigure(score) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const { r, g, b } = mixRgb(score);
  const stroke = `rgb(${r},${g},${b})`;

  ctx.clearRect(0, 0, 256, 256);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke;
  ctx.fillStyle = stroke;
  ctx.shadowColor = stroke;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 8;

  ctx.beginPath();
  ctx.arc(128, 58, 26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(128, 86);
  ctx.lineTo(128, 160);
  ctx.moveTo(128, 108);
  ctx.lineTo(78, 138);
  ctx.moveTo(128, 108);
  ctx.lineTo(178, 138);
  ctx.moveTo(128, 160);
  ctx.lineTo(88, 214);
  ctx.moveTo(128, 160);
  ctx.lineTo(168, 214);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function paintPortrait(img, ringHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const { r, g, b } = {
    r: (ringHex >> 16) & 255,
    g: (ringHex >> 8) & 255,
    b: ringHex & 255,
  };
  const ring = `rgb(${r},${g},${b})`;

  ctx.clearRect(0, 0, 256, 256);
  ctx.save();
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) * 0.2;
  ctx.drawImage(img, sx, sy, side, side, 8, 8, 240, 240);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.strokeStyle = ring;
  ctx.lineWidth = 8;
  ctx.shadowColor = ring;
  ctx.shadowBlur = 10;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(url));
    img.src = url;
  });
}

export async function createPerson(person) {
  const group = new THREE.Group();
  const score =
    (person.valimus + person.temperament + person.kultuur + person.juured) / 4;
  const color = mixRgb(score);

  let map = drawStickFigure(score);
  if (person.portrait) {
    try {
      const img = await loadImage(person.portrait);
      map = paintPortrait(img, color.hex);
    } catch {
      map = drawStickFigure(score);
    }
  }

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map,
      transparent: true,
      depthWrite: false,
    }),
  );
  const baseScale = person.portrait ? 0.95 : 1.02;
  sprite.scale.set(baseScale, baseScale, 1);
  sprite.center.set(0.5, person.portrait ? 0.5 : 0.12);
  sprite.userData.person = person;
  group.add(sprite);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 12, 12),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  hit.userData.person = person;
  group.add(hit);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.5, 32),
    new THREE.MeshBasicMaterial({
      color: palette.ice,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.48;
  ring.visible = false;
  group.add(ring);

  const stemY = -person.temperament * SIZE;
  const stem = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, stemY, 0),
    ]),
    new THREE.LineBasicMaterial({
      color: color.hex,
      transparent: true,
      opacity: 0.28,
    }),
  );
  group.add(stem);

  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshBasicMaterial({ color: color.hex }),
  );
  dot.position.y = stemY;
  group.add(dot);

  group.position.set(
    toWorld(person.valimus),
    toWorld(person.temperament),
    toWorld(person.kultuur),
  );
  group.userData = { person, sprite, hit, ring, baseScale };
  return group;
}

export function disposePerson(group) {
  group.traverse((obj) => {
    obj.geometry?.dispose?.();
    if (!obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      m.map?.dispose?.();
      m.dispose?.();
    }
  });
}

export function setPersonState(group, { hovered, selected }) {
  const { sprite, ring, baseScale } = group.userData;
  const scale = selected ? baseScale * 1.22 : hovered ? baseScale * 1.12 : baseScale;
  sprite.scale.set(scale, scale, 1);
  ring.visible = selected;
  ring.material.opacity = selected ? 0.9 : 0;
}
