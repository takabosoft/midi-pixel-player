import { Vec2 } from "./vec2";

export class Rect {
    constructor(readonly x: number, readonly y: number, readonly width: number, readonly height: number) { }

    get left() { return this.x; }
    get top() { return this.y; }
    get right() { return this.x + this.width; }
    get bottom() { return this.y + this.height; }
    get center() { return new Vec2((this.left + this.right) / 2, (this.top + this.bottom) / 2); }
    get size() { return new Vec2(this.width, this.height); }
    get isEmpty() { return this.width <= 0 || this.height <= 0; }

    /** 空の矩形インスタンスです。 */
    static readonly zero = new Rect(0, 0, 0, 0);
}