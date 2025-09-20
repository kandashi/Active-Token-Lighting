import { PresetConfig } from "./preset-config.js";
import { ATLUpdate } from "./updateManager.js";

const { deepClone, duplicate, flattenObject, getProperty, hasProperty, mergeObject, setProperty } = foundry.utils;

class ATL {

    static init() {
        let defaultPresets = [
            { name: "torch", light: { dim: 40, bright: 20, color: "#a2642a", animation: { type: "torch", speed: 1, intensity: 1 }, alpha: 0.7 }, id: "ATLPresetTorch" },
            { name: "lantern", light: { dim: 60, bright: 30, color: "#a2642a", animation: { type: "torch", speed: 1, intensity: 1 }, alpha: 0.4 }, id: "ATLPresetLantern" },
            { name: "candle", light: { dim: 10, bright: 2, color: "#a2642a", animation: { type: "torch", speed: 1, intensity: 1 }, alpha: 0.2 }, id: "ATLPresetCandle" },
            { name: "flashlight", light: { dim: 60, bright: 30, color: "#8bfdf6", alpha: 0.3 }, id: "ATLPresetFlashlight" }
        ];
        game.settings.register("ATL", "size", {
            name: "Size Adjustment with Flags",
            hint: "Allow for size adjustment to be made with flags, always returns tokens to prototype token defaults if flag is not present",
            scope: "world", config: true, default: false, type: Boolean
        });
        game.settings.register("ATL", "presets", { scope: "world", config: false, default: defaultPresets, type: Object });
        game.settings.register("ATL", "conversion", { name: "conversion level", scope: "world", config: false, default: "0.2.15", type: String });
    }

