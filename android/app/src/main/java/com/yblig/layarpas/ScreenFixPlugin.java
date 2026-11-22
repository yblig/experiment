package com.yblig.layarpas;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import rikka.shizuku.Shizuku;

@CapacitorPlugin(name = "ScreenFix")
public class ScreenFixPlugin extends Plugin {
    private static final int REQ_SHIZUKU = 4107;

    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private PluginCall pendingShizuku;
    private Runnable pendingRevert;

    private final Shizuku.OnRequestPermissionResultListener permListener = (code, result) -> {
        if (code != REQ_SHIZUKU) return;
        PluginCall c = pendingShizuku;
        pendingShizuku = null;
        if (c != null) {
            JSObject r = new JSObject();
            r.put("granted", result == PackageManager.PERMISSION_GRANTED);
            c.resolve(r);
        }
        notifyListeners("shizukuChanged", new JSObject());
    };
    private final Shizuku.OnBinderReceivedListener binderListener = () -> notifyListeners("shizukuChanged", new JSObject());
    private final Shizuku.OnBinderDeadListener deadListener = () -> notifyListeners("shizukuChanged", new JSObject());

    @Override
    public void load() {
        try {
            Shizuku.addRequestPermissionResultListener(permListener);
            Shizuku.addBinderReceivedListenerSticky(binderListener);
            Shizuku.addBinderDeadListener(deadListener);
        } catch (Throwable ignored) {
        }
    }

    @Override
    protected void handleOnDestroy() {
        try {
            Shizuku.removeRequestPermissionResultListener(permListener);
            Shizuku.removeBinderReceivedListener(binderListener);
            Shizuku.removeBinderDeadListener(deadListener);
        } catch (Throwable ignored) {
        }
        super.handleOnDestroy();
    }

    private Context ctx() { return getContext(); }
    private SharedPreferences prefs() { return ScreenSizer.prefs(ctx()); }

    private JSObject state() {
        Context c = ctx();
        SharedPreferences p = prefs();
        int[] phys = ScreenSizer.physicalSize(c);
        int[] logi = ScreenSizer.logicalSize(c);
        JSObject r = new JSObject();
        r.put("physicalWidth", phys[0]);
        r.put("physicalHeight", phys[1]);
        r.put("logicalWidth", logi[0]);
        r.put("logicalHeight", logi[1]);
        r.put("strip", p.getInt(ScreenSizer.K_STRIP, 0));
        r.put("mode", p.getString(ScreenSizer.K_MODE, "off"));
        r.put("shrinkActive", p.getBoolean(ScreenSizer.K_SHRINK_ACTIVE, false));
        r.put("appliedStrip", p.getInt("appliedStrip", 0));
        r.put("overlayRunning", OverlayService.running);
        r.put("canDrawOverlays", OverlayService.canDraw(c));
        r.put("overlayOnBoot", p.getBoolean(ScreenSizer.K_BOOT, true));
        r.put("shizukuInstalled", ShizukuShell.isInstalled(c));
        r.put("shizukuRunning", ShizukuShell.isRunning());
        r.put("shizukuGranted", ShizukuShell.isGranted());
        r.put("shizukuOld", ShizukuShell.isPreV11());
        r.put("shizukuDenied", ShizukuShell.deniedForever());
        r.put("revertPending", pendingRevert != null);
        r.put("sdk", Build.VERSION.SDK_INT);
        r.put("release", Build.VERSION.RELEASE);
        r.put("manufacturer", Build.MANUFACTURER);
        r.put("model", Build.MODEL);
        return r;
    }

    @PluginMethod
    public void getState(PluginCall call) { call.resolve(state()); }

    @PluginMethod
    public void setStrip(PluginCall call) {
        int strip = Math.max(0, call.getInt("strip", 0));
        prefs().edit().putInt(ScreenSizer.K_STRIP, strip).apply();
        if (OverlayService.running) OverlayService.start(ctx());
        call.resolve(state());
    }

    @PluginMethod
    public void setOverlayOnBoot(PluginCall call) {
        prefs().edit().putBoolean(ScreenSizer.K_BOOT, Boolean.TRUE.equals(call.getBoolean("value", true))).apply();
        call.resolve(state());
    }

    // ---------- Shizuku ----------

