import { Midi } from "@tonejs/midi";
import { Ticker } from "./animation/ticker";
import { TinyCanvas } from "./components/tinyCanvas";
import * as Tone from "tone";

class VisualizerNote {
    readonly width: number;

    constructor(
        readonly speed: number, 
        readonly note: number, 
        readonly timeSec: number, 
        readonly durationSec: number
    ) {
        this.width = durationSec * speed;
    }
}

class VisualizerTrack {
    readonly notes: VisualizerNote[] = [];
    constructor() {

    }
}

export class MidiVisualizer {
    private readonly yResolution = 480; // 480line
    private startSec?: number = 0;
    private readonly ticker = new Ticker(() => this.render());
    private minNote = 127;
    private maxNote = 0;
    private readonly tracks: VisualizerTrack[] = [];

    constructor(
        midi: Midi,
        private readonly canvas: TinyCanvas,
    ) {
        
        for (const midiTrack of midi.tracks) {
            if (midiTrack.notes.length == 0) { continue; }

            const trackSpeed = 180 + Math.random() * 60;

            const vTrack = new VisualizerTrack();
            this.tracks.push(vTrack);
            
            for (const note of midiTrack.notes) {
                // 範囲を見ておきます。
                this.minNote = Math.min(this.minNote, note.midi);
                this.maxNote = Math.max(this.maxNote, note.midi);

                vTrack.notes.push(new VisualizerNote(trackSpeed, note.midi, note.time, note.duration));
            }
        }
    }

    start(startSec: number) {
        this.startSec = startSec;
        this.ticker.start();
    }

    render() {
        const startOffset = 0;
        let playSec = 0;
        if (this.startSec != null) {
            playSec = -(Tone.now() - this.startSec);
        }

        const canvas = this.canvas;
        canvas.clear();

        const mat = new DOMMatrix();
        const scale = this.canvas.canvas.height / this.yResolution;
        mat.scaleSelf(scale, scale, 1);
        canvas.ctx.setTransform(mat);

        const midiRange = Math.max(this.maxNote - this.minNote, 1);

        this.tracks.forEach(track => {
            for (const note of track.notes) {
                const x = (note.timeSec + playSec) * note.speed + startOffset;
                canvas.ctx.fillStyle = "red";
                const yr = 1 - ((note.note - this.minNote) / midiRange);
                canvas.ctx.fillRect(x, yr * this.yResolution, note.width, 1);
            }
        });
    }
}