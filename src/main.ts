import anime from 'animejs';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import 'highlight.js/styles/nord.css';
import './style.css'
import './iosevka-term.css'

hljs.registerLanguage('python', python);
hljs.highlightAll();

const colors = {
    bg: "#191919",
    bg_light: "#202020",
    fg: "#F1F1F1",
    fg_dark: "#E9E9E9",
    primary: "#AFBEE1",
    primary_subdued: "#64708D",
    green: "#527251",
    green_bright: "#BCE1AF",
    red_bright: "#E49393",
    red: "#A46060",
    black: "#373B41",
}

const example_cipher = "GADGDXFDDXDGGAGDADDDDAGXXGGAFXXDAFADFXGDGAAFXFGGGAXFAXGDGGADGADAGDDDGXD";

let em_px = get_em_px();

// Get the size of 1em in px
function get_em_px() {
    const div = document.createElement("div");
    div.style.height = "1em";
    document.body.append(div);
    const res = div.getBoundingClientRect().height;
    div.remove();
    return Math.min(res, 10); // This returning 0 would lead to an infinite loop and can crash the browser.
}

function clear_children(el: Element) {
    Array.from(el.children).forEach(e => e.remove());
}
// As if it wasn't bad enough that the standard array functions have about the worst api ever (array.sort lmao),
// half of the useful one aren't even implemented. JS is a great language.

function range(end: number): number[]
function range(start: number, end: number): number[]
function range(start: number, end: number, step: number): number[]
function range(a: number, b?: number, c?: number): number[] {
    let start: number;
    let end: number;
    if (b === undefined) {
        start = 0;
        end = a;
    } else {
        start = a;
        end = b;
    }
    const step = c ?? 1;

    const res = [];
    for (let i = start; i < end; i += step) {
        res.push(i);
    }
    return res;
}

function chunks<T>(array: T[], size: number): T[][] {
    const res = [];
    for (let c = 0; c < array.length; c += size) {
        res.push(array.slice(c, c + size));
    }
    return res;
}

function repeat<T>(len: number, value: () => T): T[] {
    const res = [];
    for (let i = 0; i < len; i++) {
        res.push(value());
    }
    return res;
}

type VisKey = "transpose" | "permute" | "end";
interface VisValue {
    running: boolean,
    run: (clicked: boolean) => Promise<void>,
    on_screen: boolean,
    element: HTMLElement,
    played: number,
}

type Vis = { [e in VisKey]: VisValue };

const def = (el: string) => ({ running: false, run: async () => { throw new Error("Vis not setup"); }, on_screen: false, element: document.getElementById(el)!, played: 0, });

const vis: Vis = { transpose: def("vis_transpose"), permute: def("vis_permute"), end: def("vis_end") };

