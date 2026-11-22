package com.yblig.layarpas;

import android.content.SharedPreferences;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;
import android.widget.Toast;

/** Quick Settings tile: turns the saved fix (shrink or black strip) on and off. */
public class ShrinkTileService extends TileService {
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override
    public void onStartListening() {
        super.onStartListening();
        refresh();
    }

    private boolean isOn() {
        SharedPreferences p = ScreenSizer.prefs(this);
        return p.getBoolean(ScreenSizer.K_SHRINK_ACTIVE, false) || OverlayService.running;
    }

    private void refresh() {
        Tile t = getQsTile();
        if (t == null) return;
        boolean on = isOn();
        t.setState(on ? Tile.STATE_ACTIVE : Tile.STATE_INACTIVE);
        t.setLabel("Layar Pas");
        t.setIcon(Icon.createWithResource(this, R.drawable.ic_tile));
        if (Build.VERSION.SDK_INT >= 29) {
            SharedPreferences p = ScreenSizer.prefs(this);
            String mode = p.getString(ScreenSizer.K_MODE, "off");
            t.setSubtitle(on ? ("overlay".equals(mode) ? "Tutup hitam" : "Dikecilkan") : "Mati");
        }
        t.updateTile();
    }

    @Override
    public void onClick() {
        super.onClick();
        final SharedPreferences p = ScreenSizer.prefs(this);
        final int strip = p.getInt(ScreenSizer.K_STRIP, 0);
        final boolean shrinkOn = p.getBoolean(ScreenSizer.K_SHRINK_ACTIVE, false);
        final String lastMode = p.getString("lastMode", "shrink");

        if (OverlayService.running) {
            OverlayService.stop(this);
            p.edit().putString(ScreenSizer.K_MODE, "off").apply();
            main.postDelayed(this::refresh, 300);
            return;
        }
        if (strip <= 0) {
            toast("Atur lebar dulu di aplikasi Layar Pas");
            return;
        }
        if (!shrinkOn && "overlay".equals(lastMode)) {
            if (!OverlayService.canDraw(this)) { toast("Izin tampil di atas aplikasi belum diberikan"); return; }
            p.edit().putString(ScreenSizer.K_MODE, "overlay").apply();
            OverlayService.start(this);
            main.postDelayed(this::refresh, 300);
            return;
        }
        new Thread(() -> {
            // The Shizuku binder arrives shortly after our process starts.
            for (int i = 0; i < 15 && !ShizukuShell.isGranted(); i++) {
                try { Thread.sleep(100); } catch (InterruptedException ignored) {}
            }
            if (!ShizukuShell.isGranted()) {
                main.post(() -> toast("Shizuku belum aktif. Buka Shizuku dulu."));
                return;
            }
            try {
                if (shrinkOn) {
                    ScreenSizer.reset(this);
                    p.edit().putString(ScreenSizer.K_MODE, "off").apply();
                } else {
                    ScreenSizer.apply(this, strip);
                    p.edit().putString(ScreenSizer.K_MODE, "shrink").apply();
                }
            } catch (Exception e) {
                main.post(() -> toast("Gagal: " + e.getMessage()));
            }
            main.post(this::refresh);
        }).start();
    }

    private void toast(String s) {
        Toast.makeText(getApplicationContext(), s, Toast.LENGTH_LONG).show();
    }
}
