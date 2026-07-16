// ---------------------------------------------------------------------------
// status_ui.cpp  —  320x240 computer-status widget for LVGL (v8 / v9 style)
//
// Pure hard-coded pixel layout. All decorative graphics (notched frames,
// dot-matrix progress bars, 4-point stars + comet tails, Wi-Fi glyph, battery)
// are self-drawn onto a single full-screen lv_canvas. Text is rendered with
// lv_label objects layered on top.
//
// Coordinates are 1:1 with the Figma reference (frame origin = top-left 0,0).
//
// v8 vs v9 note:
//   - Color format enum:  v9 = LV_COLOR_FORMAT_NATIVE
//                         v8 = LV_IMG_CF_TRUE_COLOR
//   - lv_canvas_set_px():  v9 = lv_canvas_set_px(obj, x, y, color, opa)
//                          v8 = lv_canvas_set_px_color(obj, x, y, color)
//   The LV_VERSION guards below pick the right one.
// ---------------------------------------------------------------------------

#include "lvgl.h"
#include <cstdio>

// --- Fonts ------------------------------------------------------------------
// Chinese glyphs require a CJK font built from "Alibaba PuHuiTi 2.0".
// Declare them here; generate with lv_font_conv and link in.
LV_FONT_DECLARE(font_puhuiti_12);   // section titles / values
LV_FONT_DECLARE(font_puhuiti_10);   // labels / status bar
LV_FONT_DECLARE(font_puhuiti_4);    // tiny hardware spec strings
#define FONT_12  (&font_puhuiti_12)
#define FONT_10  (&font_puhuiti_10)
#define FONT_4   (&font_puhuiti_4)

// --- Palette ----------------------------------------------------------------
#define COL_BG        lv_color_hex(0x080808)
#define COL_WHITE     lv_color_hex(0xFFFFFF)
#define COL_STAR      lv_color_hex(0xBEBEBE)
#define COL_BAR       lv_color_hex(0xD9D9D9)  // solid "filled" bar
#define COL_DOT_HI    lv_color_hex(0xD9D9D9)  // dotted track, bright dots
#define COL_DOT_LO    lv_color_hex(0x43454F)  // dotted track, dim dots
#define COL_PRESSED   lv_color_hex(0x4E4E4E)  // [切换] pressed text
#define COL_DIM       lv_color_hex(0xB3B3B3)  // ~white/70 for specs & arrow

// --- Canvas backing buffer --------------------------------------------------
#define SCR_W  320
#define SCR_H  240
static lv_color_t canvas_buf[SCR_W * SCR_H];
static lv_obj_t  *g_canvas;

// Dynamic labels we refresh from the animation timer.
static lv_obj_t *lbl_cpu_pct, *lbl_gpu_pct, *lbl_mem_pct, *lbl_vram_pct;

// Cross-version single-pixel plot.
static inline void px(lv_coord_t x, lv_coord_t y, lv_color_t c)
{
    if (x < 0 || y < 0 || x >= SCR_W || y >= SCR_H) return;
#if LV_VERSION_CHECK(9, 0, 0)
    lv_canvas_set_px(g_canvas, x, y, c, LV_OPA_COVER);
#else
    lv_canvas_set_px_color(g_canvas, x, y, c);
#endif
}

// ---------------------------------------------------------------------------
// Primitive drawing helpers (all plot directly into the canvas)
// ---------------------------------------------------------------------------

static void hline(int x0, int x1, int y, lv_color_t c)
{
    if (x0 > x1) { int t = x0; x0 = x1; x1 = t; }
    for (int x = x0; x <= x1; ++x) px(x, y, c);
}
static void vline(int x, int y0, int y1, lv_color_t c)
{
    if (y0 > y1) { int t = y0; y0 = y1; y1 = t; }
    for (int y = y0; y <= y1; ++y) px(x, y, c);
}

// Rectangle outline with a top-edge gap ("notch") for the field label.
// gap_x0..gap_x1 is the un-drawn span on the TOP edge (screen coords).
static void notched_frame(int x, int y, int w, int h, int gap_x0, int gap_x1)
{
    const int x1 = x + w - 1;
    const int y1 = y + h - 1;
    // top edge, split around the notch
    hline(x, gap_x0 - 1, y, COL_WHITE);
    hline(gap_x1 + 1, x1, y, COL_WHITE);
    // bottom + sides
    hline(x, x1, y1, COL_WHITE);
    vline(x,  y, y1, COL_WHITE);
    vline(x1, y, y1, COL_WHITE);
}