function vis_transpose_setup() {
    const line1 = document.querySelector("#vis_transpose .line_1")!;
    const line2 = document.querySelector("#vis_transpose .line_2")!;
    const iter = document.querySelector("#vis_transpose .meta_line .iter")!;
    const info = document.querySelector("#vis_transpose .info")!;

    // Reset last setup
    clear_children(line1);
    clear_children(line2);

    vis.transpose.on_screen = false;
    vis.transpose.running = false;

    // Compute n and such based on window size
    const width = Math.min(document.querySelector("#content")!.getBoundingClientRect().width, 700);
    let len = Math.floor(width / (3 * em_px));
    let n = 4;
    if (len < 8) {
        n = 2;
    }
    len -= len % n;
    const m = len / n;
    iter.innerHTML = `n = ${n}`;
    info.innerHTML = "";

    // Create boxes
    for (let i = 0; i < len; i++) {
        const box = document.createElement("div");
        box.innerText = example_cipher[i];
        box.classList.add("cell");

        line1.append(box);
    }

    for (let i = 0; i < len; i++) {
        const box = document.createElement("div");
        box.innerText = example_cipher[i % m * n + Math.floor(i / m)];
        box.classList.add("cell");

        line2.append(box);
    }

    anime.set("#vis_transpose .line_1 .cell", {
        outlineColor: colors.black,
    });

    anime.set("#vis_transpose .line_2 .cell", {
        outlineColor: colors.black,
    });

    // animation
    vis.transpose.run = async () => {
        vis.transpose.on_screen = true;

        if (vis.transpose.running) {
            return
        }

        vis.transpose.played++;
        vis.transpose.running = true;
        vis.transpose.element.classList.remove("clickable");

        info.innerHTML = "";

        // This function isn't guarenteed to run to its end because animejs sucks
        // So in case it doesn't we still clear running after a while
        setTimeout(() => {
            vis.transpose.element.classList.add("clickable");
            vis.transpose.running = false;
        }, 7000);

        anime.set("#vis_transpose .line_2 .cell", {
            scale: 0,
            marginRight: (_: unknown, i: number) => i % m === m - 1 ? "1em" : "0",
        });

        anime.set("#vis_transpose .line_1 .cell", {
            outlineColor: colors.black,
        });

        let tl1_prg = 0;
        let tl2_prg = 0;

        const tl1 = anime.timeline({
            targets: "#vis_transpose .line_1 .cell",
            easing: "easeOutQuad",
            autoplay: false,
        }).add({
            duration: 300,
            scale: [0, 1],
            marginRight: "0",
            delay: anime.stagger(30, { from: "center" }),
        }, 0).add({
            duration: 300,
            marginRight: (_: HTMLElement, i: number) => {
                if (i % n == n - 1) {
                    return "1em";
                } else {
                    return "0";
                }
            },
            outlineColor: colors.black,
        }, 1000);

        tl1_prg = 2000;

        const tl2 = anime.timeline({
            duration: 400,
            easing: "easeOutQuad",
            autoplay: false,
        });

        tl2.add({ duration: 0 }, tl2_prg = tl1_prg - 900);

        for (let r = 0; r < n; r++) {
            tl1.add({
                outlineColor: (_: unknown, i: number) => {
                    if (i % n === r) {
                        return colors.green_bright
                    } else {
                        return colors.black
                    }
                },
                duration: 400,
                changeBegin: async (a) => {
                    for (let i = 0; i < len; i++) {
                        const e = a.animatables[i].target;
                        e.style.zIndex = i % n === r ? "1" : "0";
                    }
                },
                begin() {
                    iter.innerHTML = `n = ${n} &nbsp; i = ${r}`;
                }
            }, tl1_prg);

            if (r > 0) {
                tl2.add({
                    targets: Array.from(document.querySelectorAll("#vis_transpose .line_2 .cell")).slice((r - 1) * m, r * m),
                    outlineColor: colors.black,
                    easing: "easeOutQuad",
                    duration: 300,
                }, tl2_prg + 1000)
            }
            tl2.add({
                targets: Array.from(document.querySelectorAll("#vis_transpose .line_2 .cell")).slice(r * m, (r + 1) * m),
                delay: anime.stagger(30, { start: 1000 }),
                outlineColor: colors.green_bright,
                scale: [0, 1],
                easing: "easeOutQuad",
                duration: 400,
            }, tl2_prg)

            tl1_prg += 1000;
            tl2_prg += 1000;
        }

        tl1_prg = Math.max(tl1_prg, tl2_prg);

        tl1.add({
            outlineColor: colors.primary,
            easing: "easeOutQuad",
            marginRight: 0,
            duration: 400,
            begin() {
                iter.innerHTML = `n = ${n}`;
                info.innerHTML = "(click to restart)";
            }
        }, tl1_prg)
        tl2.add({
            targets: "#vis_transpose .line_2 .cell",
            outlineColor: colors.primary,
            easing: "easeOutQuad",
            marginRight: 0,
            duration: 400,
        }, tl1_prg)

        tl1.play();
        tl2.play();

        await tl1.finished;
    };
}

