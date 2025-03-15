/**
 * Development Build: npx webpack -w
 * Development Server: npx live-server docs
 * Release Build: npx webpack --mode=production
 * URL: http://localhost:8080/
 */

import { Midi } from "@tonejs/midi";
import * as Tone from "tone";

async function loadMidi(url: string): Promise<Midi> {
    const arrayBuffer = await (await fetch(url)).arrayBuffer();
    return new Midi(arrayBuffer);
}

async function playMidiByTone(midi: Midi) {
    // Tone.jsの準備
    await Tone.start();
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.maxPolyphony = 128;
    synth.volume.value = -8;

    // 現在の時間を取得
    const now = Tone.now();

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
    console.log("OK");

    $("body").append($(`<button>`).text("START").on("click", async () => {
        playMidiByTone(await loadMidi("beating.mid"));
    }));
});