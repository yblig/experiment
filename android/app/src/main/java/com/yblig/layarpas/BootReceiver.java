package com.yblig.layarpas;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

/** Brings the black strip back after a restart when the person asked for that. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        String a = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(a) && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)
                && !"android.intent.action.QUICKBOOT_POWERON".equals(a)) return;
        SharedPreferences p = ScreenSizer.prefs(ctx);
        boolean onBoot = p.getBoolean(ScreenSizer.K_BOOT, true);
        boolean isOverlay = "overlay".equals(p.getString(ScreenSizer.K_MODE, "off"));
        boolean allowed = onBoot || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a);
        if (isOverlay && allowed && p.getInt(ScreenSizer.K_STRIP, 0) > 0 && OverlayService.canDraw(ctx)) {
            try { OverlayService.start(ctx); } catch (Throwable ignored) {}
        }
    }
}
