import { App, URLOpenListenerEvent } from "@capacitor/app";
import { irBlaster } from "./irBlaster";
import { hapticFeedback } from "./haptics";
import { RGB_LED_CONTROLS, SUNSET_LAMP_PRESETS, getSavedSunsetOffCode } from "../data/rgbLedCodes";
import { FAN_CODES } from "../data/fanCodes";
import { FIREPLACE_CODES, getSavedFireplacePowerCode } from "../data/fireplaceCodes";

export interface DeepLinkResult {
  handled: boolean;
  message: string;
  device?: string;
  action?: string;
  source: "assistant" | "siri" | "shortcut" | "universal";
}

export type DeepLinkHandlerCallback = (result: DeepLinkResult) => void;

class AssistantDeepLinkService {
  private listeners: Set<DeepLinkHandlerCallback> = new Set();
  private isInitialized = false;

  public init(callback?: DeepLinkHandlerCallback) {
    if (callback) {
      this.listeners.add(callback);
    }

    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Capacitor Native App URL listener (Android & iOS)
    try {
      App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
        console.log("[DeepLink] App opened with URL:", event.url);
        this.processUrl(event.url);
      });
    } catch (e) {
      console.warn("[DeepLink] Capacitor App listener unavailable:", e);
    }

    // 2. Web / Browser query parameter fallback
    if (typeof window !== "undefined") {
      const search = window.location.search;
      const hash = window.location.hash;
      if (search && search.includes("device=")) {
        this.processUrl("iremote://control" + search);
      } else if (hash && hash.startsWith("#iremote://")) {
        this.processUrl(hash.substring(1));
      }
    }
  }

  public onLink(callback: DeepLinkHandlerCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public processUrl(rawUrl: string): DeepLinkResult {
    try {
      const url = new URL(rawUrl.replace("iremote://", "https://iremote.app/"));
      const path = url.pathname.replace(/^\//, "");
      const params = url.searchParams;

      const device = params.get("device") || path;
      const action = params.get("action") || "toggle";
      const value = params.get("value") || params.get("level") || "";
      const source = (params.get("source") as any) || "assistant";

      let message = "";
      let handled = false;

      // =====================================================================
      // 1. SUNSET LAMP
      // =====================================================================
      if (device === "sunset" || device === "lamp" || device === "sun") {
        if (action === "toggle" || action === "on") {
          irBlaster.sendNec(RGB_LED_CONTROLS.powerOn.hex, "Power ON", "Sunset Lamp");
          message = "Sunset Lamp Turned ON";
          handled = true;
        } else if (action === "off") {
          const offCode = getSavedSunsetOffCode();
          irBlaster.sendNec(offCode, "Power OFF", "Sunset Lamp");
          message = "Sunset Lamp Turned OFF";
          handled = true;
        } else if (action === "color" && value) {
          const preset = SUNSET_LAMP_PRESETS.find(
            (p) => p.name.toLowerCase() === value.toLowerCase() || p.colorHex.toLowerCase() === value.toLowerCase()
          );
          if (preset) {
            irBlaster.sendNec(preset.irHex, preset.name, "Sunset Lamp");
            message = "Sunset Lamp: " + preset.name;
            handled = true;
          }
        }
      }

      // =====================================================================
      // 2. SMART FLOOR FAN
      // =====================================================================
      else if (device === "fan" || device === "smart_fan") {
        if (action === "toggle" || action === "on" || action === "off") {
          irBlaster.sendNec(FAN_CODES.power.hex, "Power Toggle", "Smart Fan");
          message = "Smart Fan Toggled";
          handled = true;
        } else if (action === "speed") {
          irBlaster.sendNec(FAN_CODES.speed.hex, "Speed Adjust", "Smart Fan");
          message = "Smart Fan Speed Adjusted";
          handled = true;
        } else if (action === "osc" || action === "swing") {
          irBlaster.sendNec(FAN_CODES.swing.hex, "Swing Toggle", "Smart Fan");
          message = "Fan Oscillation Toggled";
          handled = true;
        }
      }

      // =====================================================================
      // 3. DESKTOP FIREPLACE
      // =====================================================================
      else if (device === "fireplace" || device === "fire" || device === "heater") {
        if (action === "toggle" || action === "on" || action === "off") {
          const pwrCode = getSavedFireplacePowerCode();
          irBlaster.sendNec(pwrCode, "Power Toggle", "Fireplace");
          message = "Fireplace Mist Toggled";
          handled = true;
        } else if (action === "flame" || action === "color") {
          irBlaster.sendNec(FIREPLACE_CODES.changeColor.hex, "Flame Adjust", "Fireplace");
          message = "Fireplace Flame Mode Changed";
          handled = true;
        } else if (action === "smoke" || action === "mist") {
          irBlaster.sendNec(FIREPLACE_CODES.addSmoke.hex, "Mist Toggle", "Fireplace");
          message = "Fireplace Mist Toggled";
          handled = true;
        }
      }

      // =====================================================================
      // 4. BEDSIDE TOUCH LAMP
      // =====================================================================
      else if (device === "bedside" || device === "led" || device === "bed") {
        if (action === "toggle" || action === "on") {
          irBlaster.sendNec(RGB_LED_CONTROLS.powerOn.hex, "Power ON", "Bedside Lamp");
          message = "Bedside Lamp Turned ON";
          handled = true;
        } else if (action === "off") {
          irBlaster.sendNec(RGB_LED_CONTROLS.powerOff.hex, "Power OFF", "Bedside Lamp");
          message = "Bedside Lamp Turned OFF";
          handled = true;
        }
      }

      // =====================================================================
      // 5. SMART SCENES (Sleep Mode, Cozy Mode)
      // =====================================================================
      else if (device === "scene") {
        const sceneName = (params.get("name") || value || "").toLowerCase();
        if (sceneName === "sleep" || sceneName === "all_off" || sceneName === "night") {
          irBlaster.sendNec(getSavedSunsetOffCode(), "Power OFF", "Sunset Lamp");
          setTimeout(() => irBlaster.sendNec(RGB_LED_CONTROLS.powerOff.hex, "Power OFF", "Bedside Lamp"), 250);
          setTimeout(() => irBlaster.sendNec(FAN_CODES.power.hex, "Power OFF", "Smart Fan"), 500);
          setTimeout(() => irBlaster.sendNec(getSavedFireplacePowerCode(), "Power OFF", "Fireplace"), 750);
          message = "Goodnight: All Appliances Turned OFF";
          handled = true;
        } else if (sceneName === "cozy" || sceneName === "golden_hour") {
          irBlaster.sendNec(RGB_LED_CONTROLS.powerOn.hex, "Power ON", "Sunset Lamp");
          setTimeout(() => {
            const golden = SUNSET_LAMP_PRESETS[1];
            if (golden) irBlaster.sendNec(golden.irHex, golden.name, "Sunset Lamp");
          }, 300);
          setTimeout(() => irBlaster.sendNec(getSavedFireplacePowerCode(), "Power ON", "Fireplace"), 600);
          message = "Cozy Scene Activated";
          handled = true;
        }
      }

      if (handled) {
        hapticFeedback.success();
      }

      const result: DeepLinkResult = {
        handled,
        message: message || "Unknown Deep Link Command",
        device: device || undefined,
        action,
        source,
      };

      this.listeners.forEach((cb) => cb(result));
      return result;
    } catch (err) {
      console.error("[DeepLink] Failed to parse URL:", rawUrl, err);
      const res: DeepLinkResult = {
        handled: false,
        message: "Failed to parse command URL",
        source: "universal",
      };
      this.listeners.forEach((cb) => cb(res));
      return res;
    }
  }

  // Pre-configured Siri / Google Assistant URL generators
  public getShortcutUrls() {
    return [
      {
        title: "Toggle Sunset Lamp",
        description: "Turn on/off Sunset Lamp with Google Assistant or Siri",
        url: "iremote://control?device=sunset&action=toggle",
        voicePhrase: "Hey Google, activate Sunset Lamp",
        siriPhrase: "Sunset Lamp",
      },
      {
        title: "Sunset Golden Hour",
        description: "Set sunset lamp to warm golden hour",
        url: "iremote://control?device=sunset&action=color&value=Golden%20Hour",
        voicePhrase: "Hey Google, Golden Hour",
        siriPhrase: "Golden Hour",
      },
      {
        title: "Toggle Smart Fan",
        description: "Toggle floor fan power",
        url: "iremote://control?device=fan&action=toggle",
        voicePhrase: "Hey Google, toggle fan",
        siriPhrase: "Toggle Fan",
      },
      {
        title: "Toggle Fireplace",
        description: "Toggle humidifier mist & flame",
        url: "iremote://control?device=fireplace&action=toggle",
        voicePhrase: "Hey Google, toggle fireplace",
        siriPhrase: "Fireplace",
      },
      {
        title: "Sleep Mode (All Off)",
        description: "Turn off all lights, fan, and fireplace simultaneously",
        url: "iremote://scene?name=sleep",
        voicePhrase: "Hey Google, Goodnight IRemote",
        siriPhrase: "Goodnight Bedroom",
      },
      {
        title: "Cozy Mode",
        description: "Turn on Golden Hour Sunset Lamp and Fireplace Mist",
        url: "iremote://scene?name=cozy",
        voicePhrase: "Hey Google, Cozy Room",
        siriPhrase: "Cozy Room",
      },
    ];
  }
}

export const assistantDeepLink = new AssistantDeepLinkService();
