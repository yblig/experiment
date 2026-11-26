package com.yblig.strukku;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.OutputStream;
import java.lang.reflect.Method;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Classic Bluetooth (SPP / RFCOMM) bridge for ESC/POS thermal receipt printers.
 * JS: registerPlugin('BtPrinter')
 *   status()                 -> { supported, enabled, granted, connected, address, name }
 *   requestAccess()          -> asks BLUETOOTH_CONNECT/SCAN on Android 12+
 *   enable()                 -> opens the system "turn on Bluetooth" dialog
 *   openSettings()           -> opens system Bluetooth settings (for pairing)
 *   listPaired()             -> { devices: [{ name, address, printer }] }
 *   connect({ address })     -> connects (tries secure, insecure, then channel 1)
 *   disconnect()
 *   write({ data, chunk?, delay? }) -> data is base64 ESC/POS bytes
 */
@CapacitorPlugin(
    name = "BtPrinter",
    permissions = {
        @Permission(alias = "bluetooth", strings = { Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_SCAN })
    }
)
public class BtPrinterPlugin extends Plugin {
    private static final UUID SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private BluetoothSocket socket;
    private OutputStream out;
    private String address;
    private String name;

    private BluetoothAdapter adapter() {
        BluetoothManager m = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        return m != null ? m.getAdapter() : null;
    }

    private boolean granted() {
        if (Build.VERSION.SDK_INT < 31) return true;
        return getPermissionState("bluetooth") == PermissionState.GRANTED;
    }

    private boolean ensure(PluginCall call, String callback) {
        if (granted()) return true;
        requestPermissionForAlias("bluetooth", call, callback);
        return false;
    }