    static async ready() {
        const newTransferral = game.release.generation >= 11 && !CONFIG.ActiveEffect.legacyTransferral;
        const getEffects = (actor) => {
            if (!actor) return [];
            let effects;
            if (newTransferral) effects = actor.appliedEffects;
            else if (game.system.id === "wfrp4e") effects = actor.actorEffects.filter((e) => !e.disabled && !e.isSuppressed);
            else effects = actor.effects.filter((e) => !e.disabled && !e.isSuppressed);
            return effects.filter(e => e.changes.some(c => c.key.startsWith("ATL.")));
        };

        Hooks.on("updateActiveEffect", async (effect, change, options, userId) => {
            if (game.userId !== userId) return;
            let actor;
            if (effect.parent instanceof Actor) actor = effect.parent;
            else if (newTransferral && effect.parent?.parent instanceof Actor) actor = effect.parent.parent;
            else return;
            ATL.applyEffects(actor, getEffects(actor));
        });

        Hooks.on("createActiveEffect", async (effect, options, userId) => {
            if (game.userId !== userId || effect.disabled || effect.isSuppressed) return;
            let actor;
            if (effect.parent instanceof Actor) actor = effect.parent;
            else if (newTransferral && effect.parent?.parent instanceof Actor) actor = effect.parent.parent;
            else return;
            if (!effect.changes?.some(c => c.key.startsWith("ATL."))) return;
            ATL.applyEffects(actor, getEffects(actor));
        });

        Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
            if (game.userId !== userId || effect.disabled || effect.isSuppressed) return;
            let actor;
            if (effect.parent instanceof Actor) actor = effect.parent;
            else if (newTransferral && effect.parent?.parent instanceof Actor) actor = effect.parent.parent;
            else return;
            if (!effect.changes?.some(c => c.key.startsWith("ATL."))) return;
            ATL.applyEffects(actor, getEffects(actor));
        });

        Hooks.on("createToken", (doc, options, userId) => {
            if (game.userId !== userId) return;
            const eff = getEffects(doc.actor);
            if (eff.length) ATL.applyEffects(doc.actor, eff);
        });

        Hooks.on("canvasReady", () => {
            const firstGM = game.users?.find(u => u.isGM && u.active);
            if (game.userId !== firstGM?.id) return;
            const linkedTokens = canvas.tokens.placeables.filter(t => !t.document.link);
            for (const token of linkedTokens) {
                const eff = getEffects(token.actor);
                if (eff.length) ATL.applyEffects(token.actor, eff);
            }
        });

        Hooks.on("updateItem", (item, change, options, userId) => {
            if (game.userId !== userId || !item.parent) return;
            if ((game.system.id === "dnd5e" && (hasProperty(change, "system.equipped") || hasProperty(change, "system.attunement")))
                || (game.system.id === "wfrp4e" && hasProperty(change, "system.worn.value"))
                || (game.system.id === "swade" && hasProperty(change, "system.equipStatus"))) {
                const actor = item.parent;
                ATL.applyEffects(actor, getEffects(actor));
            }
        });

        if (newTransferral) {
            const createDeleteItem = (item, options, userId) => {
                if (game.userId !== userId || !(item.parent instanceof Actor)) return;
                if (!item.effects.some(e => e.changes.some(c => c.key.startsWith("ATL.")))) return;
                const actor = item.parent;
                ATL.applyEffects(actor, actor.appliedEffects);
            };
            Hooks.on("createItem", createDeleteItem);
            Hooks.on("deleteItem", createDeleteItem);
        }

        const firstGM = game.users?.find(u => u.isGM && u.active);
        if (game.userId !== firstGM?.id) return;
        const linkedTokens = canvas.tokens.placeables.filter(t => !t.document.link);
        for (const token of linkedTokens) {
            const eff = getEffects(token.actor);
            if (eff.length) ATL.applyEffects(token.actor, eff);
        }
    }

    // ---------- Application V2 Preset Picker ----------
    static ATLPresetSelector = class ATLPresetSelector extends foundry.applications.api.ApplicationV2 {
        static DEFAULT_OPTIONS = {
            id: "atl-preset-selector",
            title: "Preset Selector",
            classes: ["atl", "preset-selector"],
            width: 420,
            height: "auto",
            resizable: true,
            modal: true
        };

        async _prepareContext(_options) {
            // Clean up any incomplete presets so labels don't show "undefined"
            const presets = await game.settings.get("ATL", "presets");
            const safe = (presets ?? []).map(p => ({ id: p.id, name: p.name ?? "(unnamed preset)" }));
            return { presets: safe };
        }

        async _renderHTML(context, _options) {
            const opts = (context.presets ?? [])
              .map(p => `<option value="${p.id}">${foundry.utils.escapeHTML(p.name)}</option>`).join("");
            return `
              <div class="atl-preset-selector">
                <div class="form-group">
                  <label>Presets</label>
                  <select name="presets">${opts}</select>
                </div>
                <footer class="sheet-footer flexrow">
                  <button type="button" data-action="update"><i class="fas fa-edit"></i> Update</button>
                  <button type="button" data-action="copy"><i class="fas fa-copy"></i> Create Copy</button>
                  <button type="button" data-action="delete"><i class="fas fa-trash-alt"></i> Delete</button>
                  <button type="button" data-action="add"><i class="fas fa-plus"></i> Add New</button>
                </footer>
              </div>`;
        }

        async _replaceHTML(elementOrHtml, htmlOrElement, _options) {
            // Normalize parameters in case Foundry passes them swapped.
            let target = elementOrHtml;
            let content = htmlOrElement;

            // If the first arg is a string (our HTML) and 2nd is an element, swap them.
            const isHTMLElement = (n) => n && typeof n === "object" && n.nodeType === 1;
            if (typeof target === "string" && isHTMLElement(content)) {
                [target, content] = [content, target];
            }

            // Resolve target element
            if (!isHTMLElement(target)) {
                // Fall back to the application root element if needed
                target = this.element ?? null;
            }
            if (!target) return;

            // Inject content
            if (typeof content === "string") {
                target.innerHTML = content;
            } else if (isHTMLElement(content)) {
                target.replaceChildren(content);
            } else {
                target.innerHTML = String(content ?? "");
            }

            // Bind listeners using a fresh context (mirrors render flow)
            const context = await this._prepareContext(_options);
            const root = target;

            const getSelectedPreset = () => {
                const id = root.querySelector('select[name="presets"]')?.value;
                const presets = context.presets ?? [];
                return presets.find(p => p.id === id);
            };

            root.querySelector('[data-action="update"]')?.addEventListener("click", async () => {
                const sel = getSelectedPreset();
                if (!sel) return ui.notifications.warn("ATL: No preset selected.");
                // Load full preset object from settings to pass to PresetConfig
                const all = await game.settings.get("ATL", "presets");
                const preset = (all ?? []).find(p => p.id === sel.id);
                if (!preset) return ui.notifications.warn("ATL: Preset not found.");
                new PresetConfig(preset).render(true);
            });

            root.querySelector('[data-action="copy"]')?.addEventListener("click", async () => {
                const sel = getSelectedPreset();
                if (!sel) return ui.notifications.warn("ATL: No preset selected.");
                const all = await game.settings.get("ATL", "presets");
                const preset = (all ?? []).find(p => p.id === sel.id);
                if (!preset) return ui.notifications.warn("ATL: Preset not found.");
                const copy = deepClone(preset);
                delete copy.id;
                new PresetConfig(copy).render(true);
            });

            root.querySelector('[data-action="delete"]')?.addEventListener("click", async () => {
                const sel = getSelectedPreset();
                if (!sel) return ui.notifications.warn("ATL: No preset selected.");
                const confirmed = await Dialog.confirm({
                    title: "Confirmation",
                    content: `<p>Are you sure you want to remove this preset?</p>`
                });
                if (!confirmed) return;
                const presets = await game.settings.get("ATL", "presets");
                const idx = (presets ?? []).findIndex(p => p.id === sel.id);
                if (idx >= 0) {
                    presets.splice(idx, 1);
                    await game.settings.set("ATL", "presets", presets);
                    this.render(true);
                }
            });

            root.querySelector('[data-action="add"]')?.addEventListener("click", () => {
                new PresetConfig().render(true);
            });
        }
    };

    static async UpdatePresets() {
        new ATL.ATLPresetSelector().render(true);
    }

    // ---- Scene Controls (PR-style v13) ----
    static getSceneControlButtons(controls) {
        if (game.release.generation >= 13) {
            if (!game.user.isGM) return;
            controls.lighting.tools.atlLights = {
                name: "atlLights",
                title: "ATL Presets",
                icon: "fas fa-plus-circle",
                button: true,
                toggle: false,
                onClick: () => ATL.UpdatePresets()
            };
        } else {
            const tokenButton = controls.find(b => b.name === "lighting");
            if (tokenButton) {
                tokenButton.tools.push({
                    name: "atl-lights",
                    title: "ATL Presets",
                    icon: "fas fa-plus-circle",
                    visible: game.user.isGM,
                    onClick: () => ATL.UpdatePresets(),
                    button: true
                });
            }
        }
    }

    static async applyEffects(entity, effects) {
        if (entity.documentName !== "Actor") return;
        const tokenArray = entity.getActiveTokens();
        if (!tokenArray.length) return;

        const changes = effects.reduce((acc, e) => {
            if (e.disabled || e.isSuppressed) return acc;
            return acc.concat(e.changes.map(c => {
                c = duplicate(c);
                c.effect = e;
                c.priority = c.priority ?? (c.mode * 10);
                return c;
            }));
        }, []);
        changes.sort((a, b) => a.priority - b.priority);

        for (const token of tokenArray) {
            let originalDelta = token.document.flags.ATL?.originals || {};
            const originals = mergeObject(token.document.toObject(), originalDelta);
            let overrides = {};
            const applyOverride = (key, value, preValue) => {
                setProperty(overrides, key, value);
                if (!hasProperty(originalDelta, key)) setProperty(originalDelta, key, preValue);
            };

            for (const change of changes) {
                if (!change.key.includes("ATL")) continue;
                const updateKey = change.key.slice(4);
                if (updateKey === "preset") {
                    const presetArray = game.settings.get("ATL", "presets");
                    let preset = presetArray.find(i => i.name === change.value);
                    if (!preset) { console.error(`ATL: No preset ${change.value} found`); continue; }
                    preset = flattenObject(preset);
                    for (const [k, v] of Object.entries(preset)) if (v === "" || v === undefined || v === null) delete preset[k];
                    const checkString = (el) => typeof el === "string";
                    if ([preset["light.dim"], preset["light.bright"], preset["sight.range"]].some(checkString)) ui.notifications.error("ATL: preset string error");
                    if ("sight.angle" in preset) preset["sight.angle"] = parseInt(preset["sight.angle"]);
                    if ("light.angle" in preset) preset["light.angle"] = parseInt(preset["light.angle"]);
                    delete preset.id; delete preset.name;
                    console.log("ATE | apply preset", change.value, preset);
                    for (const [k, v] of Object.entries(preset)) {
                        const orig = getProperty(originals, k);
                        applyOverride(k, v, orig);
                    }
                } else if (updateKey.startsWith("detectionModes.")) {
                    const parts = updateKey.split(".");
                    if (parts.length === 3) {
                        const [_, id, key] = parts;
                        const detectionModes =
                            getProperty(overrides, "detectionModes") ||
                            duplicate(getProperty(originals, "detectionModes")) ||
                            [];
                        let dm = detectionModes.find(d => d.id === id);
                        if (!dm) { dm = { id, enabled: true, range: 0 }; detectionModes.push(dm); }
                        const fakeChange = duplicate(change);
                        fakeChange.key = key;
                        const result = ATL.apply(undefined, fakeChange, undefined, dm[key]);
                        if (result !== null) {
                            dm[key] = result;
                            const pre = getProperty(originals, "detectionModes") || [];
                            applyOverride("detectionModes", detectionModes, pre);
                        }
                    }
                } else {
                    const preValue = getProperty(overrides, updateKey) || getProperty(originals, updateKey);
                    let result = ATL.apply(entity, change, originals, preValue);
                    if (change.key === "ATL.alpha") result = result * result;
                    if (result !== null) {
                        if (updateKey === "light.animation" && typeof result === "string") {
                            let resultTmp;
                            try { resultTmp = JSON.parse(result); }
                            catch (e) {
                                const fixedJSON = result
                                  .replace(/:\s*"([^"]*)"/g, (m, p1) => `: "${p1.replace(/:/g, "@colon@")}"`)
                                  .replace(/:\s*'([^']*)'/g, (m, p1) => `: "${p1.replace(/:/g, "@colon@")}"`)
                                  .replace(/(['"])?([a-z0-9A-Z_]+)(['"])?\s*:/g, '"$2": ')
                                  .replace(/:\s*(['"])?([a-z0-9A-Z_]+)(['"])?/g, ':"$2"')
                                  .replace(/@colon@/g, ":");
                                resultTmp = JSON.parse(fixedJSON);
                                for (const [k, v] of Object.entries(resultTmp)) resultTmp[k] = ATL.switchType(k, v);
                            }
                            for (const [k, v] of Object.entries(resultTmp)) {
                                const key = `${updateKey}.${k}`;
                                const pre = getProperty(originals, key);
                                applyOverride(key, v, pre);
                            }
                        } else if (updateKey === "sight.visionMode") {
                            applyOverride(updateKey, result, preValue);
                            const visionDefaults = CONFIG.Canvas.visionModes[result]?.vision?.defaults || {};
                            for (const [k, v] of Object.entries(visionDefaults)) {
                                const key = `sight.${k}`;
                                const pre = getProperty(originals, key);
                                applyOverride(key, v, pre);
                            }
                        } else {
                            applyOverride(updateKey, result, preValue);
                        }
                    }
                }
            }

            overrides["flags.ATL.originals"] = originalDelta;
            overrides = flattenObject(overrides);
            const removeDelta = (key) => {
                const head = key.split(".");
                const tail = `-=${head.pop()}`;
                const path = ["flags", "ATL", "originals", ...head, tail].join(".");
                overrides[path] = null;
            };
            for (const [k, v] of Object.entries(flattenObject(originalDelta))) {
                if (!(k in overrides)) {
                    overrides[k] = v;
                    delete overrides[`flags.ATL.originals.${k}`];
                    removeDelta(k);
                }
            }
            console.log("ATE | Going to update token", token.document.id, overrides);
            await token.document.update(overrides);
        }
    }

    static apply(token, change, originals, preValue) {
        const modes = CONST.ACTIVE_EFFECT_MODES;
        switch (change.mode) {
            case modes.ADD:       return ATL.applyAdd(token, change, originals, preValue);
            case modes.MULTIPLY:  return ATL.applyMultiply(token, change, originals, preValue);
            case modes.OVERRIDE:
            case modes.CUSTOM:
            case modes.UPGRADE:
            case modes.DOWNGRADE: return ATL.applyOverride(token, change, originals, preValue);
        }
    }

    static switchType(key, value) {
        const numeric = ["brightSight","dimSight","light.dim","light.bright","dim","bright","scale","height","width","light.angle","light.alpha","rotation","speed","intensity"];
        const bools = ["mirrorX","mirrorY","light.gradual","vision"];
        if (numeric.includes(key)) return parseFloat(value);
        if (bools.includes(key)) return value === "true" ? true : value === "false" ? false : value;
        return value;
    }

    static applyAdd(token, change, originals, current) {
        let { key, value } = change;
        key = key.slice(4);
        value = ATL.switchType(key, value);
        const ct = getType(current);
        let update = null;
        switch (ct) {
            case "null":   update = parseInt(value); break;
            case "string": update = current + String(value); break;
            case "number": if (Number.isNumeric(value)) update = current + Number(value); break;
            case "Array":  if (!current.length || (getType(value) === getType(current[0]))) update = current.concat([value]); break;
        }
        return update;
    }

    static applyMultiply(token, change, originals, current) {
        let { key, value } = change;
        key = key.slice(4);
        value = ATL.switchType(key, value);
        if ((typeof current !== "number") || (typeof value !== "number")) return null;
        return current * value;
    }

    static applyOverride(token, change, originals, current) {
        let { key, value, mode } = change;
        key = key.slice(4);
        value = ATL.switchType(key, value);
        if (mode === CONST.ACTIVE_EFFECT_MODES.UPGRADE && typeof current === "number" && current >= Number(value)) return null;
        if (mode === CONST.ACTIVE_EFFECT_MODES.DOWNGRADE && typeof current === "number" && current <  Number(value)) return null;
        if (typeof current === "number") return Number(value);
        return value;
    }
}

window.ATLUpdate = ATLUpdate;

Hooks.on("init", ATL.init);
Hooks.on("ready", ATL.ready);
Hooks.on("getSceneControlButtons", ATL.getSceneControlButtons);