// Plain rounded-ish rectangle outline (corners left square; 320x240 LCD).
static void frame(int x, int y, int w, int h, lv_color_t c)
{
    const int x1 = x + w - 1;
    const int y1 = y + h - 1;
    hline(x, x1, y,  c);
    hline(x, x1, y1, c);
    vline(x,  y, y1, c);
    vline(x1, y, y1, c);
}

// Dot-matrix progress bar (spec: dotted empty track + solid vertical bars).
//   track: 2px-pitch checkerboard of hi/lo dots.
//   fill:  vertical bars, 4px on / 2px off, up to `pct` percent of the width.
static void draw_dot_bar(int x, int y, int w, int h, int pct)
{
    if (pct < 0)   pct = 0;
    if (pct > 100) pct = 100;
    const int fill_w = (w * pct) / 100;

    for (int iy = 0; iy < h; ++iy) {
        for (int ix = 0; ix < w; ++ix) {
            const int sx = x + ix;
            const int sy = y + iy;
            if (ix < fill_w) {
                // solid vertical bars: 4 on / 2 off
                if ((ix % 6) < 4) px(sx, sy, COL_BAR);
            } else {
                // dotted track: bright dots on even rows, dim on odd rows
                if ((ix & 1) == 0)
                    px(sx, sy, (iy & 1) ? COL_DOT_LO : COL_DOT_HI);
            }
        }
    }
}

// 4-point star (sparkle). Radius r horizontally/vertically, thin diagonals.
static void draw_star(int cx, int cy, int r, lv_color_t c)
{
    for (int i = -r; i <= r; ++i) {
        int taper = (r - (i < 0 ? -i : i)) / 2;   // pinch toward tips
        // vertical spine + horizontal spine, thickness follows taper
        for (int t = -taper; t <= taper; ++t) {
            px(cx + i, cy + t, c);   // horizontal arm
            px(cx + t, cy + i, c);   // vertical arm
        }
    }
}

// Wi-Fi glyph: three stacked arcs opening downward (approx of Figma paths).
static void draw_wifi(int cx, int bottom_y)
{
    px(cx, bottom_y, COL_WHITE);                       // node dot
    const int radii[3] = {3, 6, 9};
    for (int k = 0; k < 3; ++k) {
        int r = radii[k];
        for (int a = 200; a <= 340; a += 4) {          // upper arc only
            float rad = a * 3.14159265f / 180.0f;
            int ax = cx + (int)(r * __builtin_cosf(rad));
            int ay = (bottom_y - 1) + (int)(r * __builtin_sinf(rad));
            px(ax, ay, COL_WHITE);
        }
    }
}

// ---------------------------------------------------------------------------
// Comet-tail dot cluster trailing the two model-section stars (Group2/Group3).
// Frame-absolute coordinates; xoff shifts the second tail by +29px.
// ---------------------------------------------------------------------------
struct TailDot { float x, y; bool dark; };
static const TailDot TAIL_DOTS[] = {
    {51.85f,147.73f,false},{61.13f,143.99f,false},{70.40f,140.24f,false},
    {61.88f,145.84f,true },{71.15f,142.10f,true },{62.63f,147.70f,false},
    {71.90f,143.95f,false},{50.00f,148.48f,false},{59.27f,144.73f,false},
    {68.55f,140.99f,false},{60.02f,146.59f,true },{69.30f,142.85f,true },
    {60.77f,148.44f,false},{70.04f,144.70f,false},{53.71f,146.98f,false},
    {62.98f,143.24f,false},{72.26f,139.50f,false},{63.73f,145.09f,true },
    {73.01f,141.35f,true },{64.48f,146.95f,false},{73.75f,143.21f,false},
    {55.56f,146.23f,false},{64.84f,142.49f,false},{74.11f,138.75f,false},
    {56.31f,148.09f,true },{65.59f,144.34f,true },{74.86f,140.60f,true },
    {66.33f,146.20f,false},{75.61f,142.46f,false},{57.42f,145.48f,false},
    {66.69f,141.74f,false},{58.17f,147.34f,true },{67.44f,143.60f,true },
    {68.19f,145.45f,false},{75.97f,138.00f,false},{76.71f,139.85f,true },
    {77.46f,141.71f,false},
};

