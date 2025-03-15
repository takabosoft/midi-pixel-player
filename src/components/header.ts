import { Button } from "./button";
import { Component } from "./component";

export class Header extends Component {
    private readonly openBtn: Button;
    private readonly filenameEl = $(`<div>`).addClass("filename").text("sample.mid");
    private readonly playBtn: Button;
    private readonly stopBtn: Button;

    constructor(
        onOpen: (file: File) => void,
        onPlay: () => void,
        onStop: () => void,
        onSpeed: (num: number) => void,
        onRandom: (num: number) => void,
    ) {
        super();

        this.openBtn = new Button("📂 Open...", () => {
            fileEl.trigger("click");
        });
        this.playBtn = new Button("▶️ Play", onPlay);
        this.stopBtn = new Button("⏹️ Stop", onStop);
        
        const fileEl = $(`<input type="file" class="file" accept=".mid">`);
        fileEl.on("input", () => {
            const files = (fileEl[0] as HTMLInputElement).files;
            if (files != null && files.length > 0) {
                this.filenameEl.text(files[0].name);
                onOpen(files[0]);
            }
        });

        const speedSelect = $(`<select>`).append(
            $(`<option>`).text("100"),
            $(`<option>`).text("125"),
            $(`<option selected>`).text("150"),
            $(`<option>`).text("180"),
        ).on("change", () => onSpeed(parseInt(speedSelect.val() + "")));

        const rndSelect = $(`<select>`).append(
            $(`<option value="0" selected>`).text("Off"),
            $(`<option value="1">`).text("Per Track Small"),
            $(`<option value="2">`).text("Per Track Large"),
            $(`<option value="3">`).text("Per Note Small"),
            $(`<option value="4">`).text("Per Note Large"),
        ).on("change", () => onRandom(parseInt(rndSelect.val() + "")));

        

        this.element = $("header").append(
            this.playBtn.element,
            this.stopBtn.element,
            $(`<hr>`),
            this.openBtn.element,
            fileEl,
            this.filenameEl,
            $(`<hr>`),
            $(`<div>`).text("Speed:"),
            speedSelect,
            $(`<hr>`),
            $(`<div>`).text("Random:"),
            rndSelect,
            $(`<hr>`),
            new Button("GitHub", () => window.open("https://github.com/takabosoft/midi-pixel-player")).element,
            $(`<div>`).addClass("align-right"),
            $(`<div>`).addClass("title").html(`Midi Pixel Player (C) 2025 <a target="_blank" href="https://takabosoft.com">Takabo Soft</a>`)
        )
    }
}