    @PluginMethod
    public void status(PluginCall call) {
        BluetoothAdapter a = adapter();
        JSObject r = new JSObject();
        r.put("supported", a != null);
        boolean en = false;
        try { en = a != null && a.isEnabled(); } catch (Exception ignored) {}
        r.put("enabled", en);
        r.put("granted", granted());
        r.put("connected", socket != null && socket.isConnected());
        r.put("address", address);
        r.put("name", name);
        call.resolve(r);
    }

    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (!ensure(call, "accessCallback")) return;
        JSObject r = new JSObject();
        r.put("granted", true);
        call.resolve(r);
    }

    @PermissionCallback
    private void accessCallback(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", granted());
        call.resolve(r);
    }

    @PluginMethod
    @SuppressLint("MissingPermission")
    public void enable(PluginCall call) {
        if (!ensure(call, "enableCallback")) return;
        doEnable(call);
    }

    @PermissionCallback
    private void enableCallback(PluginCall call) {
        if (!granted()) { call.reject("Izin Bluetooth ditolak", "DENIED"); return; }
        doEnable(call);
    }

    @SuppressLint("MissingPermission")
    private void doEnable(PluginCall call) {
        try {
            Intent i = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Tidak bisa menyalakan Bluetooth: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void listPaired(PluginCall call) {
        if (!ensure(call, "listCallback")) return;
        doList(call);
    }

    @PermissionCallback
    private void listCallback(PluginCall call) {
        if (!granted()) { call.reject("Izin Bluetooth ditolak", "DENIED"); return; }
        doList(call);
    }

    @SuppressLint("MissingPermission")
    private void doList(PluginCall call) {
        BluetoothAdapter a = adapter();
        if (a == null) { call.reject("Perangkat tidak mendukung Bluetooth", "UNSUPPORTED"); return; }
        if (!a.isEnabled()) { call.reject("Bluetooth mati", "OFF"); return; }
        JSArray list = new JSArray();
        try {
            Set<BluetoothDevice> bonded = a.getBondedDevices();
            if (bonded != null) {
                for (BluetoothDevice d : bonded) {
                    JSObject o = new JSObject();
                    String n = d.getName();
                    o.put("name", n != null ? n : d.getAddress());
                    o.put("address", d.getAddress());
                    boolean printer = false;
                    try {
                        BluetoothClass c = d.getBluetoothClass();
                        if (c != null) {
                            int major = c.getMajorDeviceClass();
                            printer = major == BluetoothClass.Device.Major.IMAGING
                                || c.getDeviceClass() == 1664; // imaging/printer
                        }
                    } catch (Exception ignored) {}
                    String ln = n != null ? n.toLowerCase() : "";
                    if (ln.contains("print") || ln.contains("pos") || ln.contains("rpp") || ln.contains("mtp")
                        || ln.contains("bt-") || ln.contains("58") || ln.contains("80") || ln.contains("thermal")
                        || ln.contains("epson") || ln.contains("xprinter") || ln.contains("pt-") || ln.contains("panda")
                        || ln.contains("eppos") || ln.contains("bluetooth printer") || ln.contains("mpt")) printer = true;
                    o.put("printer", printer);
                    list.put(o);
                }
            }
        } catch (Exception e) {
            call.reject("Gagal membaca perangkat: " + e.getMessage());
            return;
        }
        JSObject r = new JSObject();
        r.put("devices", list);
        call.resolve(r);
    }

    @PluginMethod
    public void connect(PluginCall call) {
        if (!ensure(call, "connectCallback")) return;
        doConnect(call);
    }

    @PermissionCallback
    private void connectCallback(PluginCall call) {
        if (!granted()) { call.reject("Izin Bluetooth ditolak", "DENIED"); return; }
        doConnect(call);
    }

    @SuppressLint("MissingPermission")
    private void doConnect(PluginCall call) {
        final String addr = call.getString("address");
        if (addr == null) { call.reject("Alamat printer kosong"); return; }
        final BluetoothAdapter a = adapter();
        if (a == null) { call.reject("Perangkat tidak mendukung Bluetooth", "UNSUPPORTED"); return; }
        if (!a.isEnabled()) { call.reject("Bluetooth mati", "OFF"); return; }
        io.execute(() -> {
            closeQuietly();
            BluetoothDevice dev;
            try { dev = a.getRemoteDevice(addr); } catch (Exception e) { call.reject("Alamat tidak valid"); return; }
            try { a.cancelDiscovery(); } catch (Exception ignored) {}
            BluetoothSocket s = null;
            Exception last = null;
            for (int attempt = 0; attempt < 3 && s == null; attempt++) {
                BluetoothSocket t = null;
                try {
                    if (attempt == 0) t = dev.createRfcommSocketToServiceRecord(SPP);
                    else if (attempt == 1) t = dev.createInsecureRfcommSocketToServiceRecord(SPP);
                    else {
                        Method m = dev.getClass().getMethod("createRfcommSocket", int.class);
                        t = (BluetoothSocket) m.invoke(dev, 1);
                    }
                    t.connect();
                    s = t;
                } catch (Exception e) {
                    last = e;
                    try { if (t != null) t.close(); } catch (Exception ignored) {}
                    try { Thread.sleep(250); } catch (InterruptedException ignored) {}
                }
            }
            if (s == null) {
                call.reject("Gagal terhubung ke printer. Pastikan printer menyala dan dekat. " + (last != null ? last.getMessage() : ""), "CONNECT");
                return;
            }
            try {
                socket = s;
                out = s.getOutputStream();
                address = addr;
                String n = null;
                try { n = dev.getName(); } catch (Exception ignored) {}
                name = n != null ? n : addr;
                JSObject r = new JSObject();
                r.put("connected", true);
                r.put("address", address);
                r.put("name", name);
                call.resolve(r);
            } catch (Exception e) {
                closeQuietly();
                call.reject("Gagal membuka jalur data: " + e.getMessage(), "CONNECT");
            }
        });
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        io.execute(() -> {
            closeQuietly();
            call.resolve();
        });
    }

    @PluginMethod
    public void write(PluginCall call) {
        final String data = call.getString("data");
        final int chunk = call.getInt("chunk", 512);
        final int delay = call.getInt("delay", 20);
        if (data == null) { call.reject("Data kosong"); return; }
        io.execute(() -> {
            if (socket == null || out == null || !socket.isConnected()) {
                call.reject("Printer belum terhubung", "NOT_CONNECTED");
                return;
            }
            try {
                byte[] bytes = Base64.decode(data, Base64.DEFAULT);
                for (int i = 0; i < bytes.length; i += chunk) {
                    int len = Math.min(chunk, bytes.length - i);
                    out.write(bytes, i, len);
                    out.flush();
                    if (delay > 0) Thread.sleep(delay);
                }
                JSObject r = new JSObject();
                r.put("written", bytes.length);
                call.resolve(r);
            } catch (Exception e) {
                closeQuietly();
                call.reject("Gagal mengirim ke printer: " + e.getMessage(), "WRITE");
            }
        });
    }

    private void closeQuietly() {
        try { if (out != null) out.close(); } catch (Exception ignored) {}
        try { if (socket != null) socket.close(); } catch (Exception ignored) {}
        out = null;
        socket = null;
    }

    @Override
    protected void handleOnDestroy() {
        closeQuietly();
        io.shutdown();
        super.handleOnDestroy();
    }
}
