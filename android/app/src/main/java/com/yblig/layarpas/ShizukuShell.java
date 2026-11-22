package com.yblig.layarpas;

import android.content.Context;
import android.content.pm.PackageManager;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

import rikka.shizuku.Shizuku;
import rikka.shizuku.ShizukuRemoteProcess;

/** Small wrapper around Shizuku: status checks and running shell commands as the shell user. */
public final class ShizukuShell {
    public static final String SHIZUKU_PKG = "moe.shizuku.privileged.api";

    private ShizukuShell() {}

    public static boolean isInstalled(Context ctx) {
        try {
            ctx.getPackageManager().getPackageInfo(SHIZUKU_PKG, 0);
            return true;
        } catch (Throwable e) {
            return false;
        }
    }

    public static boolean isRunning() {
        try {
            return Shizuku.pingBinder();
        } catch (Throwable e) {
            return false;
        }
    }

    public static boolean isPreV11() {
        try {
            return isRunning() && Shizuku.isPreV11();
        } catch (Throwable e) {
            return false;
        }
    }

    public static boolean isGranted() {
        try {
            if (!isRunning() || Shizuku.isPreV11()) return false;
            return Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED;
        } catch (Throwable e) {
            return false;
        }
    }

    public static boolean deniedForever() {
        try {
            return isRunning() && Shizuku.shouldShowRequestPermissionRationale();
        } catch (Throwable e) {
            return false;
        }
    }

    public static class Result {
        public final int code;
        public final String out;
        public final String err;
        Result(int code, String out, String err) { this.code = code; this.out = out; this.err = err; }
        public boolean ok() { return code == 0; }
    }

    /** Runs `sh -c cmd` through Shizuku. Must be called off the main thread. */
    public static Result run(String cmd) throws Exception {
        if (!isGranted()) throw new IllegalStateException("Shizuku belum aktif atau belum diberi izin");
        Method m = Shizuku.class.getDeclaredMethod("newProcess", String[].class, String[].class, String.class);
        m.setAccessible(true);
        ShizukuRemoteProcess p = (ShizukuRemoteProcess) m.invoke(null, new String[]{"sh", "-c", cmd}, null, null);
        String out = readAll(p.getInputStream());
        String err = readAll(p.getErrorStream());
        int code;
        if (p.waitForTimeout(8, TimeUnit.SECONDS)) {
            code = p.exitValue();
        } else {
            p.destroy();
            code = -1;
        }
        return new Result(code, out.trim(), err.trim());
    }

    private static String readAll(InputStream in) {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(in))) {
            String line;
            while ((line = r.readLine()) != null) sb.append(line).append('\n');
        } catch (Exception ignored) {
        }
        return sb.toString();
    }
}
