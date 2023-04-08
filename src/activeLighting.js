import { PresetConfig } from "./preset-config.js";
import { ATLUpdate } from "./updateManager.js";

class ATL {

    static init() {
        let defaultPresets = [
            {
                name: "torch",
                light: {
                    dim: 40,
                    bright: 20,
                    color: "#a2642a",
                    animation: {
                        'type': 'torch',
                        'speed': 1,
                        'intensity': 1
                    },
                    alpha: 0.7,
                },
                id: "ATLPresetTorch"
            },
            {
                name: "lantern",
                light: {
                    dim: 60,
                    bright: 30,
                    color: "#a2642a",
                    animation: {
                        'type': 'torch',
                        'speed': 1,
                        'intensity': 1
                    },
                    alpha: 0.4
                },
                id: "ATLPresetLantern"

            },
            {
                name: "candle",
                light: {
                    dim: 10,
                    bright: 2,
                    color: "#a2642a",
                    animation: {
                        'type': 'torch',
                        'speed': 1,
                        'intensity': 1
                    },
                    alpha: 0.2
                },
                id: "ATLPresetCandle"

            },
            {
                name: "flashlight",
                light: {
                    dim: 60,
                    bright: 30,
                    color: "#8bfdf6",
                    alpha: 0.3
                },
                id: "ATLPresetFlashlight"
            }
        ]
        game.settings.register("ATL", "size", {
            name: "Size Adjustment with Flags",
            hint: "Allow for size adjustment to be made with flags, always returns tokens to prototype token defaults if flag is not present",
            scope: "world",
            config: true,
            default: false,
            type: Boolean,
        });
        game.settings.register("ATL", "presets", {
            scope: "world",
            config: false,
            default: defaultPresets,
            type: Object,
        });
        game.settings.register("ATL", "conversion", {
            name: "conversion level",
            scope: "world",
            config: false,
            default: "0.2.15",
            type: String,
        });
        

    }
    static async ready() {
        Hooks.on("updateActiveEffect", async (effect, change, options, userId) => {
            if (game.userId !== userId) return;
            if (!effect.changes?.find(effect => effect.key.includes("ATL"))) return;
            let totalEffects = effect.parent.effects.contents.filter(i => !i.disabled)
            let ATLeffects = totalEffects.filter(entity => !!entity.changes.find(effect => effect.key.includes("ATL")))
            if (effect.disabled) ATLeffects.push(effect)
            if (ATLeffects.length > 0) ATL.applyEffects(effect.parent, ATLeffects)
        })

        Hooks.on("createActiveEffect", async (effect, options, userId) => {
            if (game.userId !== userId) return;
            if (!effect.changes?.find(effect => effect.key.includes("ATL"))) return;
            const totalEffects = effect.parent.effects.contents.filter(i => !i.disabled)
            let ATLeffects = totalEffects.filter(entity => !!entity.changes.find(effect => effect.key.includes("ATL")))
            if (ATLeffects.length > 0) ATL.applyEffects(effect.parent, ATLeffects)
        })

        Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
            if (game.userId !== userId) return;
            if (!effect.changes?.find(effect => effect.key.includes("ATL"))) return;
            let ATLeffects = effect.parent.effects.filter(entity => !!entity.changes.find(effect => effect.key.includes("ATL")))
            ATL.applyEffects(effect.parent, ATLeffects)

        })

        Hooks.on("createToken", (doc, options, userId) => {
            if (game.userId !== userId) return;
            let ATLeffects = doc.actor.effects.filter(entity => !!entity.changes.find(effect => effect.key.includes("ATL")))
            if (ATLeffects.length > 0) ATL.applyEffects(doc.actor, ATLeffects)
        })

        Hooks.on("canvasReady", () => {
            const firstGM = game.users?.find(u => u.isGM && u.active);
            if (game.userId !== firstGM?.id) return;
            let linkedTokens = canvas.tokens.placeables.filter(t => !t.document.link)
            for (let token of linkedTokens) {
                let ATLeffects = token.actor?.effects?.filter(entity => !!entity.changes.find(effect => effect.key.includes("ATL")))
                if (ATLeffects?.length > 0) ATL.applyEffects(token.actor, ATLeffects)
            }
        })

        Hooks.on("updateItem", (item, change, options, userId) => {
            if (game.userId !== userId || game.system.id !== "dnd5e" || !item.parent || !change.system) return;
            if ("equipped" in change.system || "attunement" in change.system) {
                let actor = item.parent
                let ATLeffects = actor.effects.filter(entity => !!entity.changes.find(effect => effect.key.includes("ATL")))
                if (ATLeffects.length > 0) ATL.applyEffects(actor, ATLeffects)
            }

        })

        const firstGM = game.users?.find(u => u.isGM && u.active);
        if (game.userId !== firstGM?.id) return;
        let linkedTokens = canvas.tokens.placeables.filter(t => !t.document.link)
        for (let token of linkedTokens) {
            let ATLeffects = token.actor?.effects?.filter(entity => !!entity.changes.find(effect => effect.key.includes("ATL")))
            if (ATLeffects?.length > 0) ATL.applyEffects(token.actor, ATLeffects)
        }
    }

    static async UpdatePresets() {
        let presets = await game.settings.get("ATL", "presets")
        let content = `<div><select name="presets">${presets.reduce((acc, preset) => acc += `<option value = ${preset.id}>${preset.name}</option>`, '')}</select></div>`
        let presetSelector = new Dialog({
            title: "Preset Selector",
            content: `
        <div class="form group">
        <label> Presets: </label>
        ${content}
        </div>`,
            content,
            buttons: {
                one: {
                    label: "Update",
                    icon: `<i class="fas fa-edit"></i>`,
                    callback: (html) => {
                        let updatePreset = html.find("[name=presets]")[0].value;
                        let preset = presets.find(p => p.id === updatePreset)
                        new PresetConfig(preset).render(true);
                    }
                },
                two: {
                    label: "Create Copy",
                    icon: `<i class="fas fa-copy"></i>`,
                    callback: (html) => {
                        let updatePreset = html.find("[name=presets]")[0].value;
                        let preset = presets.find(p => p.id === updatePreset)
                        // copy and remove ID so it's created as new
                        preset = deepClone(preset);
                        delete preset.id;
                        new PresetConfig(preset).render(true);
                    }
                },
                three: {
                    label: "Delete",
                    icon: `<i class="fas fa-trash-alt"></i>`,
                    callback: (html) => {
                        let updatePreset = html.find("[name=presets]")[0].value;
                        let index = presets.findIndex(p => p.id === updatePreset);
                        new Dialog({
                            title: "Conformation",
                            content: `Are you sure you want to remove this preset`,
                            buttons: {
                                one: {
                                    label: "Confirm",
                                    icon: `<i class="fas fa-check"></i>`,
                                    callback: () => {
                                        presets.splice(index, 1);
                                        game.settings.set("ATL", "presets", presets);
                                    }
                                },
                                two: {
                                    label: "Return",
                                    icon: `<i class="fas fa-undo-alt"></i>`,
                                    callback: () => presetSelector.render(true)
                                }
                            }
                        }).render(true)
                    }
                },
                four: {
                    label: "Add New",
                    icon: `<i class="fas fa-plus"></i>`,
                    callback: () => new PresetConfig().render(true)
                }
            }
        });
        presetSelector.render(true)
    }
    static getSceneControlButtons(buttons) {
        let tokenButton = buttons.find(b => b.name == "lighting")

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
    static async applyEffects(entity, effects) {
        if (entity.documentName !== "Actor") return;
        let link = getProperty(entity, "prototypeToken.actorLink")
        if (link === undefined) link = true
        let tokenArray = []
        if (!link) tokenArray = [entity.token?.object]
        else tokenArray = entity.getActiveTokens()
        if (tokenArray === []) return;
        let overrides = {};
        const originals = entity.prototypeToken


        // Organize non-disabled effects by their application priority
        const changes = effects.reduce((changes, e) => {
            if (e.disabled || e.isSuppressed) return changes;
            return changes.concat(e.changes.map(c => {
                c = duplicate(c);
                c.effect = e;
                c.priority = c.priority ?? (c.mode * 10);
                return c;
            }));
        }, []);
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            if (!change.key.includes("ATL")) continue;
            let updateKey = change.key.slice(4)
            if (updateKey === "preset") {
                let presetArray = game.settings.get("ATL", "presets")
                let preset = presetArray.find(i => i.name === change.value)
                if (preset === undefined) {
                    console.error(`ATL: No preset ${change.value} found`)
                    return
                }
                overrides = duplicate(preset);
                const checkString = (element) => typeof element === "string"
                for (const [key, value] of Object.entries(overrides)) {
                    if (value === "") delete overrides[key]
                }
                if ([overrides.dim, overrides.dimSight, overrides.bright, overrides.brightSight].some(checkString)) {
                    ui.notifications.error("ATL: preset string error")
                }
                delete overrides.id
                delete overrides.name
                overrides.angle = parseInt(overrides?.angle) || originals?.angle || 360
                overrides.sightAngle = parseInt(overrides?.sightAngle) || originals?.sightAngle || 360

                for (const [key, value] of Object.entries(overrides)) {
                    let ot = typeof getProperty(originals, key)
                    if (ot === "null" || ot === "undefined") originals[key] = entity.prototypeToken[key]
                }
            } else if (updateKey.startsWith("detectionModes.")) {
                // special handling for Detection Modes
                const parts = updateKey.split(".");
                if (parts.length === 3) {
                    const [_, id, key] = parts;
                    const detectionModes =
                        getProperty(overrides, "detectionModes") ||
                        getProperty(originals, "detectionModes") ||
                        [];                    
                    // find the existing one or create a new one
                    let dm = detectionModes.find(dm => dm.id === id);
                    if (!dm) {
                        dm = { id, enabled: true, range: 0 };
                        detectionModes.push(dm);
                    }
                    // build fake change to handle apply
                    const fakeChange = duplicate(change);
                    fakeChange.key = key;
                    const result = ATL.apply(undefined, fakeChange, undefined, dm[key]);
                    // update
                    if (result !== null) {
                        dm[key] = result;
                        overrides.detectionModes = detectionModes;
                    }
                }
            } else {
                let preValue = getProperty(overrides, updateKey) || getProperty(originals, updateKey)
                let result = ATL.apply(entity, change, originals, preValue);
                if (change.key === "ATL.alpha") result = result * result
                if (result !== null) {
                    let resultTmp;
                    if (updateKey === "light.animation" && typeof result === "string") {
                        try {
                            resultTmp = JSON.parse(result);
                        } catch (e) {
                            // MANAGE STRANGE ERROR FROM USERS
                            var fixedJSON = result

                                // Replace ":" with "@colon@" if it's between double-quotes
                                .replace(/:\s*"([^"]*)"/g, function (match, p1) {
                                    return ': "' + p1.replace(/:/g, '@colon@') + '"';
                                })

                                // Replace ":" with "@colon@" if it's between single-quotes
                                .replace(/:\s*'([^']*)'/g, function (match, p1) {
                                    return ': "' + p1.replace(/:/g, '@colon@') + '"';
                                })

                                // Add double-quotes around any tokens before the remaining ":"
                                .replace(/(['"])?([a-z0-9A-Z_]+)(['"])?\s*:/g, '"$2": ')

                                // Add double-quotes around any tokens after the remaining ":"
                                .replace(/:\s*(['"])?([a-z0-9A-Z_]+)(['"])?/g, ':"$2"')

                                // Turn "@colon@" back into ":"
                                .replace(/@colon@/g, ':');

                            resultTmp = JSON.parse(fixedJSON);
                            for (const [key, value] of Object.entries(resultTmp)) {
                                resultTmp[key] = ATL.switchType(key, value)
                            }
                        }
                    }
                    if (updateKey === "sight.visionMode") {
                        // also update visionMode defaults
                        const visionDefaults = CONFIG.Canvas.visionModes[result]?.vision?.defaults || {};
                        for (let [k, v] of Object.entries(visionDefaults)) overrides[`sight.${k}`] = v;
                    }
                    overrides[updateKey] = resultTmp ? resultTmp : result;
                }
            }
        }
        if (changes.length < 1) overrides = originals
        let updates = duplicate(originals)
        mergeObject(updates, overrides)
        if (entity.prototypeToken.randomImg) delete updates.img
        let updateMap = tokenArray.map(t => mergeObject({ _id: t.id }, updates))
        await canvas.scene.updateEmbeddedDocuments("Token", updateMap)
    }


    static apply(token, change, originals, preValue) {
        const modes = CONST.ACTIVE_EFFECT_MODES;
        switch (change.mode) {
            case modes.ADD:
                return ATL.applyAdd(token, change, originals, preValue);
            case modes.MULTIPLY:
                return ATL.applyMultiply(token, change, originals, preValue);
            case modes.OVERRIDE:
            case modes.CUSTOM:
            case modes.UPGRADE:
            case modes.DOWNGRADE:
                return ATL.applyOverride(token, change, originals, preValue);
        }
    }

    static switchType(key, value) {
        let numeric = ["brightSight", "dimSight", "light.dim", "light.bright", "dim", "bright", "scale", "height", "width", "light.angle", "light.alpha", "rotation", "speed", "intensity"]
        let Boolean = ["mirrorX", "mirrorY", "light.gradual", "vision"]
        if (numeric.includes(key)) return parseFloat(value)
        else if (Boolean.includes(key)) {
            if (value === "true") return true
            if (value === "false") return false
        }
        else return value
    }

    static applyAdd(token, change, originals, current) {
        let { key, value } = change;
        key = key.slice(4)
        value = ATL.switchType(key, value)
        //const current = typeof getProperty(originals, key) === "number" ? getProperty(originals, key) : getProperty(token.data, key) || null;
        const ct = getType(current);
        let update = null;

        // Handle different types of the current data
        switch (ct) {
            case "null":
                update = parseInt(value);
                break;
            case "string":
                update = current + String(value);
                break;
            case "number":
                if (Number.isNumeric(value)) update = current + Number(value);
                break;
            case "Array":
                if (!current.length || (getType(value) === getType(current[0]))) update = current.concat([value]);
        }
        return update;
    }

    static applyMultiply(token, change, originals, current) {
        let { key, value } = change;
        key = key.slice(4)
        value = ATL.switchType(key, value)

        //const current = typeof getProperty(originals, key) === "number" ? getProperty(originals, key) : getProperty(token.data, key) || null;
        if ((typeof (current) !== "number") || (typeof (value) !== "number")) return null;
        const update = current * value;
        return update;
    }

    static applyOverride(token, change, originals, current) {
        let { key, value, mode } = change;
        key = key.slice(4)
        value = ATL.switchType(key, value)
        // current = typeof getProperty(originals, key) === "number" ? getProperty(originals, key) : getProperty(token.data, key) || null;
        if (mode === CONST.ACTIVE_EFFECT_MODES.UPGRADE) {
            if ((typeof (current) === "number") && (current >= Number(value))) return null;
        }
        if (mode === CONST.ACTIVE_EFFECT_MODES.DOWNGRADE) {
            if ((typeof (current) === "number") && (current < Number(value))) return null;
        }
        if (typeof current === "number") return Number(value);
        return value;
    }
}

window.ATLUpdate = ATLUpdate

Hooks.on('init', ATL.init);
Hooks.on('ready', ATL.ready)
Hooks.on('getSceneControlButtons', ATL.getSceneControlButtons)
