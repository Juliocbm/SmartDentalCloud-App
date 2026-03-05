import { Component, ElementRef, input, output, signal, viewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signature-pad.html',
  styleUrl: './signature-pad.scss'
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  width = input(500);
  height = input(200);

  signatureChanged = output<string | null>();

  canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  isDrawing = signal(false);
  hasSignature = signal(false);

  private ctx: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.ctx.strokeStyle = '#1a1a2e';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(canvas.parentElement!);
    this.resizeCanvas();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || !this.ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(rect.width);
    const h = this.height();

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    this.ctx.scale(dpr, dpr);
    this.ctx.strokeStyle = '#1a1a2e';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (this.hasSignature()) {
      this.hasSignature.set(false);
      this.signatureChanged.emit(null);
    }
  }

  onPointerDown(e: PointerEvent): void {
    if (!this.ctx) return;
    const pos = this.getPosition(e);
    this.isDrawing.set(true);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDrawing() || !this.ctx) return;
    const pos = this.getPosition(e);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  onPointerUp(): void {
    if (!this.isDrawing()) return;
    this.isDrawing.set(false);
    this.hasSignature.set(true);
    this.signatureChanged.emit(this.toBase64());
  }

  clear(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || !this.ctx) return;

    const dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    this.hasSignature.set(false);
    this.signatureChanged.emit(null);
  }

  toBase64(): string {
    const canvas = this.canvasRef()?.nativeElement;
    return canvas ? canvas.toDataURL('image/png') : '';
  }

  private getPosition(e: PointerEvent): { x: number; y: number } {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}
