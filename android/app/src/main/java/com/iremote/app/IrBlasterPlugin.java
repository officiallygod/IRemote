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

import org.json.JSONException;

@CapacitorPlugin(name = "IrBlaster")
public class IrBlasterPlugin extends Plugin {
    private static final String TAG = "IrBlasterPlugin";
    private ConsumerIrManager irManager;

    @Override
    public void load() {
        super.load();
        try {
            irManager = (ConsumerIrManager) getContext().getSystemService(Context.CONSUMER_IR_SERVICE);
        } catch (Exception e) {
            Log.e(TAG, "Error getting ConsumerIrManager service", e);
        }
    }

    @PluginMethod
    public void hasIrEmitter(PluginCall call) {
        JSObject ret = new JSObject();
        boolean hasEmitter = irManager != null && irManager.hasIrEmitter();
        ret.put("hasEmitter", hasEmitter);
        call.resolve(ret);
    }

    @PluginMethod
    public void getCarrierFrequencies(PluginCall call) {
        JSObject ret = new JSObject();
        JSArray freqArray = new JSArray();

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
        ret.put("frequencies", freqArray);
        call.resolve(ret);
    }

    @PluginMethod
    public void transmit(PluginCall call) {
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
            int[] pattern = new int[length];
            for (int i = 0; i < length; i++) {
                pattern[i] = patternArray.getInt(i);
            }

            // Blast standard infrared pulse sequence
            irManager.transmit(frequency, pattern);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("frequency", frequency);
            ret.put("pulseCount", length);
            call.resolve(ret);

        } catch (JSONException e) {
            Log.e(TAG, "Error parsing pattern array", e);
            call.reject("Error parsing pattern JSON: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "Exception during IR transmission", e);
            call.reject("Transmission failed: " + e.getMessage());
        }
    }
}
