import { Midi } from "@tonejs/midi";
import { Ticker } from "./animation/ticker";
import { TinyCanvas } from "./components/tinyCanvas";
import * as Tone from "tone";
import { Rect } from "./geometries/rect";

abstract class Sprite {
    abstract draw(ctx: CanvasRenderingContext2D, texture: HTMLImageElement, x: number, yBase: number, width: number): void;
}

class OneSprite extends Sprite {
    constructor(readonly rc: Rect) {
        super();
    }

    override draw(ctx: CanvasRenderingContext2D, texture: HTMLImageElement, x: number, yBase: number, width: number): void {
        ctx.drawImage(texture, this.rc.x, this.rc.y, this.rc.width, this.rc.height, x, yBase - this.rc.height, this.rc.width, this.rc.height);
    }
}

class LoopedSprite extends Sprite {
    constructor(readonly rc: Rect) {
        super();
    }

    override draw(ctx: CanvasRenderingContext2D, texture: HTMLImageElement, x: number, yBase: number, width: number): void {
        const loop = Math.max(Math.floor(width / (this.rc.width + 1)), 1);
        for (let i = 0; i < loop; i++) {
            ctx.drawImage(texture, this.rc.x, this.rc.y, this.rc.width, this.rc.height, x + i * (this.rc.width + 1), yBase - this.rc.height, this.rc.width, this.rc.height);
        }
    }
}

interface SpriteInfo {
    readonly targetWidth: number;
    readonly sprites: readonly Sprite[];
}

class SpriteManager {
    private readonly oneSpriteInfos: SpriteInfo[] = [
        { 
            targetWidth: 20,
            sprites: [
                new OneSprite(new Rect(2, 28, 21, 10)),
                new OneSprite(new Rect(26, 26, 20, 12)),
                new OneSprite(new Rect(49, 26, 22, 12)),
            ]
        },
        {
            targetWidth: 74,
            sprites: [
                new OneSprite(new Rect(74, 14, 47, 24)),
            ]
        }
    ];
    private readonly loopedSprites: LoopedSprite[] = [
        new LoopedSprite(new Rect(124, 15, 78, 23)),
    ];

    constructor() {

    }

    select(width: number): Sprite {
        if (width < 70) {
            let minSp: SpriteInfo | undefined = undefined;
            let minDiff: number = 0;
            for (const spInfo of this.oneSpriteInfos) {
                const diff = Math.abs(spInfo.targetWidth - width);
                if (minSp == null || minDiff > diff) {
                    minDiff = diff;
                    minSp = spInfo;
                }
            }

            return minSp!.sprites[Math.floor(Math.random() * minSp!.sprites.length)];
        } else {
            return this.loopedSprites[0];
        }
    }
}

const spriteManager = new SpriteManager();

class VisualizerNote {
    readonly width: number;
    readonly sprite: Sprite;

    constructor(
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
        private readonly texture: HTMLImageElement,
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
                this.notes.push(new VisualizerNote(trackSpeed, note.midi, note.time, note.duration));
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
            note.sprite.draw(ctx, this.texture, x, y, note.width);
        }
    }
}