function vis_permute_setup() {
    const cells_key_index = document.querySelector("#vis_permute .cells_key_index")!;
    const cells_chunk = document.querySelector("#vis_permute .cells_chunk")!;
    const cells_result = document.querySelector("#vis_permute .cells_result")!;
    const cells_key_index_reverse = document.querySelector("#vis_permute .cells_key_index_reverse")!;
    const cells_reversed = document.querySelector("#vis_permute .cells_reversed")!;
    const restart = document.querySelector("#vis_permute .restart")!;

    const key_index = [4, 2, 5, 7, 6, 0, 1, 3, 8];
    const key_index_reverse = [5, 6, 1, 7, 0, 2, 4, 3, 8];

    restart.innerHTML = " "

    clear_children(cells_key_index);
    clear_children(cells_chunk);
    clear_children(cells_result);
    clear_children(cells_key_index_reverse);
    clear_children(cells_reversed);

    for (const i of key_index) {
        const box = document.createElement("div");
        box.classList.add("cell");
        box.innerHTML = i.toString();
        cells_key_index.append(box);
    }

    for (let i = 0; i < 9; i++) {
        const box = document.createElement("div");
        box.classList.add("cell");
        box.innerHTML = example_cipher[i];
        cells_chunk.append(box);
        cells_reversed.append(box.cloneNode(true));
    }

    for (let i = 0; i < 9; i++) {
        const box = document.createElement("div");
        box.classList.add("cell");
        box.innerHTML = example_cipher[key_index[i]];
        cells_result.append(box);
    }

    for (let i = 0; i < 9; i++) {
        const box = document.createElement("div");
        box.classList.add("cell");
        box.innerHTML = key_index_reverse[i].toString();
        cells_key_index_reverse.append(box);
    }

    vis.permute.on_screen = false;
    vis.permute.running = false;

    vis.permute.run = async () => {
        vis.permute.on_screen = true;

        if (vis.permute.running) {
            return;
        }

        vis.permute.running = true;

        restart.innerHTML = ""

        vis.permute.played++;
        vis.permute.element.classList.remove("clickable");
        setTimeout(() => {
            vis.permute.running = false;
            restart.innerHTML = "(click to restart)";
            vis.permute.element.classList.add("clickable");
        }, 14000);

        anime.set("#vis_permute .cell", {
            outlineColor: colors.black,
            zIndex: -1,
        });
        const reset = {
            duration: 200,
            delay: anime.stagger(30, { from: "center" }),
            outlineColor: colors.green_bright,
            scale: [1, 0],
            easing: "easeOutQuad",
        };

        const re_rs = anime({
            targets: "#vis_permute .cells_result .cell",
            ...reset,
        });
        const rv_rs = anime({
            targets: "#vis_permute .cells_reversed .cell",
            ...reset,
        });
        const kr_rs = anime({
            targets: "#vis_permute .cells_key_index_reverse .cell",
            ...reset,
            outlineColor: colors.black,
        });

        re_rs.play();
        rv_rs.play();
        kr_rs.play();

        await re_rs.finished;

        const tl = {
            duration: 300,
            easing: "easeOutQuad",
            delay: 300,
        };

        const tl_ki = anime.timeline({
            targets: "#vis_permute .cells_key_index .cell",
            ...tl
        });
        const tl_ch = anime.timeline({
            targets: "#vis_permute .cells_chunk .cell",
            ...tl
        });
        const tl_re = anime.timeline({
            targets: "#vis_permute .cells_result .cell",
            ...tl
        });

        for (let i = 0; i < 9; i++) {
            tl_ki.add({
                outlineColor: (_: unknown, j: number) => i === j ? colors.green_bright : colors.black,
                changeBegin(a) {
                    const e = a.animatables[i].target;
                    e.style.zIndex = i.toString();
                }
            });
            tl_ch.add({
                outlineColor: (_: unknown, j: number) => i === key_index_reverse[j] ? colors.green_bright : colors.black,
                changeBegin(a) {
                    const e = a.animatables[key_index[i]].target;
                    e.style.zIndex = i.toString();
                }
            });
        }

        tl_re.add({
            delay: anime.stagger(tl.delay + tl.duration, { start: tl.delay }),
            scale: [0, 1]
        });

        const last = {
            outlineColor: colors.black,
        };
        tl_ki.add(last);
        tl_ch.add(last);
        tl_re.add(last);

        tl_ki.play();
        tl_ch.play();
        tl_re.play();

        await tl_ki.finished;

        const show_key = anime({
            targets: "#vis_permute .cells_key_index_reverse .cell",
            duration: 200,
            delay: anime.stagger(30),
            scale: [0, 1],
            easing: "easeOutQuad",
        })

        show_key.play();
        await show_key.finished;

        const tl_rs = anime.timeline({
            targets: "#vis_permute .cells_result .cell",
            ...tl
        });
        const tl_kr = anime.timeline({
            targets: "#vis_permute .cells_key_index_reverse .cell",
            ...tl
        });
        const tl_rv = anime.timeline({
            targets: "#vis_permute .cells_reversed .cell",
            ...tl
        });

        for (let i = 0; i < 9; i++) {
            tl_kr.add({
                outlineColor: (_: unknown, j: number) => i === j ? colors.green_bright : colors.black,
                changeBegin(a) {
                    const e = a.animatables[i].target;
                    e.style.zIndex = i.toString();
                }
            });
            tl_rs.add({
                outlineColor: (_: unknown, j: number) => i === key_index[j] ? colors.green_bright : colors.black,
                changeBegin(a) {
                    const e = a.animatables[key_index_reverse[i]].target;
                    e.style.zIndex = i.toString();
                }
            });
        }

        tl_rv.add({
            delay: anime.stagger(tl.delay + tl.duration, { start: tl.delay }),
            scale: [0, 1]
        });

        tl_kr.add(last);
        tl_rv.add(last);
        tl_rs.add(last);

        tl_rv.add({
            delay: anime.stagger(30, { start: tl.delay }),
            outlineColor: colors.primary,
        });

        tl_rs.play();
        tl_kr.play();
        tl_rv.play();

        await tl_kr.finished;

        anime({
            targets: "#vis_permute .cells_chunk .cell",
            autoplay: true,
            delay: anime.stagger(30, { start: tl.delay }),
            outlineColor: colors.primary,
            duration: tl.duration,
        });

        anime({
            targets: "#vis_permute .cells_result .cell",
            autoplay: true,
            delay: anime.stagger(30, { start: tl.delay }),
            outlineColor: colors.red_bright,
            duration: tl.duration,
        });


        anime.set("#vis_permute .cells_chunk .cell", {
            zIndex: (_: unknown, i: number) => -i
        });
        anime.set("#vis_permute .cells_reversed .cell", {
            zIndex: (_: unknown, i: number) => -i
        });

        await tl_rv.finished;
    };
}

