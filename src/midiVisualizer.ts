import { Midi } from "@tonejs/midi";
import { Ticker } from "./animation/ticker";
import { TinyCanvas } from "./components/tinyCanvas";
import * as Tone from "tone";
import { Sprite, SpriteManager } from "./spriteManager";

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
        private readonly canvas: TinyCanvas,
    ) {
        
        for (const midiTrack of midi.tracks) {
            if (midiTrack.notes.length == 0) { continue; }

            const trackSpeed = 150;// + Math.random() * 60;

            for (const note of midiTrack.notes) {
                // 範囲を見ておきます。
                this.minNote = Math.min(this.minNote, note.midi);
                this.maxNote = Math.max(this.maxNote, note.midi);
                this.notes.push(new VisualizerNote(spriteManager, trackSpeed, note.midi, note.time, note.duration));
            }
        }

        this.notes.sort((a, b) => b.note - a.note);
    }

    start(startSec: number) {
        console.log("start");
        this.startSec = startSec;
        this.ticker.start();
    }

    render() {
        
        let playSec = 0;
        if (this.startSec != null) {
            playSec = +(Tone.now() - this.startSec);
        }

        //console.log(playSec)

        const canvas = this.canvas;
        canvas.clear();

        const mat = new DOMMatrix();
        const scale = this.canvas.canvas.height / this.yResolution;
        mat.scaleSelf(scale, scale, 1);
        const ctx = canvas.ctx;
        ctx.setTransform(mat);
        ctx.imageSmoothingEnabled = false;

        const startOffset = this.canvas.canvas.width / scale / 2;
        ctx.fillStyle = "gray";
        ctx.filter = "none";
        ctx.fillRect(startOffset, 0, 1, this.yResolution);

        const midiRange = Math.max(this.maxNote - this.minNote, 1);
        
        for (const note of this.notes) {
            const x = (note.timeSec - playSec) * note.speed + startOffset;
            const yr = 1 - ((note.note - this.minNote) / midiRange);
            const y = yr * (this.yResolution - 16) + 15;

            // これはsafariでは動かない
            //ctx.filter = note.timeSec <= playSec && note.timeSec + note.durationSec > playSec ? "drop-shadow(0 0 3px white)" : "none";
            const isHighlight = note.timeSec <= playSec && note.timeSec + note.durationSec > playSec;
            note.sprite.draw(ctx, x, y, note.width, isHighlight);
        }
    }
}