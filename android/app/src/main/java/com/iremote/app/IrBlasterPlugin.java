package com.iremote.app;

import android.content.Context;
import android.hardware.ConsumerIrManager;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;

@CapacitorPlugin(name = "IrBlaster")
public class IrBlasterPlugin extends Plugin {
    private static final String TAG = "IRemote_IrBlaster";
    private ConsumerIrManager irManager;

    @Override
    public void load() {
        super.load();
        try {
            irManager = (ConsumerIrManager) getContext().getSystemService(Context.CONSUMER_IR_SERVICE);
            if (irManager != null) {
                Log.d(TAG, "ConsumerIrManager initialized. hasIrEmitter = " + irManager.hasIrEmitter());
            } else {
                Log.w(TAG, "ConsumerIrManager service is null on this device.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error initializing ConsumerIrManager", e);
        }
    }

    @PluginMethod
    public void hasIrEmitter(PluginCall call) {
        boolean hasEmitter = false;
        try {
            if (irManager == null) {
                irManager = (ConsumerIrManager) getContext().getSystemService(Context.CONSUMER_IR_SERVICE);
            }
            hasEmitter = (irManager != null && irManager.hasIrEmitter());
        } catch (Exception e) {
            Log.e(TAG, "Exception in hasIrEmitter", e);
        }

        JSObject ret = new JSObject();
        ret.put("hasEmitter", hasEmitter);
        call.resolve(ret);
    }

    @PluginMethod
    public void getCarrierFrequencies(PluginCall call) {
        JSObject ret = new JSObject();
        JSArray freqArray = new JSArray();

        try {
            if (irManager != null && irManager.hasIrEmitter()) {
                ConsumerIrManager.CarrierFrequencyRange[] ranges = irManager.getCarrierFrequencies();
                if (ranges != null) {
                    for (ConsumerIrManager.CarrierFrequencyRange range : ranges) {
                        JSObject r = new JSObject();
                        r.put("min", range.getMinFrequency());
                        r.put("max", range.getMaxFrequency());
                        freqArray.put(r);
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error fetching carrier frequencies", e);
        }

        ret.put("frequencies", freqArray);
        call.resolve(ret);
    }

    /**
     * High-reliability native NEC hex transmission
     * Matches IrCode Finder & Arduino-IRremote 2.x MSB-first standard
     */
    @PluginMethod
    public void transmitHex(PluginCall call) {
        String hex = call.getString("hex");
        if (hex == null || hex.trim().isEmpty()) {
            call.reject("Hex code cannot be empty");
            return;
        }

        if (irManager == null) {
            irManager = (ConsumerIrManager) getContext().getSystemService(Context.CONSUMER_IR_SERVICE);
        }

        if (irManager == null || !irManager.hasIrEmitter()) {
            call.reject("Hardware IR emitter not found on this device");
            return;
        }

        int frequency = call.getInt("frequency", 38000);
        int repeatCount = call.getInt("repeatCount", 2); // Default 2 repeats matching IrCode Finder CSV

        try {
            int[] pattern = buildNecPatternMsb(hex, repeatCount);
            irManager.transmit(frequency, pattern);
            Log.d(TAG, "Natively blasted NEC code 0x" + hex + " (MSB first, " + repeatCount + " repeats, " + pattern.length + " pulses at " + frequency + " Hz)");

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("hex", hex);
            ret.put("frequency", frequency);
            ret.put("pulseCount", pattern.length);
            ret.put("repeats", repeatCount);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "transmitHex failed", e);
            call.reject("transmitHex failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void transmit(PluginCall call) {
        if (irManager == null) {
            irManager = (ConsumerIrManager) getContext().getSystemService(Context.CONSUMER_IR_SERVICE);
        }

        if (irManager == null || !irManager.hasIrEmitter()) {
            call.reject("Device does not possess an infrared emitter or service unavailable");
            return;
        }

        Integer frequency = call.getInt("carrierFrequency", 38000);
        JSArray patternArray = call.getArray("pattern");

        if (patternArray == null || patternArray.length() == 0) {
            call.reject("Transmission pattern cannot be empty");
            return;
        }

        try {
            int length = patternArray.length();
            int adjustedLength = (length % 2 != 0) ? length + 1 : length;
            int[] pattern = new int[adjustedLength];

            for (int i = 0; i < length; i++) {
                pattern[i] = patternArray.getInt(i);
            }
            if (length % 2 != 0) {
                pattern[length] = 40000;
            }

            irManager.transmit(frequency, pattern);
            Log.d(TAG, "Transmitted raw IR pattern: " + adjustedLength + " pulses at " + frequency + " Hz");

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("frequency", frequency);
            ret.put("pulseCount", adjustedLength);
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Failed to transmit raw IR signal", e);
            call.reject("Transmission failed: " + e.getMessage());
        }
    }

    /**
     * Builds NEC pulse sequence matching Arduino-IRremote 2.x & IrCode Finder MSB-first format
     */
    private int[] buildNecPatternMsb(String hexStr, int repeatCount) {
        String clean = hexStr.replace("0x", "").replace("0X", "").trim();
        long num = Long.parseLong(clean, 16);

        int HDR_MARK = 9000;
        int HDR_SPACE = 4500;
        int BIT_MARK = 560;
        int ONE_SPACE = 1690;
        int ZERO_SPACE = 560;
        int STOP_MARK = 560;
        int GAP_SPACE = 40000; // 40ms inter-frame gap

        ArrayList<Integer> list = new ArrayList<>();

        for (int r = 0; r < Math.max(1, repeatCount); r++) {
            // Header
            list.add(HDR_MARK);
            list.add(HDR_SPACE);

            // 32 bits, MSB first (bit 31 down to bit 0)
            for (int i = 31; i >= 0; i--) {
                long bit = (num >>> i) & 1L;
                list.add(BIT_MARK);
                list.add(bit == 1 ? ONE_SPACE : ZERO_SPACE);
            }

            // Stop bit
            list.add(STOP_MARK);

            // Trailing space / inter-frame gap
            list.add(GAP_SPACE);
        }

        int[] result = new int[list.size()];
        for (int i = 0; i < list.size(); i++) {
            result[i] = list.get(i);
        }
        return result;
    }
}
