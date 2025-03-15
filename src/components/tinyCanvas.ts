import { Vec2 } from "../geometries/vec2";
import { Component } from "./component";

export class TinyCanvas extends Component {
    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D;
    
    constructor() {
        super();
        this.element = $("<canvas>");
        this.canvas = this.element[0] as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d")!;
    }

    set size(s: Vec2) {
        this.canvas.width = s.x;
        this.canvas.height = s.y;
    }

    clear() {
        const oldMat = this.ctx.getTransform();
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.setTransform(oldMat);
    }
}