static void draw_star_tail(int xoff)
{
    for (const auto &d : TAIL_DOTS)
        px((int)(d.x + xoff + 0.5f), (int)(d.y + 0.5f),
           d.dark ? COL_DOT_LO : COL_DOT_HI);
}

// ---------------------------------------------------------------------------
// Static background: everything that doesn't change every frame.
// ---------------------------------------------------------------------------
static void draw_static(void)
{
    lv_canvas_fill_bg(g_canvas, COL_BG, LV_OPA_COVER);

    // --- status bar chrome ---
    draw_wifi(246, 12);                       // Wi-Fi @ ~left240,top4
    frame(260, 4, 23, 10, COL_WHITE);         // battery shell
    for (int i = 0; i < 4; ++i)               // 4 charge segments (full)
        for (int sx = 0; sx < 4; ++sx)
            vline(262 + i * 5 + sx, 6, 11, COL_BAR);

    // --- title-row stars ---
    draw_star(118, 20, 3, COL_STAR);          // small @115,17 (6px)
    draw_star(275, 24, 3, COL_STAR);          // small @272,21 (6px)
    draw_star(283, 19, 5, COL_STAR);          // @278,14 (10px)

    // --- outer group boxes ---
    frame(7,  39, 304, 83, COL_WHITE);        // hardware box
    frame(7, 149, 304, 82, COL_WHITE);        // model box

    // --- notched field frames (gap sized to each label) ---
    notched_frame(15,  50, 134, 24,  26,  46);  // CPU
    notched_frame(15,  90, 134, 24,  26,  46);  // GPU
    notched_frame(200, 50, 103, 24, 211, 231);  // 内存
    notched_frame(200, 90, 103, 24, 211, 251);  // 显存占用
    notched_frame(15, 162, 137, 28,  26,  50);  // 大模型
    notched_frame(160,162, 143, 28, 171, 199);  // 子模型
    notched_frame(15, 199, 288, 28,  26,  62);  // token余额

    // --- model-section stars + comet tails (星星为尾线) ---
    draw_star_tail(0);
    draw_star_tail(29);
    draw_star(79,  140, 7, COL_STAR);         // @72,133 (14px)
    draw_star(108, 140, 7, COL_STAR);         // @101,133 (14px)
}

// ---------------------------------------------------------------------------
// Per-frame redraw: repaint the four progress bars + refresh their labels.
// ---------------------------------------------------------------------------
static void redraw_bars(int cpu, int gpu, int mem, int vram)
{
    char b[8];
    draw_dot_bar(23,  58, 118, 12, cpu);   lv_snprintf(b, sizeof b, "%d%%", cpu);  lv_label_set_text(lbl_cpu_pct,  b);
    draw_dot_bar(23,  98, 118, 12, gpu);   lv_snprintf(b, sizeof b, "%d%%", gpu);  lv_label_set_text(lbl_gpu_pct,  b);
    draw_dot_bar(208, 58,  52, 12, mem);   lv_snprintf(b, sizeof b, "%d%%", mem);  lv_label_set_text(lbl_mem_pct,  b);
    draw_dot_bar(208, 98,  52, 12, vram);  lv_snprintf(b, sizeof b, "%d%%", vram); lv_label_set_text(lbl_vram_pct, b);
}

// Continuous 1..100 loop, phased so the four bars differ.
static void anim_timer_cb(lv_timer_t *)
{
    static uint32_t tick = 0;
    tick = (tick + 1) % 100;
    auto phase = [](uint32_t base, uint32_t off) -> int {
        return 1 + (int)((base + off) % 100);
    };
    redraw_bars(phase(tick, 0), phase(tick, 25), phase(tick, 50), phase(tick, 75));
}

// ---------------------------------------------------------------------------
// Label helper
// ---------------------------------------------------------------------------
static lv_obj_t *mk_label(lv_obj_t *par, int x, int y, const char *txt,
                          const lv_font_t *font, lv_color_t color)
{
    lv_obj_t *l = lv_label_create(par);
    lv_label_set_text(l, txt);
    lv_obj_set_style_text_font(l, font, 0);
    lv_obj_set_style_text_color(l, color, 0);
    lv_obj_set_pos(l, x, y);
    return l;
}

