import { Midi } from "@tonejs/midi";
import { Ticker } from "./animation/ticker";
import { TinyCanvas } from "./components/tinyCanvas";
import * as Tone from "tone";
import { Sprite, SpriteManager } from "./spriteManager";
import { Vec2 } from "./geometries/vec2";

export function rndRange(v1: number, v2: number): number {
    const a = Math.random();
    return v1 * (1 - a) + v2 * a;
}

class VisualizerNote {
    readonly width: number;
    readonly sprite: Sprite;

    constructor(
        spriteManager: SpriteManager,
        readonly speed: number, 
        readonly note: number, 
        readonly timeSec: number, 
        readonly durationSec: number
    ) {
        this.width = durationSec * speed;
        this.sprite = spriteManager.select(this.width);
    }
}

export const enum MidiVisualizerRandom {
    None = 0,
    PerTrackSmall,
    PerTrackMedium,
    PerTrackLarge,
    PerNoteSmall,
    PerNoteMedium,
    PerNoteLarge,
}

export class MidiVisualizer {
    private yResolutionTarget = 300;
    private yResolution = 400;
    private _startSec?: number;
    private readonly ticker = new Ticker(() => this.render());
    private minNote = 127;
    private maxNote = 0;
    private readonly notes: VisualizerNote[] = [];

    constructor(
        spriteManager: SpriteManager,
        midi: Midi,
        timeOffset: number,
        private readonly canvas: TinyCanvas,
        baseSpeed: number,
        random: MidiVisualizerRandom,
    ) {
        this.yResolution = canvas.canvas.height;
        
        for (const midiTrack of midi.tracks) {
            if (midiTrack.notes.length == 0) { continue; }

            const trackSpeed = (() => {
                switch (random) {
                    default:
                        return baseSpeed;
                    case MidiVisualizerRandom.PerTrackSmall:
                        return baseSpeed + Math.random() * rndRange(-baseSpeed * 0.1, baseSpeed * 0.1);
                    case MidiVisualizerRandom.PerTrackMedium:
                        return baseSpeed + Math.random() * rndRange(-baseSpeed * 0.2, baseSpeed * 0.2);
                    case MidiVisualizerRandom.PerTrackLarge:
                        return baseSpeed + Math.random() * rndRange(-baseSpeed * 0.4, baseSpeed * 0.4);
                }
            })();

            for (const note of midiTrack.notes) {
                if (note.duration <= 0) { continue; }

                // 範囲を見ておきます。
                this.minNote = Math.min(this.minNote, note.midi);
                this.maxNote = Math.max(this.maxNote, note.midi);

                const noteSpeed = (() => {
                    switch (random) {
                        default:
                            return trackSpeed;
                        case MidiVisualizerRandom.PerNoteSmall:
                            return baseSpeed + Math.random() * rndRange(-baseSpeed * 0.1, baseSpeed * 0.1);
                        case MidiVisualizerRandom.PerNoteMedium:
                            return baseSpeed + Math.random() * rndRange(-baseSpeed * 0.2, baseSpeed * 0.2);
                        case MidiVisualizerRandom.PerNoteLarge:
                            return baseSpeed + Math.random() * rndRange(-baseSpeed * 0.4, baseSpeed * 0.4);
                    }
                })();
                this.notes.push(new VisualizerNote(spriteManager, noteSpeed, note.midi, note.time + timeOffset, note.duration));
            }
        }

        this.notes.sort((a, b) => b.note - a.note);
    }

    get startSec() { return this._startSec; }

    start(startSec: number) {
        this._startSec = startSec;
        this.ticker.start();
    }

    stop() {
        this._startSec = undefined;
        this.ticker.stop();
        this.render();
    }

    updateCanvasSize(parent: JQuery) {
        const rect = parent[0].getBoundingClientRect();
        const line = rect.height * window.devicePixelRatio;
        const scale = Math.max(Math.floor(line / this.yResolutionTarget), 1);
        console.log(`height: ${line}px, scale: ${scale}`);

        this.yResolution = Math.floor(line / scale);
        const xResolution = Math.floor(rect.width / (rect.height / this.yResolution));
        this.canvas.size = new Vec2(xResolution, this.yResolution);
        this.render();
    }

    render() {
        let playSec = 0;
        if (this._startSec != null) {
            playSec = +(Tone.now() - this._startSec);
            
            // レイテンシー分調整
            playSec -= (Tone.getContext().rawContext as any).baseLatency;
        }

        const canvas = this.canvas;
        canvas.clear();

        const ctx = canvas.ctx;
        ctx.imageSmoothingEnabled = false;

        const xResolution = this.canvas.canvas.width;
        const startOffset = Math.floor(xResolution / 4);
        const col = Math.sin(playSec * 3) * 50 + 100;
        ctx.fillStyle = `rgb(${col}, ${col}, ${col})`;
        ctx.filter = "none";
        ctx.fillRect(startOffset, 0, 1, this.yResolution);

        const midiRange = Math.max(this.maxNote - this.minNote, 1);
        
        for (const note of this.notes) {
            const x = Math.round((note.timeSec - playSec) * note.speed + startOffset);
            const renderWidth = note.sprite.calcRenderWidth(note.width);
            if (x + renderWidth < 0 || x > xResolution) {
                continue;
            }
            const yr = 1 - ((note.note - this.minNote) / midiRange);
            const y = yr * (this.yResolution - 16) + 15;
            const isHighlight = x <= startOffset && x + renderWidth > startOffset;
            
            note.sprite.draw(ctx, x, y, note.width, isHighlight);
        }
    }
}