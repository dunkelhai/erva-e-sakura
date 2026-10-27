import Phaser from 'phaser';

/**
 * Wrapper de Graphics que desenha em unidades lógicas multiplicadas por `s`.
 * Permite gerar texturas em alta resolução (ex.: 1.5×) e exibi-las com setScale(1/s)
 * sob uma câmera com zoom 1.5, mantendo o traço nítido.
 */
export class Pen {
  constructor(
    readonly g: Phaser.GameObjects.Graphics,
    readonly s: number,
  ) {}

  fill(color: number, alpha = 1): this {
    this.g.fillStyle(color, alpha);
    return this;
  }

  line(width: number, color: number, alpha = 1): this {
    this.g.lineStyle(width * this.s, color, alpha);
    return this;
  }

  rect(x: number, y: number, w: number, h: number): this {
    const s = this.s;
    this.g.fillRect(x * s, y * s, w * s, h * s);
    return this;
  }

  rrect(x: number, y: number, w: number, h: number, r: number, stroke = false): this {
    const s = this.s;
    const rr = Math.min(r, w / 2, h / 2) * s;
    this.g.fillRoundedRect(x * s, y * s, w * s, h * s, rr);
    if (stroke) this.g.strokeRoundedRect(x * s, y * s, w * s, h * s, rr);
    return this;
  }

  srrect(x: number, y: number, w: number, h: number, r: number): this {
    const s = this.s;
    this.g.strokeRoundedRect(x * s, y * s, w * s, h * s, Math.min(r, w / 2, h / 2) * s);
    return this;
  }

  circle(x: number, y: number, r: number, stroke = false): this {
    const s = this.s;
    this.g.fillCircle(x * s, y * s, r * s);
    if (stroke) this.g.strokeCircle(x * s, y * s, r * s);
    return this;
  }

  ellipse(x: number, y: number, w: number, h: number, stroke = false): this {
    const s = this.s;
    this.g.fillEllipse(x * s, y * s, w * s, h * s, 28);
    if (stroke) this.g.strokeEllipse(x * s, y * s, w * s, h * s, 28);
    return this;
  }

  poly(points: number[], stroke = false): this {
    const s = this.s;
    const pts: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < points.length; i += 2) pts.push({ x: points[i] * s, y: points[i + 1] * s });
    this.g.fillPoints(pts, true);
    if (stroke) this.g.strokePoints(pts, true);
    return this;
  }

  tri(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): this {
    const s = this.s;
    this.g.fillTriangle(x1 * s, y1 * s, x2 * s, y2 * s, x3 * s, y3 * s);
    return this;
  }

  seg(x1: number, y1: number, x2: number, y2: number): this {
    const s = this.s;
    this.g.lineBetween(x1 * s, y1 * s, x2 * s, y2 * s);
    return this;
  }

  arc(x: number, y: number, r: number, a0: number, a1: number): this {
    const s = this.s;
    this.g.beginPath();
    this.g.arc(x * s, y * s, r * s, a0, a1, false);
    this.g.strokePath();
    return this;
  }

  /** Gera a textura (w,h lógicos) e limpa o Graphics para o próximo desenho. */
  bake(key: string, w: number, h: number): void {
    this.g.generateTexture(key, Math.ceil(w * this.s), Math.ceil(h * this.s));
    this.g.clear();
  }
}