// [切换] button — text turns #4E4E4E while pressed.
static void switch_event_cb(lv_event_t *e)
{
    lv_obj_t *lbl = (lv_obj_t *)lv_event_get_user_data(e);
    lv_event_code_t code = lv_event_get_code(e);
    if (code == LV_EVENT_PRESSED)
        lv_obj_set_style_text_color(lbl, COL_PRESSED, 0);
    else if (code == LV_EVENT_RELEASED || code == LV_EVENT_PRESS_LOST)
        lv_obj_set_style_text_color(lbl, COL_WHITE, 0);
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
extern "C" void status_ui_create(void)
{
    lv_obj_t *scr = lv_scr_act();
    lv_obj_set_style_bg_color(scr, COL_BG, 0);
    lv_obj_clear_flag(scr, LV_OBJ_FLAG_SCROLLABLE);

    // Full-screen canvas for all self-drawn graphics.
    g_canvas = lv_canvas_create(scr);
#if LV_VERSION_CHECK(9, 0, 0)
    lv_canvas_set_buffer(g_canvas, canvas_buf, SCR_W, SCR_H, LV_COLOR_FORMAT_NATIVE);
#else
    lv_canvas_set_buffer(g_canvas, canvas_buf, SCR_W, SCR_H, LV_IMG_CF_TRUE_COLOR);
#endif
    lv_obj_set_pos(g_canvas, 0, 0);

    draw_static();

    // --- status bar text (dynamic clock / battery would be refreshed live) ---
    mk_label(scr, 7,  2, "2026-7-16", FONT_10, COL_WHITE);
    mk_label(scr, 61, 2, "11:29",     FONT_10, COL_WHITE);
    mk_label(scr, 285,2, "100%",      FONT_10, COL_WHITE);

    // --- title row ---
    mk_label(scr, 7,  18, "电脑状态",   FONT_12, COL_WHITE);
    mk_label(scr, 63, 18, "[电脑名称]", FONT_12, COL_DIM);
    lv_obj_t *sw = mk_label(scr, 278, 18, "[切换]", FONT_12, COL_WHITE);
    lv_obj_add_flag(sw, LV_OBJ_FLAG_CLICKABLE);
    lv_obj_add_event_cb(sw, switch_event_cb, LV_EVENT_ALL, sw);

    // --- hardware labels / specs / values ---
    mk_label(scr, 28,  43, "CPU",  FONT_10, COL_WHITE);
    mk_label(scr, 28,  83, "GPU",  FONT_10, COL_WHITE);
    mk_label(scr, 213, 43, "内存",  FONT_10, COL_WHITE);
    mk_label(scr, 213, 83, "显存占用", FONT_10, COL_WHITE);
    mk_label(scr, 55,  43, "AMD Ryzen 9 8945HX with Radeon Graphics", FONT_4, COL_DIM);
    mk_label(scr, 55,  83, "NVIDIA GeForce RTX 5060 Laptop GPU",      FONT_4, COL_DIM);
    mk_label(scr, 237, 43, "32G", FONT_4, COL_DIM);
    mk_label(scr, 255, 83, "8G",  FONT_4, COL_DIM);
    lbl_cpu_pct  = mk_label(scr, 153, 52, "1%",  FONT_12, COL_WHITE);
    lbl_gpu_pct  = mk_label(scr, 153, 92, "1%",  FONT_12, COL_WHITE);
    lbl_mem_pct  = mk_label(scr, 266, 54, "1%",  FONT_12, COL_WHITE); // "内存" value one line
    lbl_vram_pct = mk_label(scr, 266, 94, "1%",  FONT_12, COL_WHITE);

    // --- model section ---
    mk_label(scr, 7,   130, "当前大模型", FONT_12, COL_WHITE);
    mk_label(scr, 28,  155, "大模型",   FONT_10, COL_WHITE);
    mk_label(scr, 173, 155, "子模型",   FONT_10, COL_WHITE);
    mk_label(scr, 28,  169, "DEEPSEEK",        FONT_12, COL_WHITE);
    mk_label(scr, 173, 169, "DEEPSEEK-v4-pro", FONT_12, COL_WHITE);
    mk_label(scr, 138, 168, ">", FONT_10, COL_DIM);   // dropdown arrow, inside 大模型 field
    // dynamic/swappable category (currently token余额)
    mk_label(scr, 28,  192, "token余额", FONT_10, COL_WHITE);
    mk_label(scr, 28,  206, "￥ 10.21",  FONT_12, COL_WHITE);

    // Kick off the looping bar animation (~40 ms/step -> full sweep ~4 s).
    redraw_bars(1, 1, 1, 1);
    lv_timer_create(anim_timer_cb, 40, nullptr);
}
