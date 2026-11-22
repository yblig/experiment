package com.yblig.layarpas;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.Surface;
import android.view.View;
import android.view.WindowManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

/** Draws a black strip over the physical right edge, above every app. */
public class OverlayService extends Service {
    public static final String ACTION_STOP = "com.yblig.layarpas.STOP_OVERLAY";
    public static final String ACTION_UPDATE = "com.yblig.layarpas.UPDATE_OVERLAY";
    private static final String CHANNEL = "overlay";
    private static final int NOTIF_ID = 41;

    public static volatile boolean running = false;

    private WindowManager wm;
    private View strip;

    public static void start(Context ctx) {
        Intent i = new Intent(ctx, OverlayService.class).setAction(ACTION_UPDATE);
        if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i);
        else ctx.startService(i);
    }

    public static void stop(Context ctx) {
        ctx.stopService(new Intent(ctx, OverlayService.class));
    }

    public static boolean canDraw(Context ctx) {
        return Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(ctx);
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onCreate() {
        super.onCreate();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        goForeground();
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            ScreenSizer.prefs(this).edit().putString(ScreenSizer.K_MODE, "off").apply();
            stopSelf();
            return START_NOT_STICKY;
        }
        if (!canDraw(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        running = true;
        layout();
        return START_STICKY;
    }

    private void goForeground() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Tutup hitam", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Tampil selama tutup hitam aktif");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), piFlags);
        PendingIntent stop = PendingIntent.getService(this, 1,
                new Intent(this, OverlayService.class).setAction(ACTION_STOP), piFlags);
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_tile)
                .setContentTitle("Tutup hitam aktif")
                .setContentText("Sisi kanan layar ditutup hitam")
                .setContentIntent(open)
                .addAction(0, "Matikan", stop)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE : 0;
        ServiceCompat.startForeground(this, NOTIF_ID, n, type);
    }

    private void layout() {
        int stripPx = ScreenSizer.prefs(this).getInt(ScreenSizer.K_STRIP, 0);
        int[] phys = ScreenSizer.physicalSize(this);
        int[] logi = ScreenSizer.logicalSize(this);
        int size = phys[0] > 0 ? (int) Math.ceil(stripPx * (double) logi[0] / phys[0]) : stripPx;
        size = Math.max(1, size);

        int rotation = ScreenSizer.defaultDisplay(this).getRotation();
        boolean vertical = rotation == Surface.ROTATION_0 || rotation == Surface.ROTATION_180;
        int gravity;
        switch (rotation) {
            case Surface.ROTATION_90: gravity = Gravity.TOP; break;      // natural right edge is now on top
            case Surface.ROTATION_180: gravity = Gravity.LEFT; break;
            case Surface.ROTATION_270: gravity = Gravity.BOTTOM; break;
            default: gravity = Gravity.RIGHT;
        }
        gravity |= vertical ? Gravity.TOP : Gravity.LEFT;

        int type = Build.VERSION.SDK_INT >= 26
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                vertical ? size : WindowManager.LayoutParams.MATCH_PARENT,
                vertical ? WindowManager.LayoutParams.MATCH_PARENT : size,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.OPAQUE);
        lp.gravity = gravity;
        if (Build.VERSION.SDK_INT >= 28) {
            lp.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= 30
                    ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                    : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        if (Build.VERSION.SDK_INT >= 30) lp.setFitInsetsTypes(0);
        if (Build.VERSION.SDK_INT >= 31) lp.alpha = 1f;

        try {
            if (strip == null) {
                strip = new View(this);
                strip.setBackgroundColor(Color.BLACK);
                wm.addView(strip, lp);
            } else {
                wm.updateViewLayout(strip, lp);
            }
        } catch (Throwable e) {
            stopSelf();
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (strip != null) layout();
    }

    @Override
    public void onDestroy() {
        running = false;
        if (strip != null) {
            try { wm.removeView(strip); } catch (Throwable ignored) {}
            strip = null;
        }
        super.onDestroy();
    }
}
