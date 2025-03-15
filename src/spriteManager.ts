import { TinyCanvas } from "./components/tinyCanvas";
import { Rect } from "./geometries/rect";
import { Vec2 } from "./geometries/vec2";
import { SpriteSheet } from "./spriteSheet";

export abstract class Sprite {
    abstract draw(ctx: CanvasRenderingContext2D, x: number, yBase: number, width: number, isHighlight: boolean): void;
}

function makeHighlightTexture(texture: HTMLCanvasElement): HTMLCanvasElement {
    const destCanvas = new TinyCanvas();
    const srcSize = new Vec2(texture.width, texture.height);
    const destSize = new Vec2(texture.width + 2, texture.height + 2);
    destCanvas.size = destSize;
    const srcImgData = texture.getContext("2d")!.getImageData(0, 0, texture.width, texture.height);
    const destImgData = destCanvas.ctx.getImageData(0, 0, destCanvas.canvas.width, destCanvas.canvas.height);

    const setPixel = (dx: number, dy: number) => {
        const i = (dy * destImgData.width + dx) * 4;
        destImgData.data[i + 1] = 255;
        destImgData.data[i + 3] = 255;
    };

    for (let y = 0; y < srcSize.y; y++) {
        for (let x = 0; x < srcSize.x; x++) {
            const i = (y * srcSize.x + x) * 4;
            if (srcImgData.data[i + 3] > 0) {
                setPixel(x + 1 - 1, y + 1);
                setPixel(x + 1 + 1, y + 1);
                setPixel(x + 1, y + 1 - 1);
                setPixel(x + 1, y + 1 + 1);
            }
        }
    }

    destCanvas.ctx.putImageData(destImgData, 0, 0);
    destCanvas.ctx.drawImage(texture, 1, 1);

    return destCanvas.canvas;
}

class OneSprite extends Sprite {
    private texture: HTMLCanvasElement;
    private highlightTexture: HTMLCanvasElement;

    constructor(spriteSheet: SpriteSheet, readonly rc: Rect) {
        super();
        this.texture = spriteSheet.crop(rc);
        this.highlightTexture = makeHighlightTexture(this.texture);
    }

    override draw(ctx: CanvasRenderingContext2D, x: number, yBase: number, width: number, isHighlight: boolean): void {
        if (isHighlight) {
            ctx.drawImage(this.highlightTexture, x - 1, yBase - this.rc.height - 1);
        } else {
            ctx.drawImage(this.texture, x, yBase - this.rc.height);
        }
    }
}

class LoopedSprite extends Sprite {
    private texture: HTMLCanvasElement;
    private highlightTexture: HTMLCanvasElement;

    constructor(spriteSheet: SpriteSheet, readonly rc: Rect) {
        super();
        this.texture = spriteSheet.crop(rc);
        this.highlightTexture = makeHighlightTexture(this.texture);
    }

    override draw(ctx: CanvasRenderingContext2D, x: number, yBase: number, width: number, isHighlight: boolean): void {
        const loop = Math.max(Math.floor(width / (this.rc.width + 1)), 1);
        if (isHighlight) {
            for (let i = 0; i < loop; i++) {
                ctx.drawImage(this.highlightTexture, x + i * (this.rc.width + 1) - 1, yBase - this.rc.height - 1);
            }
        } else {
            for (let i = 0; i < loop; i++) {
                ctx.drawImage(this.texture, x + i * (this.rc.width + 1), yBase - this.rc.height);
            }
        }
    }
}

interface SpriteInfo {
    readonly targetWidth: number;
    readonly sprites: readonly Sprite[];
}

export class SpriteManager {
    private readonly oneSpriteInfos: SpriteInfo[] = [];
    private readonly loopedSprites: LoopedSprite[] = [];

    constructor(spriteSheet: SpriteSheet) {
        this.oneSpriteInfos.push(
            {
                targetWidth: 20,
                sprites: [
                    new OneSprite(spriteSheet, new Rect(2, 28, 21, 10)),
                    new OneSprite(spriteSheet, new Rect(26, 26, 20, 12)),
                    new OneSprite(spriteSheet, new Rect(49, 26, 22, 12)),
                ]
            },
            {
                targetWidth: 74,
                sprites: [
                    new OneSprite(spriteSheet, new Rect(74, 14, 47, 24)),
                ]
            }
        );

        this.loopedSprites.push(
            new LoopedSprite(spriteSheet, new Rect(124, 15, 78, 23)),
        );
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