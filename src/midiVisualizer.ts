import { Midi } from "@tonejs/midi";
import { Ticker } from "./animation/ticker";
import { TinyCanvas } from "./components/tinyCanvas";
import * as Tone from "tone";

export class MidiVisualizer {
    private readonly yResolution = 480; // 480line
    private startSec?: number = 0;
    private readonly ticker = new Ticker(() => this.render());
    private minMidi = 127;
    private maxMidi = 0;
    private trackSpeeds: number[] = [];

    constructor(
        private readonly midi: Midi,
        private readonly canvas: TinyCanvas,
    ) {
        // 範囲を見ておきます。
        for (const track of this.midi.tracks) {
            this.trackSpeeds.push(180 + Math.random() * 60);

            for (const note of track.notes) {
                this.minMidi = Math.min(this.minMidi, note.midi);
                this.maxMidi = Math.max(this.maxMidi, note.midi);
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

        

        const midiRange = Math.max(this.maxMidi - this.minMidi, 1);

        this.midi.tracks.forEach((track, trIndex) => {

            const speed = this.trackSpeeds[trIndex];
            const secToX = (sec: number) => sec * speed;
        
            for (const note of track.notes) {
        
                const x = secToX(note.time + playSec) + startOffset;
                const dur = secToX(note.duration);
                canvas.ctx.fillStyle = "red";

                const yr = 1 - ((note.midi - this.minMidi) / midiRange);

                canvas.ctx.fillRect(x, yr * this.yResolution, dur, 1);
                
            }
        });
    }
}