function vis_end_setup() {
    const line1 = document.querySelector("#vis_end #l1")!;
    const line2 = document.querySelector("#vis_end #l2")!;
    const line3 = document.querySelector("#vis_end #l3")!;
    const line4 = document.querySelector("#vis_end #l4")!;
    const line5 = document.querySelector("#vis_end #l5")!;
    const line7 = document.querySelector("#vis_end #l7")!;
    const line8 = document.querySelector("#vis_end #l8")!;

    const letters_value = { "A": 0, "D": 1, "F": 2, "G": 3, "X": 4 };
    const key = "nobracket";
    const n = 9;
    const submap = "NXJCZIFOAPVQBLKYEGRDMSHTU";
    const encrypted = "DFXAGXAXAXXXGGFDFX";
    const m = Math.floor(encrypted.length / n);
    const key_index = range(key.length).sort((a, b) => key[a].charCodeAt(0) - key[b].charCodeAt(0));
    const key_index_reverse = range(key.length).sort((a, b) => key_index[a] - key_index[b]);
    const transposed = encrypted.split("").reduce((prev, cur, i) => {
        prev[i % m].push(cur);
        return prev;
    }, repeat(m, () => [] as string[])).flat();
    const permuted = chunks(transposed, n).map(c => key_index_reverse.map(i => c[i])).flat();
    const values = permuted.map(x => letters_value[x as keyof typeof letters_value]);
    const indices = chunks(values, 2).map(([row, col]) => row * 5 + col);
    indices.pop(); // padding
    const clear = indices.map(x => submap[x]);

    clear_children(line1);
    clear_children(line2);
    clear_children(line3);
    clear_children(line4);
    clear_children(line5);
    clear_children(line7);

    line8.innerHTML = "";

    const cell = document.createElement("div");
    cell.classList.add("cell");
    const new_cell = (inner: string) => {
        const box = cell.cloneNode() as HTMLElement
        box.innerHTML = inner;
        return box;
    };

    for (let i = 0; i < encrypted.length; i++) {
        line1.append(new_cell(encrypted[i]));
        line2.append(new_cell(transposed[i]));
        line3.append(new_cell(key_index_reverse[i % 9].toString()));
        line4.append(new_cell(permuted[i]));
        line5.append(new_cell(permuted[i]));
    }

    for (const c of clear) {
        line7.append(new_cell(c));
    }

    vis.end.on_screen = false;
    vis.end.running = false;

    vis.end.run = async (clicked) => {
        if (vis.end.running) {
            return;
        }

        if(!clicked && vis.end.played > 0) {
            return;
        }

        vis.end.played++;
        vis.end.on_screen = true;
        vis.end.running = true;

        vis.end.element.classList.remove("clickable");
        setTimeout(() => {
            vis.end.running = false;
            vis.end.element.classList.add("clickable");
        }, 16000)

        const dy1 = line5.getBoundingClientRect().y - line4.getBoundingClientRect().y;
        const cx = line1.children.item(0)!.getBoundingClientRect().width;
        const cy = line1.children.item(0)!.getBoundingClientRect().height;

        document.querySelectorAll("#vis_end #l5 .cell").forEach(e => {
            (e as HTMLElement).style.transform = "";
        });

        anime.set("#vis_end #l1 .cell", { zIndex: -1, outlineColor: colors.black, marginRight: 0 });
        anime.set("#vis_end #l2 .cell", { scale: 0, outlineColor: colors.green_bright });
        anime.set("#vis_end #l2 .cell:nth-child(9n):not(:last-child)", { marginRight: "1em" });
        anime.set("#vis_end #l3 .cell", { scale: 0 });
        anime.set("#vis_end #l3 .cell:nth-child(9n):not(:last-child)", { marginRight: "1em" });
        anime.set("#vis_end #l4 .cell", { scale: 0, outlineColor: colors.green_bright });
        anime.set("#vis_end #l4 .cell:nth-child(9n):not(:last-child)", { marginRight: "1em" });
        anime.set("#vis_end #l5 .cell", { opacity: 0, translateY: -dy1, translateX: 0, rotate: 0, maxWidth: "2em" });
        anime.set("#vis_end #l5 .cell:not(:first-child)", { marginLeft: 2 });
        anime.set("#vis_end #l6", { scale: 0 });
        anime.set("#vis_end #l7 .cell", { opacity: 0, translateY: "-3em" });
        anime.set("#vis_end #l8", { color: colors.bg });

        document.querySelectorAll("#vis_end #l5 .cell").forEach((e, i) => {
            e.innerHTML = permuted[i].toString();
        });

        const tl = {
            delay: 300,
            duration: 300,
            easing: "easeOutQuad",
        };


        const tl1 = anime.timeline({
            ...tl,
            targets: "#vis_end #l1 .cell",
        }).add({
            duration: 200,
            scale: [0, 1],
            delay: anime.stagger(20, { from: "center", start: 200 }),
        }).add({
            marginRight: (_: unknown, i: number) => i % m == (m - 1) && i != encrypted.length - 1 ? "1em" : "0",
            delay: 200,
        });

        tl1.play();

        await tl1.finished;

        const tl2 = anime.timeline({
            ...tl,
            targets: "#vis_end #l1 .cell",
        });
        const tl3 = anime.timeline({
            ...tl,
            targets: "#vis_end #l2 .cell",
        });

        for (let j = 0; j < m; j++) {
            tl2.add({
                outlineColor: (_: unknown, i: number) => i % m == j ? colors.green_bright : colors.black,
                changeBegin(a) {
                    for (let i = j; i < encrypted.length; i += m) {
                        a.animatables[i].target.style.zIndex = j.toString();
                    }
                }
            });
            if (j > 0) {
                tl3.add({
                    targets: `#vis_end #l2 .cell:nth-child(-n + ${j * n})`,
                    outlineColor: colors.black,
                });
            }
            tl3.add({
                targets: `#vis_end #l2 .cell:nth-child(-n + ${j * n + n})`,
                scale: 1,
            }, j > 0 ? "-= 600" : "+= 0");
        }

        tl2.add({
            outlineColor: colors.black,
            duration: 200,
        });
        tl3.add({
            outlineColor: colors.black,
            duration: 200,
        })

        tl2.play();
        tl3.play();

        await tl2.finished;

        await anime({
            ...tl,
            targets: "#vis_end #l3 .cell",
            scale: 1,
            delay: anime.stagger(30, { from: "center", start: 200 })
        }).finished;

        anime.set("#vis_end #l2 .cell, #vis_end #l3 .cell", { zIndex: -1 });

        tl.duration = 200;
        tl.delay = 100;

        const tl4 = anime.timeline({
            ...tl,
            targets: "#vis_end #l2 .cell",
        });
        const tl5 = anime.timeline({
            ...tl,
            targets: "#vis_end #l3 .cell",
        });
        const tl6 = anime.timeline({
            ...tl,
            targets: "#vis_end #l4 .cell",
        });

        for (let i = 0; i < 9; i++) {
            tl4.add({
                outlineColor: (_: unknown, j: number) => i === key_index[j % 9] ? colors.green_bright : colors.black,
                changeBegin(a) {
                    for (let j = key_index_reverse[i]; j < transposed.length; j += 9) {
                        const e = a.animatables[j].target;
                        e.style.zIndex = i.toString();
                    }
                }
            });
            tl5.add({
                outlineColor: (_: unknown, j: number) => i === j % 9 ? colors.green_bright : colors.black,
                changeBegin(a) {
                    for (let j = i; j < transposed.length; j += 9) {
                        const e = a.animatables[j].target;
                        e.style.zIndex = i.toString();
                    }
                }
            });
        }

        for (let i = 0; i < m; i++) {
            tl6.add({
                targets: `#vis_end #l4 .cell:nth-child(n + ${i * n + 1}):nth-child(-n + ${i * n + n})`,
                scale: 1,
                delay: anime.stagger(tl.delay + tl.duration, { start: tl.delay }),
            }, 0);
        }

        tl4.add({
            outlineColor: colors.black,
        });
        tl5.add({
            outlineColor: colors.black,
        });
        tl6.add({
            outlineColor: colors.black,
        }).add({
            marginRight: 0
        });

        tl4.play();
        tl5.play();
        tl6.play();

        await tl6.finished;

        tl.delay = 300;
        tl.duration = 300;

        const tl7 = anime.timeline({
            ...tl,
        });

        tl7.add({
            delay: 0,
            targets: "#vis_end #l5 .cell",
            opacity: 1,
            duration: 100,
            easing: "linear"
        }).add({
            targets: "#vis_end #l5 .cell:nth-child(odd)",
            translateY: 0,
            easing: "easeOutQuad",
        }).add({
            targets: "#vis_end #l5 .cell:nth-child(even)",
            translateY: cy + 2,
            easing: "easeOutQuad",
        }).add({
            targets: "#vis_end #l5 .cell:nth-child(even)",
            translateX: -cx - 2,
            easing: "easeOutQuad",
        });

        tl7.play();

        await tl7.finished;

        const tl8 = anime.timeline({
            ...tl,
            targets: "#vis_end #l5 .cell",
        }).add({
            delay: 200,
            duration: 500,
            rotate: 360,
            easing: "easeOutQuad"
        }).add({
            targets: "#vis_end #l5 .cell:nth-child(even)",
            translateY: 0,
            opacity: 0,
        }).add({
            targets: "#vis_end #l5 .cell:nth-child(even)",
            maxWidth: 0,
            marginLeft: 0,
        });

        tl8.play();

        setTimeout(() => {
            document.querySelectorAll("#vis_end #l5 .cell").forEach((e, i) => {
                e.innerHTML = values[i].toString();
            });
        }, 300);

        setTimeout(() => {
            document.querySelectorAll("#vis_end #l5 .cell:nth-child(odd)").forEach((e, i) => {
                e.innerHTML = (values[i * 2] * 5 + values[i * 2 + 1]).toString();
            });
        }, 1000);

        await tl8.finished;

        await anime({
            ...tl,
            targets: "#vis_end #l5 .cell:nth-child(17)",
            scale: 0,
            maxWidth: 0,
            marginLeft: 0,
        }).finished;

        tl.duration = 400;
        tl.delay = 300;

        await anime({
            ...tl,
            targets: "#vis_end #l6",
            scale: 1,
        }).finished;

        anime({
            ...tl,
            duration: 1000,
            targets: "#vis_end #l5 .cell:nth-child(-n + 16)",
            keyframes: [
                { translateY: "3em" },
                { scale: 0 },
                { translateY: 0, delay: 2000 },
                { scale: 1, delay: anime.stagger(30, { from: "center" }) }
            ],
        });

        await anime({
            ...tl,
            targets: "#vis_end #l7 .cell",
            duration: 1000,
            keyframes: [
                { opacity: 1, delay: 500 },
                { translateY: 0 }
            ],
        }).finished;

        line8.innerHTML = "for reading !"

        anime({
            ...tl,
            targets: "#vis_end #l7 .cell",
            outlineColor: colors.bg,
            duration: 1000,
            delay: 400,
        });

        await anime({
            ...tl,
            targets: "#vis_end #l8",
            color: colors.fg,
            duration: 1000,
            delay: 400,
        }).finished;

        vis.end.running = false;
    }
}

vis_transpose_setup();
vis_permute_setup();
vis_end_setup();

let last_width = window.innerWidth;
let last_ratio = window.devicePixelRatio;

function for_vis(fn: (v: VisValue, key: VisKey) => void) {
    for (const k in vis) {
        fn(vis[k as VisKey], k as VisKey);
    }
}

window.addEventListener("resize", () => {
    if (Math.abs(last_width - window.innerWidth) > 100) {
        vis_transpose_setup();
        last_width = window.innerWidth;
    }
    if (last_ratio !== window.devicePixelRatio) {
        em_px = get_em_px();
        vis_transpose_setup();
        last_ratio = window.devicePixelRatio;
    }
});

function set_in_view(v: VisValue) {
    const rect = v.element.getBoundingClientRect();
    if (rect.y < 0.5 * window.innerHeight && rect.y > 0.1 * window.innerHeight) {
        if (v.on_screen === false) {
            v.run(false);
        }
    }

    if (rect.y > window.innerHeight || rect.y + rect.height < 0) {
        v.on_screen = false;
    }
}

document.addEventListener("scroll", () => {
    for_vis(v => set_in_view(v))
})

for_vis(v => v.element.addEventListener("click", () => v.run(true)))