    @PluginMethod
    public void requestShizuku(PluginCall call) {
        if (!ShizukuShell.isRunning()) { call.reject("Shizuku belum berjalan"); return; }
        if (ShizukuShell.isPreV11()) { call.reject("Versi Shizuku terlalu lama, perbarui dulu"); return; }
        if (ShizukuShell.isGranted()) {
            JSObject r = new JSObject();
            r.put("granted", true);
            call.resolve(r);
            return;
        }
        if (ShizukuShell.deniedForever()) {
            JSObject r = new JSObject();
            r.put("granted", false);
            r.put("deniedForever", true);
            call.resolve(r);
            return;
        }
        pendingShizuku = call;
        try {
            Shizuku.requestPermission(REQ_SHIZUKU);
        } catch (Throwable e) {
            pendingShizuku = null;
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void openShizuku(PluginCall call) {
        Context c = ctx();
        Intent launch = c.getPackageManager().getLaunchIntentForPackage(ShizukuShell.SHIZUKU_PKG);
        try {
            if (launch != null) {
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                c.startActivity(launch);
            } else {
                openUri("market://details?id=" + ShizukuShell.SHIZUKU_PKG,
                        "https://play.google.com/store/apps/details?id=" + ShizukuShell.SHIZUKU_PKG);
            }
            call.resolve();
        } catch (Throwable e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void openUrl(PluginCall call) {
        String url = call.getString("url", "");
        openUri(url, url);
        call.resolve();
    }

    @PluginMethod
    public void openDeveloperSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            ctx().startActivity(i);
        } catch (ActivityNotFoundException e) {
            ctx().startActivity(new Intent(Settings.ACTION_DEVICE_INFO_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        call.resolve();
    }

    private void openUri(String primary, String fallback) {
        try {
            ctx().startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(primary)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (Throwable e) {
            try {
                ctx().startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(fallback)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            } catch (Throwable ignored) {
            }
        }
    }

    // ---------- Shrink ----------

    @PluginMethod
    public void applyShrink(PluginCall call) {
        final int strip = call.getInt("strip", prefs().getInt(ScreenSizer.K_STRIP, 0));
        final int timeout = call.getInt("timeout", 0);
        final boolean confirmMode = call.getBoolean("setMode", true);
        if (OverlayService.running) OverlayService.stop(ctx());
        cancelRevert();
        io.execute(() -> {
            try {
                int[] size = ScreenSizer.apply(ctx(), strip);
                SharedPreferences.Editor e = prefs().edit().putInt(ScreenSizer.K_STRIP, strip);
                if (confirmMode) e.putString(ScreenSizer.K_MODE, "shrink").putString("lastMode", "shrink");
                e.apply();
                if (timeout > 0) scheduleRevert(timeout);
                JSObject r = state();
                r.put("width", size[0]);
                r.put("height", size[1]);
                call.resolve(r);
            } catch (Throwable e) {
                call.reject(e.getMessage() == null ? e.toString() : e.getMessage());
            }
        });
    }

    @PluginMethod
    public void confirmShrink(PluginCall call) {
        cancelRevert();
        call.resolve(state());
    }

    @PluginMethod
    public void resetShrink(PluginCall call) {
        final boolean keepMode = Boolean.TRUE.equals(call.getBoolean("keepMode", false));
        cancelRevert();
        io.execute(() -> {
            try {
                ScreenSizer.reset(ctx());
                if (!keepMode) prefs().edit().putString(ScreenSizer.K_MODE, "off").apply();
                call.resolve(state());
            } catch (Throwable e) {
                call.reject(e.getMessage() == null ? e.toString() : e.getMessage());
            }
        });
    }

    private void scheduleRevert(int seconds) {
        main.post(() -> {
            cancelRevert();
            pendingRevert = () -> {
                pendingRevert = null;
                io.execute(() -> {
                    try {
                        ScreenSizer.reset(ctx());
                        prefs().edit().putString(ScreenSizer.K_MODE, "off").apply();
                    } catch (Throwable ignored) {
                    }
                    notifyListeners("shrinkReverted", state());
                });
            };
            main.postDelayed(pendingRevert, seconds * 1000L);
        });
    }

    private void cancelRevert() {
        if (pendingRevert != null) {
            main.removeCallbacks(pendingRevert);
            pendingRevert = null;
        }
    }

    // ---------- Overlay ----------

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (OverlayService.canDraw(ctx())) { call.resolve(state()); return; }
        try {
            Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + ctx().getPackageName())).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx().startActivity(i);
        } catch (Throwable e) {
            ctx().startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        call.resolve(state());
    }

    @PluginMethod
    public void startOverlay(PluginCall call) {
        if (!OverlayService.canDraw(ctx())) { call.reject("Izin tampil di atas aplikasi belum diberikan"); return; }
        if (Build.VERSION.SDK_INT >= 33 && getActivity() != null
                && ContextCompat.checkSelfPermission(ctx(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            // Lets the "Matikan" notification show; the strip works either way.
            ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.POST_NOTIFICATIONS}, 4108);
        }
        int strip = call.getInt("strip", prefs().getInt(ScreenSizer.K_STRIP, 0));
        prefs().edit().putInt(ScreenSizer.K_STRIP, strip)
                .putString(ScreenSizer.K_MODE, "overlay").putString("lastMode", "overlay").apply();
        Runnable go = () -> {
            OverlayService.start(ctx());
            main.postDelayed(() -> call.resolve(state()), 250);
        };
        if (prefs().getBoolean(ScreenSizer.K_SHRINK_ACTIVE, false) && ShizukuShell.isGranted()) {
            cancelRevert();
            io.execute(() -> {
                try { ScreenSizer.reset(ctx()); } catch (Throwable ignored) {}
                main.post(go);
            });
        } else {
            go.run();
        }
    }

    @PluginMethod
    public void stopOverlay(PluginCall call) {
        OverlayService.stop(ctx());
        if ("overlay".equals(prefs().getString(ScreenSizer.K_MODE, "off"))) {
            prefs().edit().putString(ScreenSizer.K_MODE, "off").apply();
        }
        main.postDelayed(() -> call.resolve(state()), 200);
    }
}
