import { Midi } from "@tonejs/midi";
import { Ticker } from "./animation/ticker";
import { TinyCanvas } from "./components/tinyCanvas";
import * as Tone from "tone";
import { Sprite, SpriteManager } from "./spriteManager";

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
    PerTrackLarge,
    PerNoteSmall,
    PerNoteLarge,
}

export class MidiVisualizer {
    private readonly yResolution = 400;
    private startSec?: number;
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
        for (const midiTrack of midi.tracks) {
            if (midiTrack.notes.length == 0) { continue; }

            const trackSpeed = (() => {
                switch (random) {
                    default:
                        return baseSpeed;
                    case MidiVisualizerRandom.PerTrackSmall:
                        return baseSpeed + Math.random() * rndRange(-10, 10);
                    case MidiVisualizerRandom.PerTrackLarge:
                        return baseSpeed + Math.random() * rndRange(-20, 20);
                }
            })();

            for (const note of midiTrack.notes) {
                // 範囲を見ておきます。
                this.minNote = Math.min(this.minNote, note.midi);
                this.maxNote = Math.max(this.maxNote, note.midi);

                const noteSpeed = (() => {
                    switch (random) {
                        default:
                            return trackSpeed;
                        case MidiVisualizerRandom.PerNoteSmall:
                            return baseSpeed + Math.random() * rndRange(-10, 10);
                        case MidiVisualizerRandom.PerNoteLarge:
                            return baseSpeed + Math.random() * rndRange(-20, 20);
                    }
                })();
                this.notes.push(new VisualizerNote(spriteManager, noteSpeed, note.midi, note.time + timeOffset, note.duration));
            }
        }

        this.notes.sort((a, b) => b.note - a.note);
    }

    start(startSec: number) {
        this.startSec = startSec;
        this.ticker.start();
    }

    stop() {
        this.startSec = undefined;
        this.ticker.stop();
        this.render();
    }

    render() {
        let playSec = 0;
        if (this.startSec != null) {
            playSec = +(Tone.now() - this.startSec);
            
            // レイテンシー分調整
            playSec -= (Tone.getContext().rawContext as any).baseLatency;
        }

        const canvas = this.canvas;
        canvas.clear();

        const mat = new DOMMatrix();
        const scale = this.canvas.canvas.height / this.yResolution;
        mat.scaleSelf(scale, scale, 1);
        const ctx = canvas.ctx;
        ctx.setTransform(mat);
        ctx.imageSmoothingEnabled = false;

        const xResolution = this.canvas.canvas.width / scale;
        const startOffset = xResolution / 4;
        const col = Math.sin(playSec * 3) * 50 + 100;
        ctx.fillStyle = `rgb(${col}, ${col}, ${col})`;
        ctx.filter = "none";
        ctx.fillRect(startOffset, 0, 1, this.yResolution);

        const midiRange = Math.max(this.maxNote - this.minNote, 1);
        
        for (const note of this.notes) {
            const x = (note.timeSec - playSec) * note.speed + startOffset;
            if (x + note.sprite.calcRenderWidth(note.width) < 0 || x > xResolution) {
                continue;
            }
            const yr = 1 - ((note.note - this.minNote) / midiRange);
            const y = yr * (this.yResolution - 16) + 15;
            const isHighlight = note.timeSec <= playSec && note.timeSec + note.durationSec > playSec;
            
            note.sprite.draw(ctx, x, y, note.width, isHighlight);
        }
    }
}