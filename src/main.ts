/**
 * Development Build: npx webpack -w
 * Development Server: npx live-server docs
 * Release Build: npx webpack --mode=production
 * URL: http://localhost:8080/
 */

import { Midi } from "@tonejs/midi";
import * as Tone from "tone";
import { TinyCanvas } from "./components/tinyCanvas";
import { Vec2 } from "./geometries/vec2";
import { MidiVisualizer } from "./midiVisualizer";
import { SpriteSheet } from "./spriteSheet";
import { SpriteManager } from "./spriteManager";

async function loadMidi(url: string): Promise<Midi> {
    const arrayBuffer = await (await fetch(url)).arrayBuffer();
    return new Midi(arrayBuffer);
}

async function playMidiByTone(midi: Midi, now: number) {
    // Tone.jsの準備
    await Tone.start();
    const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "square" } }).toDestination();
    synth.maxPolyphony = 128;
    synth.volume.value = -8;

    midi.tracks.forEach((track) => {
        track.notes.forEach((note) => {
            synth.triggerAttackRelease(
                note.name,  // ノート名 (例: C4, D#5)
                note.duration, // 持続時間
                now + note.time, // 再生開始時間
                note.velocity // 音量
            );
        });
    });
}

$(async () => {
    const spriteSheet = new SpriteSheet();
    await spriteSheet.init();
    const spriteManager = new SpriteManager(spriteSheet);
    
    const midi = await loadMidi("beating.mid");
    $("header").append($(`<button>`).text("START").on("click", async () => {
        console.log("start");
        const now = Tone.now();
        playMidiByTone(midi, now);
        visualizer.start(now);
    }));

    const canvas = new TinyCanvas();
    const visualizer = new MidiVisualizer(spriteManager, midi, canvas);
    const main = $("main");
    main.append(canvas.element);
    new ResizeObserver(() => {
        console.log(main.outerWidth(), main.outerHeight());
        canvas.size = new Vec2(main.outerWidth()!, main.outerHeight()!);
        visualizer.render();
    }).observe(main[0]);

});

