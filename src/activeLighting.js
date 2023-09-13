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
        const newTransferral = game.release.generation >= 11 && !CONFIG.ActiveEffect.legacyTransferral;
        const getEffects = (actor) => {
            if (!actor) return [];
            // get the "active" effects on the actor
            let effects;
            if (newTransferral) effects = actor.appliedEffects;
            else if (game.system.id === "wfrp4e")
              effects = actor.actorEffects.filter((e) => !e.disabled && !e.isSuppressed);
            else effects = actor.effects.filter((e) => !e.disabled && !e.isSuppressed);
            // only return effects that have some ATL changes in them
            return effects.filter(e => e.changes.some(c => c.key.startsWith("ATL.")));
        };

        Hooks.on("updateActiveEffect", async (effect, change, options, userId) => {
            // same user
            if (game.userId !== userId) return;
            // check that the effect is on an actor or an embedded item (for new transferral)
            let actor;
            if (effect.parent instanceof Actor) actor = effect.parent;
            else if (newTransferral && effect.parent?.parent instanceof Actor)
                actor = effect.parent.parent;
            else return;
            // apply the effects
            let ATLeffects = getEffects(actor);
            ATL.applyEffects(actor, ATLeffects);
        })

        Hooks.on("createActiveEffect", async (effect, options, userId) => {
            // same user and effect is active
            if (game.userId !== userId || effect.disabled || effect.isSuppressed) return;
            // check that the effect is on an actor or an embedded item (for new transferral)
            let actor;
            if (effect.parent instanceof Actor) actor = effect.parent;
            else if (newTransferral && effect.parent?.parent instanceof Actor)
                actor = effect.parent.parent;
            else return;
            // there's at least one ATL-related effect
            if (!effect.changes?.some(c => c.key.startsWith("ATL."))) return;
            // apply the effects
            let ATLeffects = getEffects(actor);
            ATL.applyEffects(actor, ATLeffects);
        })

        Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
            // same user and effect is active
            if (game.userId !== userId || effect.disabled || effect.isSuppressed) return;
            // check that the effect is on an actor or an embedded item (for new transferral)
            let actor;
            if (effect.parent instanceof Actor) actor = effect.parent;
            else if (newTransferral && effect.parent?.parent instanceof Actor)
                actor = effect.parent.parent;
            else return;
            // there's at least one ATL-related effect
            if (!effect.changes?.some(c => c.key.startsWith("ATL."))) return;
            // apply the effects
            let ATLeffects = getEffects(actor);
            ATL.applyEffects(actor, ATLeffects);
        })

        Hooks.on("createToken", (doc, options, userId) => {
            if (game.userId !== userId) return;
            let ATLeffects = getEffects(doc.actor)
            if (ATLeffects.length > 0) ATL.applyEffects(doc.actor, ATLeffects)
        })

        Hooks.on("canvasReady", () => {
            const firstGM = game.users?.find(u => u.isGM && u.active);
            if (game.userId !== firstGM?.id) return;
            let linkedTokens = canvas.tokens.placeables.filter(t => !t.document.link)
            for (let token of linkedTokens) {
                let ATLeffects = getEffects(token.actor)
                if (ATLeffects.length > 0) ATL.applyEffects(token.actor, ATLeffects)
            }
        })

        Hooks.on("updateItem", (item, change, options, userId) => {
            if (game.userId !== userId || !item.parent) return;
            if ((game.system.id === "dnd5e" && (hasProperty(change, "system.equipped") || hasProperty(change, "system.attunement")))
                || (game.system.id === "wfrp4e" && hasProperty(change, "system.worn.value"))
                || (game.system.id === "swade" && hasProperty(change, "system.equipStatus"))) {
                let actor = item.parent
                let ATLeffects = getEffects(actor)
                ATL.applyEffects(actor, ATLeffects)
            }
        })

        // only register these hooks for v11's new transferral mode
        if (newTransferral) {
            const createDeleteItem = (item, options, userId) => {
                // same user and it's an item on an actor
                if (game.userId !== userId || !(item.parent instanceof Actor)) return;
                // there's at least one ATL-related effect
                if (!item.effects.some(e => e.changes.some(c => c.key.startsWith("ATL.")))) return;
                // apply the effects
                const actor = item.parent;
                ATL.applyEffects(actor, actor.appliedEffects);
            };
            Hooks.on("createItem", createDeleteItem);
            Hooks.on("deleteItem", createDeleteItem);
        }

        const firstGM = game.users?.find(u => u.isGM && u.active);
        if (game.userId !== firstGM?.id) return;
        let linkedTokens = canvas.tokens.placeables.filter(t => !t.document.link)
        for (let token of linkedTokens) {
            let ATLeffects = getEffects(token.actor)
            if (ATLeffects.length > 0) ATL.applyEffects(token.actor, ATLeffects)
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

        for (const token of tokenArray) {
            let originalDelta = token.document.flags.ATL?.originals || {};
            const originals = mergeObject(token.document.toObject(), originalDelta);
            let overrides = {};

            // helper function to apply to overrides and originalDelta
            const applyOverride = (key, value, preValue) => {
                setProperty(overrides, key, value);
                if (!hasProperty(originalDelta, key)) setProperty(originalDelta, key, preValue);
            };

            // Apply all changes
            for (let change of changes) {
                if (!change.key.includes("ATL")) continue;
                let updateKey = change.key.slice(4)
                if (updateKey === "preset") {
                    // get the matching preset
                    let presetArray = game.settings.get("ATL", "presets")
                    let preset = presetArray.find(i => i.name === change.value)
                    if (!preset) {
                        console.error(`ATL: No preset ${change.value} found`)
                        continue;
                    }
                    preset = flattenObject(preset);
                    // validate preset data
                    for (const [key, value] of Object.entries(preset)) {
                        if (value === "" || value === undefined || value === null) delete preset[key];
                    }
                    const checkString = (element) => typeof element === "string"
                    if ([preset["light.dim"], preset["light.bright"], preset["sight.range"]].some(checkString)) {
                        ui.notifications.error("ATL: preset string error")
                    }
                    if ("sight.angle" in preset) preset["sight.angle"] = parseInt(preset["sight.angle"]);
                    if ("light.angle" in preset) preset["light.angle"] = parseInt(preset["light.angle"]);
                    // remove preset-specific properties
                    delete preset.id
                    delete preset.name
                    console.log("ATE | apply preset", change.value, preset);
                    Object.entries(preset)
                        .forEach(([key, value]) => {
                            const originalValue = getProperty(originals, key);
                            applyOverride(key, value, originalValue);
                        });
                } else if (updateKey.startsWith("detectionModes.")) {
                    // special handling for Detection Modes
                    const parts = updateKey.split(".");
                    if (parts.length === 3) {
                        const [_, id, key] = parts;
                        const detectionModes =
                            getProperty(overrides, "detectionModes") ||
                            duplicate(getProperty(originals, "detectionModes")) ||
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
                            const preValue = getProperty(originals, "detectionModes") || [];
                            applyOverride("detectionModes", detectionModes, preValue);
                        }
                    }
                } else {
                    let preValue = getProperty(overrides, updateKey) || getProperty(originals, updateKey)
                    let result = ATL.apply(entity, change, originals, preValue);
                    if (change.key === "ATL.alpha") result = result * result
                    if (result !== null) {
                        if (updateKey === "light.animation" && typeof result === "string") {
                            let resultTmp;
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
                            // update each key separately to save the original correctly
                            for (let [k, v] of Object.entries(resultTmp)) {
                                const key = `${updateKey}.${k}`;
                                const preValue = getProperty(originals, key);
                                applyOverride(key, v, preValue);
                            }
                        }
                        else if (updateKey === "sight.visionMode") {
                            // do normal update
                            applyOverride(updateKey, result, preValue);
                            // also update visionMode defaults
                            const visionDefaults = CONFIG.Canvas.visionModes[result]?.vision?.defaults || {};
                            for (let [k, v] of Object.entries(visionDefaults)) {
                                const key = `sight.${k}`;
                                const preValue = getProperty(originals, key);
                                applyOverride(key, v, preValue);
                            };
                        }
                        else
                            applyOverride(updateKey, result, preValue);
                    }
                }
            }

            // add originals flag to the update
            overrides["flags.ATL.originals"] = originalDelta;
            overrides = flattenObject(overrides);
            // figure out what changes were removed (i.e. those in originalDelta but not in overrides)
            const removeDelta = (key) => {
                const head = key.split(".");
                const tail = `-=${head.pop()}`;
                key = ["flags", "ATL", "originals", ...head, tail].join(".");
                overrides[key] = null;
            };
            for (const [key, value] of Object.entries(flattenObject(originalDelta))) {
                if (!(key in overrides)) {
                    overrides[key] = value;
                    delete overrides[`flags.ATL.originals.${key}`];
                    removeDelta(key);
                }
            }
            // update the token document
            console.log("ATE | Going to update token", token.document.id, overrides);
            await token.document.update(overrides);
        }
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
