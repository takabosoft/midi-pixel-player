# Midi Pixel Player

MIDIアニメ（MIDIビジュアライゼーション）です。
ドット絵の乗り物たちが動いたら面白いかな？と思って作り始めたのですが、ドット絵が上手に描けないことに気がついて難航中です。

DEMO:
https://takabosoft.github.io/midi-pixel-player/

音符の長さに応じてドット絵を割り当てています。
短いもの→車（ランダム）
少し長いもの→トラック
とても長いもの→電車（ループ）

MIDIファイルのパースや再生：[Tone.js](https://tonejs.github.io/) 　Copyright (C) 2014-2024 Yotam Mann
ドット絵エディタ：EDGE2 Copyright (C) Takabo Soft
サンプル音楽：Space Soldier 1面 Copyright (C) Takabo Soft

### ソースビルド方法

VSCode + node.jp + npmで動作します。

#### 各ライブラリをインストール（一度のみ）

```
npm install
```

#### 開発時

開発時はバンドラーによる監視とローカルWebサーバーを立ち上げます。

```
npx webpack -w
```

```
npx live-server docs
```

SCSSは拡張機能で[Live Sass Compiler](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass)を利用します。

#### リリース時

```
npx webpack --mode=production
```
