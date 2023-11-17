import anime from 'animejs';
import './style.css'
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import 'highlight.js/styles/nord.css';
import Color from 'colorjs.io';

hljs.registerLanguage('python', python);
hljs.highlightAll();

/// @ts-ignore
anime.suspendWhenDocumentHidden = false;

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

function delay(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

function request_frames(callback: Function, n: number = 1) {
    if (n > 0) {
        requestAnimationFrame(() => request_frames(callback, n - 1));
    } else {
        callback();
    }
}

function delay_frames(n: number = 1): Promise<void> {
    return new Promise(res => request_frames(res, n))
}

function color_to_string(color: Color) {
    const [r, g, b] = color.srgb.map(c => Math.floor(255 * c));
    return `rgb(${r}, ${g}, ${b})`;
}

function clear_children(el: Element) {
    Array.from(el.children).forEach(e => e.remove());
}

type VisKey = "transpose" | "permute";

type Vis = {[e in VisKey]: {
    running: boolean,
    run: () => Promise<void>,
    on_screen: boolean,
    element: HTMLElement,
}};

const def = (el: string) => ({running: false, run: async () => { throw new Error("Vis not setup"); }, on_screen: false, element: document.getElementById(el)! });

const vis: Vis = { transpose: def("vis_transpose"), permute: def("vis_permute") };

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

        if(vis.transpose.running) {
            return
        }

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

    const key_index = [4, 2, 5, 7, 6, 0, 1, 3, 8];
    const key_index_reverse = [5, 6, 1, 7, 0, 2, 4, 3, 8];

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

        if(vis.permute.running) {
            return;
        }

        vis.permute.running = true;

        setTimeout(() => vis.permute.running = false, 14000);

        anime.set("#vis_permute .cell", {
            outlineColor: colors.black,
            zIndex: -1,
        });
        const reset = {
            duration: 200,
            delay: anime.stagger(30, {from: "center"}),
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
        
        for(let i = 0; i < 9; i++) {
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

        for(let i = 0; i < 9; i++) {
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
            zIndex: (_:unknown, i: number) => -i
        });
        anime.set("#vis_permute .cells_reversed .cell", {
            zIndex: (_:unknown, i: number) => -i
        });

        await tl_rv.finished;

        vis.permute.running = false;
    };
}

vis_transpose_setup();
vis_permute_setup();

let last_width = window.innerWidth;
let last_ratio = window.devicePixelRatio;

window.addEventListener("resize", () => {
    if(Math.abs(last_width - window.innerWidth) > 100) {
        vis_transpose_setup();
        last_width = window.innerWidth;
    }
    if(last_ratio !== window.devicePixelRatio) {
        em_px = get_em_px();
        vis_transpose_setup();
        last_ratio = window.devicePixelRatio;
    }
});

function set_in_view(k: VisKey) {
    const rect = vis[k].element.getBoundingClientRect();
    if(rect.y < 0.5 * window.innerHeight && rect.y > 0.1 * window.innerHeight) {
        if(vis[k].on_screen === false) {
            vis[k].run();
        }
    }

    if(rect.y > window.innerHeight || rect.y + rect.height < 0) {
        vis[k].on_screen = false;
    }
}

document.addEventListener("scroll", () => {
    set_in_view("transpose");
    set_in_view("permute");
})
vis.transpose.element.addEventListener("click", () => {
    vis.transpose.run();
});
vis.permute.element.addEventListener("click", () => {
    vis.permute.run();
});
