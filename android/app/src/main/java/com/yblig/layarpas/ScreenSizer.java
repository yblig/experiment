package com.yblig.layarpas;

import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.display.DisplayManager;
import android.util.DisplayMetrics;
import android.view.Display;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Shrinks the whole system display with `wm size` (via Shizuku) so a strip of
 * `strip` physical pixels at the right edge is left black. Android centres a
 * narrower logical display, so an equal strip appears on the left.
 */
public final class ScreenSizer {
    public static final String PREFS = "layarpas";
    public static final String K_STRIP = "strip";
    public static final String K_MODE = "mode";               // shrink | overlay | off
    public static final String K_SHRINK_ACTIVE = "shrinkActive";
    public static final String K_ORIG = "origOverride";       // "WxH" or "none"
    public static final String K_BOOT = "overlayOnBoot";

    private ScreenSizer() {}

    public static SharedPreferences prefs(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Panel size in its natural orientation, short side first: {short, long}. */
    public static int[] physicalSize(Context ctx) {
        Display d = defaultDisplay(ctx);
        int w = 0, h = 0;
        try {
            Display.Mode m = d.getMode();
            w = m.getPhysicalWidth();
            h = m.getPhysicalHeight();
        } catch (Throwable ignored) {
        }
        if (w <= 0 || h <= 0) {
            DisplayMetrics dm = new DisplayMetrics();
            d.getRealMetrics(dm);
            w = dm.widthPixels;
            h = dm.heightPixels;
        }
        return new int[]{Math.min(w, h), Math.max(w, h)};
    }

    /** Current logical size (what apps see), short side first. */
    public static int[] logicalSize(Context ctx) {
        DisplayMetrics dm = new DisplayMetrics();
        defaultDisplay(ctx).getRealMetrics(dm);
        return new int[]{Math.min(dm.widthPixels, dm.heightPixels), Math.max(dm.widthPixels, dm.heightPixels)};
    }

    public static Display defaultDisplay(Context ctx) {
        DisplayManager dm = (DisplayManager) ctx.getSystemService(Context.DISPLAY_SERVICE);
        return dm.getDisplay(Display.DEFAULT_DISPLAY);
    }

    public static final class WmSize {
        public int pw, ph, ow = -1, oh = -1;
    }

    private static final Pattern PHYS = Pattern.compile("Physical size:\\s*(\\d+)x(\\d+)");
    private static final Pattern OVER = Pattern.compile("Override size:\\s*(\\d+)x(\\d+)");

    public static WmSize readWm() throws Exception {
        ShizukuShell.Result r = ShizukuShell.run("wm size");
        WmSize s = new WmSize();
        Matcher m = PHYS.matcher(r.out);
        if (!m.find()) throw new IllegalStateException("Tidak bisa membaca ukuran layar: " + r.out + " " + r.err);
        s.pw = Integer.parseInt(m.group(1));
        s.ph = Integer.parseInt(m.group(2));
        Matcher o = OVER.matcher(r.out);
        if (o.find()) {
            s.ow = Integer.parseInt(o.group(1));
            s.oh = Integer.parseInt(o.group(2));
        }
        return s;
    }

    /** Applies the shrink. Returns {logicalWidth, logicalHeight}. Call off the main thread. */
    public static int[] apply(Context ctx, int strip) throws Exception {
        SharedPreferences p = prefs(ctx);
        WmSize w = readWm();
        boolean ours = p.getBoolean(K_SHRINK_ACTIVE, false);
        if (!ours) {
            // Remember an OEM override (e.g. FHD+ mode on a QHD panel) so reset restores it.
            String orig = (w.ow > 0 && w.oh > 0 && !(w.ow == w.pw && w.oh == w.ph)) ? (w.ow + "x" + w.oh) : "none";
            p.edit().putString(K_ORIG, orig).commit();
        }
        String orig = p.getString(K_ORIG, "none");
        int bw = w.pw, bh = w.ph;
        int[] o = parse(orig);
        if (o != null) { bw = o[0]; bh = o[1]; }

        // Work in natural orientation: width is the short side on phones.
        boolean portraitNatural = w.pw <= w.ph;
        int physShort = portraitNatural ? w.pw : w.ph;
        int physLong = portraitNatural ? w.ph : w.pw;
        int baseShort = portraitNatural ? bw : bh;
        int baseLong = portraitNatural ? bh : bw;

        // `strip` is measured against the display mode size; wm may report another scale.
        int modeShort = physicalSize(ctx)[0];
        if (modeShort > 0 && modeShort != physShort) strip = (int) Math.round(strip * (double) physShort / modeShort);
        int max = (int) (physShort * 0.4);
        strip = Math.max(0, Math.min(strip, max));
        if (strip == 0) {
            reset(ctx);
            return new int[]{bw, bh};
        }
        double scale = (double) physLong / baseLong;  // physical px per logical px
        double usable = physShort - 2.0 * strip;
        int ns = (int) Math.round(usable / scale);
        ns -= ns % 2;
        String cmd = portraitNatural ? ("wm size " + ns + "x" + baseLong) : ("wm size " + baseLong + "x" + ns);
        ShizukuShell.Result r = ShizukuShell.run(cmd);
        if (!r.ok()) throw new IllegalStateException("Perintah gagal: " + r.err + " " + r.out);
        p.edit().putBoolean(K_SHRINK_ACTIVE, true).putInt("appliedStrip", strip).commit();
        return portraitNatural ? new int[]{ns, baseLong} : new int[]{baseLong, ns};
    }

    /** Restores the original size. Call off the main thread. */
    public static void reset(Context ctx) throws Exception {
        SharedPreferences p = prefs(ctx);
        String orig = p.getString(K_ORIG, "none");
        String cmd = parse(orig) != null ? ("wm size " + orig) : "wm size reset";
        ShizukuShell.Result r = ShizukuShell.run(cmd);
        if (!r.ok()) throw new IllegalStateException("Perintah gagal: " + r.err + " " + r.out);
        p.edit().putBoolean(K_SHRINK_ACTIVE, false).commit();
    }

    static int[] parse(String s) {
        if (s == null) return null;
        Matcher m = Pattern.compile("^(\\d+)x(\\d+)$").matcher(s.trim());
        if (!m.find()) return null;
        return new int[]{Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2))};
    }
}
