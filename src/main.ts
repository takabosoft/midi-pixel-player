/**
 * Development Build: npx webpack -w
 * Development Server: npx live-server docs
 * Release Build: npx webpack --mode=production
 * URL: http://localhost:8080/
 */

import { Midi } from "@tonejs/midi";
import * as Tone from "tone";
import { TinyCanvas } from "./components/tinyCanvas";
import { MidiVisualizer, MidiVisualizerRandom } from "./midiVisualizer";
import { SpriteSheet } from "./spriteSheet";
import { SpriteManager } from "./spriteManager";
import { Header } from "./components/header";

const timeOffset = 1;

async function loadMidi(url: string): Promise<Midi> {
    const arrayBuffer = await (await fetch(url)).arrayBuffer();
    return new Midi(arrayBuffer);
}

function playMidiByTone(midi: Midi, now: number): Tone.PolySynth<Tone.Synth<Tone.SynthOptions>> {
    const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "square" } }).toDestination();
    synth.maxPolyphony = 128;
    synth.volume.value = -8;

    midi.tracks.forEach((track) => {
        track.notes.forEach((note) => {
            synth.triggerAttackRelease(
                note.name,
                note.duration,
                now + note.time + timeOffset,
                note.velocity
            );
        });
    });
    return synth;
}

$(() => new PageController().start());

class PageController {
    private readonly spriteSheet = new SpriteSheet();
    private spriteManager?: SpriteManager;
    private readonly canvas = new TinyCanvas();
    private midi?: Midi;
    private synth?: Tone.PolySynth<Tone.Synth<Tone.SynthOptions>>;
    private visualizer?: MidiVisualizer;
    private random = MidiVisualizerRandom.None;
    private baseSpeed = 150;

    constructor() {
        
    }

    async start() {
        await this.spriteSheet.init();
        this.spriteManager = new SpriteManager(this.spriteSheet);
        this.midi = await loadMidi("beating.mid");
        const header = new Header(file => this.open(file), () => this.play(), () => this.stop(), s => this.setSpeed(s), r => this.setRandom(r));
        this.rebuildVisualizer();
        const main = $("main");
        main.append(this.canvas.element);
        new ResizeObserver(() => this.visualizer?.updateCanvasSize(main)).observe(main[0]);
    }

    private async open(file: File) {
        this.stop();
        this.midi = new Midi(await file.arrayBuffer());
        this.rebuildVisualizer();
    }

    private async play() {
        await Tone.start();
        const now = Tone.now();
        this.synth = playMidiByTone(this.midi!, now);
        this.visualizer?.start(now);
    }

    private stop() {
        this.synth?.dispose();
        this.synth = undefined;
        this.visualizer?.stop();
    }

    private setSpeed(s: number) {
        this.stop();
        this.baseSpeed = s;
        this.rebuildVisualizer();
    }

    private setRandom(newRnd: MidiVisualizerRandom) {
        this.stop();
        this.random = newRnd;
        this.rebuildVisualizer();
    }

    private rebuildVisualizer() {
        this.visualizer = new MidiVisualizer(this.spriteManager!, this.midi!, timeOffset, this.canvas, this.baseSpeed, this.random);
        this.visualizer.render();
    }
}
