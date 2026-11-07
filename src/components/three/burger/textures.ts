import { CanvasTexture, SRGBColorSpace } from "three";
import { rng } from "./noise";

let tomato: CanvasTexture | null = null;
let swiss: CanvasTexture | null = null;

/** Cross-section of a beefsteak tomato: skin, flesh walls, gel pockets with seeds. */
export function tomatoTexture() {
  if (tomato) return tomato;
  const S = 512, c = S / 2;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const g = cv.getContext("2d")!;
  const rand = rng(5);

  g.fillStyle = "#a8120a";
  g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill();
  const flesh = g.createRadialGradient(c, c, 10, c, c, c * 0.95);
  flesh.addColorStop(0, "#f06a4a");
  flesh.addColorStop(0.6, "#e03a22");
  flesh.addColorStop(1, "#c7200f");
  g.fillStyle = flesh;
  g.beginPath(); g.arc(c, c, c * 0.95, 0, Math.PI * 2); g.fill();

  const pockets = 5;
  for (let i = 0; i < pockets; i++) {
    const a = (i / pockets) * Math.PI * 2 + 0.3;
    const px = c + Math.cos(a) * c * 0.48, py = c + Math.sin(a) * c * 0.48;
    g.save();
    g.translate(px, py);
    g.rotate(a);
    const gel = g.createRadialGradient(0, 0, 4, 0, 0, c * 0.3);
    gel.addColorStop(0, "#ff9a5c");
    gel.addColorStop(1, "#e5502e");
    g.fillStyle = gel;
    g.beginPath(); g.ellipse(0, 0, c * 0.3, c * 0.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#f7d27a";
    for (let s = 0; s < 9; s++) {
      g.beginPath();
      g.ellipse((rand() - 0.5) * c * 0.38, (rand() - 0.5) * c * 0.22, 7, 4.5, rand() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
  g.fillStyle = "#f59b7e";
  g.beginPath(); g.arc(c, c, c * 0.14, 0, Math.PI * 2); g.fill();

  tomato = new CanvasTexture(cv);
  tomato.colorSpace = SRGBColorSpace;
  tomato.anisotropy = 4;
  return tomato;
}

/** Alpha mask with the eyes of a Swiss slice. */
export function swissHoles() {
  if (swiss) return swiss;
  const S = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, S, S);
  g.fillStyle = "#000";
  const rand = rng(12);
  for (let i = 0; i < 16; i++) {
    g.beginPath();
    g.arc(18 + rand() * (S - 36), 18 + rand() * (S - 36), 5 + rand() * 11, 0, Math.PI * 2);
    g.fill();
  }
  swiss = new CanvasTexture(cv);
  return swiss;
}
