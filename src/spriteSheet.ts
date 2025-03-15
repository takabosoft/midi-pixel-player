import { TinyCanvas } from "./components/tinyCanvas";
import { Rect } from "./geometries/rect";

export class SpriteSheet {
    private _texture?: HTMLImageElement;

    private async loadTexture(): Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>(r => {
            const i = new Image();
            i.onload = () => r(i);
            i.src = "./texture.png";
        });
    }

    async init() {
        this._texture = await this.loadTexture();
        console.log(this._texture);
    }

    crop(rc: Rect): HTMLCanvasElement {
        const newCanvas = new TinyCanvas();
        newCanvas.size = rc.size;
        newCanvas.clear();
        newCanvas.ctx.drawImage(this._texture!, rc.left, rc.top, rc.width, rc.height, 0, 0, rc.width, rc.height);
        return newCanvas.canvas;
    }
}
