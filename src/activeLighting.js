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
                dim: 60,
                bright: 30,
                color: "#a2642a",
                animation: {
                    'type': 'torch',
                    'speed': 1,
                    'intensity': 1
                },
                alpha: 0.4,
                id: "ATLPresetLantern"

            },
            {
                name: "candle",
                dim: 10,
                bright: 2,
                color: "#a2642a",
                animation: {
                    'type': 'torch',
                    'speed': 1,
                    'intensity': 1
                },
                alpha: 0.2,
                id: "ATLPresetCandle"

            },
            {
                name: "flashlight",
                dim: 60,
                bright: 30,
                color: "#8bfdf6",
                alpha: 0.3,
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
    static ready() {
        const gm = game.user === game.users.find((u) => u.isGM && u.active)

        Hooks.on("updateActiveEffect", async (effect, options) => {
            if (!gm) return;
            if (!effect.data.changes?.find(effect => effect.key.includes("ATL"))) return;
            let totalEffects = effect.parent.effects.contents.filter(i => !i.data.disabled)
            let ATLeffects = totalEffects.filter(entity => !!entity.data.changes.find(effect => effect.key.includes("ATL")))
            if (effect.data.disabled) ATLeffects.push(effect)
            if (ATLeffects.length > 0) ATL.applyEffects(effect.parent, ATLeffects)
        })

        Hooks.on("createActiveEffect", async (effect, options) => {
            if (!gm) return;
            if (!effect.data.changes?.find(effect => effect.key.includes("ATL"))) return;
            const totalEffects = effect.parent.effects.contents.filter(i => !i.data.disabled)
            let ATLeffects = totalEffects.filter(entity => !!entity.data.changes.find(effect => effect.key.includes("ATL")))
            if (ATLeffects.length > 0) ATL.applyEffects(effect.parent, ATLeffects)
        })

        Hooks.on("deleteActiveEffect", async (effect, options) => {
            if (!gm) return;
            if (!effect.data.changes?.find(effect => effect.key.includes("ATL"))) return;
            let ATLeffects = effect.parent.effects.filter(entity => !!entity.data.changes.find(effect => effect.key.includes("ATL")))
            ATL.applyEffects(effect.parent, ATLeffects)

        })
    }

    static AddPreset(name, object) {
        if (!name) {
            ui.notifications.error("Please provide a name for the preset")
            return;
        }
        if (!object) {
            ui.notifications.error("Please provide data for the preset")
            return;
        }
        let presets = game.settings.get("ATL", "presets");
        let duplicate = presets.find(i => i.name === object.name)
        if (duplicate) {
            let index = presets.indexOf(duplicate)
            if (index > -1) {
                presets.splice(index, 1)
            }
            presets.push(object)
            new Dialog({
                content: `${object.name} is already a preset, confirm overwrite`,
                buttons: {
                    one: {
                        label: "OK",
                        callback: () => {
                            game.settings.set("ATL", "presets", presets)
                        }
                    },
                    two: {
                        label: "Return"
                    }
                }
            }).render(true)
        }
        else {
            presets.push(object)
            game.settings.set("ATL", "presets", presets)
        }
    }
    static RemovePreset(name) {
        if (!name) {
            ui.notifications.error("Please provide a name for the preset")
            return;
        }
        let presets = game.settings.get("ATL", "presets");
        let removePreset = presets.find(i => i.name === name)
        if (!removePreset) {
            ui.notifications.error("No preset with that name exists")
            return;
        }
        let index = presets.indexOf(removePreset)
        if (index > -1) {
            presets.splice(index, 1)
            ui.notifications.notify(`${removePreset.name} was removed from the presets`)
        }
        game.settings.set("ATL", "presets", presets)
    }

    static GeneratePreset(preset, copy) {

        let { light, dimSight, brightSight, sightAngle, name, height, width, scale, id } = preset ? preset : 0
        let { dim, bright, color, animation, alpha, angle, coloration, contrast, gradual, luminosity, saturation, shadows } = light ? light : 0
        switch (copy) {
            case true: name = `${name} (copy)`;
                break;
            case false: name = name;
                break;
            default: name = ""

        }
        if (height === undefined) height = "";
        if (width === undefined) width = "";
        if (scale === undefined) scale = "";
        if (dim === undefined) dim = "";
        if (bright === undefined) bright = ""
        if (dimSight === undefined) dimSight = ""
        if (brightSight === undefined) brightSight = ""
        if (sightAngle === undefined) sightAngle = ""
        if (color === undefined) color = ""
        if (angle === undefined) angle = ""
        if (alpha === undefined) alpha = ""
        if (animation === undefined) animation = {}
        if (coloration === undefined) coloration = ""
        if (contrast === undefined) contrast = ""
        if (gradual === undefined) gradual = false
        if (luminosity === undefined) luminosity = ""
        if (saturation === undefined) saturation = ""
        if (shadows === undefined) shadows = ""


        let colorationTypes = ``
        for (let [k, v] of Object.entries(AdaptiveLightingShader.COLORATION_TECHNIQUES)) {
            let name = game.i18n.localize(v.label)
            colorationTypes += `<option value="${v.id}" ${coloration === v.id ? "selected" : ""}>${name}</option>`;
        }

        let lightTypes = `<option selected value="none"> None</option>`
        for (let [k, v] of Object.entries(CONFIG.Canvas.lightAnimations)) {
            let name = game.i18n.localize(v.label)
            lightTypes += `<option value="${k.toLocaleLowerCase()}" ${animation.type === k ? "selected" : ""}>${name}</option>`;
        }

        if (game.modules.get("CommunityLighting")?.active) {
            lightTypes += `
            <optgroup label= "Blitz" id="animationType">
            <option value="BlitzFader" ${animation.type === "BlitzFader" ? 'selected' : ''}>Fader</option>
            <option value="BlitzLightning" ${animation.type === "BlitzLightning" ? 'selected' : ''}>Lightning (expirmental)</option>
            <option value="BlitzElectric Fault" ${animation.type === "BlitzElectric Fault" ? 'selected' : ''}>Electrical Fault</option>
            <option value="BlitzSimple Flash" ${animation.type === "BlitzSimple Flash" ? 'selected' : ''}>Simple Flash</option>
            <option value="BlitzRBG Flash" ${animation.type === "BlitzRBG Flash" ? 'selected' : ''}>RGB Flash</option>
            <option value="BlitzPolice Flash" ${animation.type === "BlitzPolice Flash" ? 'selected' : ''}>Police Flash</option>
            <option value="BlitzStatic Blur" ${animation.type === "BlitzStatic Blur" ? 'selected' : ''}> Static Blur</option>
            <option value="BlitzAlternate Torch" ${animation.type === "BlitzAlternate Torch" ? 'selected' : ''}>Alternate Torch</option>
            <option value="BlitzBlurred Torch" ${animation.type === "BlitzBlurred Torch" ? 'selected' : ''}>Blurred Torch</option>
            <option value="BlitzGrid Force-Field Colorshift" ${animation.type === "BlitzGrid Force-Field Colorshift" ? 'selected' : ''}>Grid Force-Field Colorshift</option>
            </optgroup>
            <optgroup label="SecretFire" id="animationType">
            <option value="SecretFireGrid Force-Field" ${animation.type === "SecretFireGrid Force-Field" ? 'selected' : ''}>Grid Force-Field</option>
            <option value="SecretFireSmoke Patch" ${animation.type === "SecretFireSmoke Patch" ? 'selected' : ''}>Smoke Patch</option>
            <option value="SecretFireStar Light" ${animation.type === "SecretFireStar Light" ? 'selected' : ''}>Star Light</option>
            <option value="SecretFireStar Light Disco" ${animation.type === "SecretFireStar Light Disco" ? 'selected' : ''}>Star Light Disco</option>
            </optgroup>
        `
        }

        let dialogContent = `
        <form>
            <div class="form-group">
                <label>Preset Name</label>
                <input id="name" name="${id}" type="text" value="${name}"></input>
            </div>
            <h3>Token Data</h3>
            <div class="form-group slim ATL-sub-group">
                <label>Size</label>
                <div class="form-fields">
                        <label>Height</label>
                        <input id="height" name="height" type="number" value="${height}"></input>
                        <label>Width</label>
                        <input id="width" name="width" type="number" value="${width}"></input>
                        <label>Scale</label>
                        <input id="scale" name="scale" type="number" value="${scale}"></input>
                        
                </div>
            </div>
            <div class="form-group slim ATL-sub-group">
                <label>Vision</label>
                <div class="form-fields">
                        <label>Dim</label>
                        <input id="dimSight" name="dimSight" type="number" value="${dimSight}"></input>
                        <label>Bright</label>
                        <input id="brightSight" name="brightSight" type="number" value="${brightSight}"></input>
                </div>
            </div>
            <div class="form-group slim ATL-sub-group">
            <label>Vision Angle</label>
                <div class="form-fields">
                    <input id="sightAngle" name="sightAngle" type="number" min="0" max="360" step="1" value="${sightAngle}"></input>
                </div>
            </div>
            <h3>Lighting</h3>
            <div class="form-group slim ATL-sub-group">
                <label>Light Radius</label>
                <div class="form-fields ">
                        <label>Dim</label>
                        <input id="dim" name="dim" type="number" value="${dim}"></input>
                        <label>Bright</label>
                        <input id="bright" name="bright" type="number" value="${bright}"></input>
                </div>
            </div>
            <div class="form-group slim ATL-sub-group">
                <label>Emission Angle</label>
                <div class="form-fields">
                    <input id="angle" name="angle" type="number" min="0" max="360" step="1" value="${angle}"></input>
                </div>
            </div>
            <div class="form-group slim ATL-sub-group">
                <label for="color">Light Color</label>
                <input type="color" id="color" name="color" value="${color}">
            </div>
            <div class="form-group slim ATL-sub-group">
            <label>Color Intensity</label>
                <div class="form-fields">
                    <input id="alpha" name="alpha" type="number" min="0" max="1" placeholder="0-1" value="${alpha}"></input>
                </div>
            </div>
            <h3>Animation</h3>
            <div class="form-group ATL-sub-group">
                <label>Animation Type</label>
                <div class="form-fields">
                    <select id="animationType" name="animationType" >${lightTypes}</select>
                </div>
            </div>
            <div class="form-group ATL-sub-group" ">
                <label>Animation Speed</label>
                <div class="form-fields">
                    <input id="animationSpeed" name="animationSpeed" type="range" min="1" max="10" step="1" value="${animation?.speed}"></input>
                </div>
            </div>
            <div class="form-group ATL-sub-group">
                <label>Reverse Direction</label>
                <div class="form-fields">
                    <input type="checkbox" id="animationReverse" name="animationReverse" ${animation?.reverse ? "checked" : ""} >
                </div>
            </div>
            <div class="form-group ATL-sub-group">
                <label>Animation Intensity</label>
                <div class="form-fields">
                    <input id="animationIntensity" name="animationIntensity" type="range" min="1" max="10" step="1" value="${animation?.intensity}"></input>
                </div>
            </div>
            <h3>Advanced Animation</h3>
            <div class="form-group ATL-sub-group">
                <label>Coloration Technique</label>
                <div class="form-fields">
                    <select id="lightColoration" name="lightColoration" data-dtype="Number">
                    ${colorationTypes}
                    </select>
                </div>
            </div>
    
            <div class="form-group ATL-sub-group">
                <label>Luminosity</label>
                <div class="form-fields">
                    <input type="range" id="lightLuminosity" name="lightLuminosity" value="${luminosity}" min="-1" max="1" step="0.05">
         <span class="range-value">0.5</span>
                </div>
            </div>
    
            <div class="form-group ATL-sub-group">
                <label>Gradual Illumination</label>
                <div class="form-fields">
                    <input type="checkbox" id="lightGradual" name="lightGradual" ${gradual ? "checked" : ""}>
                </div>
            </div>
    
            <div class="form-group ATL-sub-group">
                <label>Background Saturation</label>
                <div class="form-fields">
                    <input type="range" id="lightSaturation" name="lightSaturation" value="${saturation}" min="-1" max="1" step="0.05">
                </div>
            </div>
    
            <div class="form-group ATL-sub-group">
                <label>Background Contrast</label>
                <div class="form-fields">
                    <input type="range" id="lightContrast" name="lightContrast" value="${contrast}" min="-1" max="1" step="0.05">
                </div>
            </div>
    
            <div class="form-group ATL-sub-group">
                <label>Background Shadows</label>
                <div class="form-fields">
                    <input type="range" id="lightShadows" name="lightShadows" value="${shadows}" min="0" max="1" step="0.05">
                </div>
            </div>

                `;


        new Dialog({
            title: "ATL Light Editor",
            content: dialogContent,
            buttons: {
                one: {
                    label: "Add Preset",
                    icon: `<i class="fas fa-check"></i>`,
                    callback: async (html) => {
                        let id = html.find("#name")[0].name || randomID()
                        let name = html.find("#name")[0].value
                        let height = await ATL.checkString(html.find("#height")[0].value)
                        let width = await ATL.checkString(html.find("#width")[0].value)
                        let scale = await ATL.checkString(html.find("#scale")[0].value)
                        let dim = await ATL.checkString(html.find("#dim")[0].value)
                        let bright = await ATL.checkString(html.find("#bright")[0].value)
                        let dimSight = await ATL.checkString(html.find("#dimSight")[0].value)
                        let brightSight = await ATL.checkString(html.find("#brightSight")[0].value)
                        let color = html.find("#color")[0].value
                        let sightAngle = await ATL.checkString(html.find("#sightAngle")[0].value)
                        let alpha = await ATL.checkString(html.find("#alpha")[0].value)
                        let angle = await ATL.checkString(html.find("#angle")[0].value)
                        let animationType = html.find("#animationType")[0].value
                        let animationSpeed = await ATL.checkString(html.find("#animationSpeed")[0].value)
                        let animationIntensity = await ATL.checkString(html.find("#animationIntensity")[0].value)
                        let animationReverse = html.find("#animationIntensity").is(":checked")
                        let coloration = await ATL.checkString(html.find("#lightColoration")[0].value)
                        let luminosity = await ATL.checkString(html.find("#lightLuminosity")[0].value)
                        let gradual = html.find("#lightGradual").is(":checked")
                        let saturation = await ATL.checkString(html.find("#lightSaturation")[0].value)
                        let contrast = await ATL.checkString(html.find("#lightContrast")[0].value)
                        let shadows = await ATL.checkString(html.find("#lightShadows")[0].value)

                        let object = {
                            name: name,
                            height: height,
                            width: width,
                            scale: scale,
                            light: {
                                dim: dim,
                                bright: bright,
                                color: color,
                                animation: {
                                    'type': animationType,
                                    'speed': animationSpeed,
                                    'intensity': animationIntensity,
                                    'reverse': animationReverse
                                },
                                alpha: alpha,
                                angle: angle,
                                coloration: coloration,
                                luminosity: luminosity,
                                gradual: gradual,
                                saturation: saturation,
                                contrast: contrast,
                                shadows: shadows,
                            },
                            dimSight: dimSight,
                            brightSight: brightSight,
                            sightAngle: sightAngle,

                            id: id
                        }
                        let final = Object.fromEntries(Object.entries(object).filter(([_, v]) => v != ""));

                        ATL.AddPreset(name, final)
                    }
                },
                two: {
                    label: "Cancel",
                    icon: `<i class="fas fa-undo-alt"></i>`,
                }
            }

        }).render(true)

    }

    static async checkString(value) {
        if (value === "") return ""
        else return Number(value)
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
                        ATL.GeneratePreset(preset, false)
                    }
                },
                two: {
                    label: "Create Copy",
                    icon: `<i class="fas fa-copy"></i>`,
                    callback: (html) => {
                        let updatePreset = html.find("[name=presets]")[0].value;
                        let preset = presets.find(p => p.id === updatePreset)
                        ATL.GeneratePreset(preset, true)
                    }
                },
                three: {
                    label: "Delete",
                    icon: `<i class="fas fa-trash-alt"></i>`,
                    callback: (html) => {
                        let updatePreset = html.find("[name=presets]")[0].value;
                        let preset = presets.find(p => p.id === updatePreset)
                        let index = presets.indexOf(preset)
                        let alteredPresets = presets.splice(index, 1)
                        new Dialog({
                            title: "Conformation",
                            content: `Are you sure you want to remove this preset`,
                            buttons: {
                                one: {
                                    label: "Confirm",
                                    icon: `<i class="fas fa-check"></i>`,
                                    callback: () => {
                                        game.settings.set("ATL", "presets", presets)
                                    }
                                },
                                two: {
                                    label: "Return",
                                    icon: `<i class="fas fa-undo-alt"></i>`,
                                    callback: presetSelector
                                }
                            }
                        }).render(true)
                    }
                },
                four: {
                    label: "Add New",
                    icon: `<i class="fas fa-plus"></i>`,
                    callback: () => {

                        ATL.GeneratePreset()
                    }
                }
            }
        }).render(true)
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
        if(entity.documentName !== "Actor") return;
        let link = getProperty(entity, "data.token.actorLink")
        if (link === undefined) link = true
        let tokenArray = []
        if (!link) tokenArray = [entity.token?.object]
        else tokenArray = entity.getActiveTokens()
        if (tokenArray === []) return;
        let overrides = {};
        const originals = link ? (await entity.getFlag("ATL", "originals") || {}) : (await entity.token.getFlag("ATL", "originals") || {});


        // Organize non-disabled effects by their application priority
        const changes = effects.reduce((changes, e) => {
            if (e.data.disabled) return changes;
            return changes.concat(e.data.changes.map(c => {
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
                    if (ot === "null" || ot === "undefined") originals[key] = entity.data.token[key]
                }
            }
            else {
                let preValueOriginal = (overrides[updateKey] ? overrides[updateKey] : getProperty(originals, updateKey));
                let preValue = null;
                // Manage the false positive given from the 0 number value is detected like a 'false' from standard ecmascript
                // and set the 'null' value instead the '0' value
                if(typeof preValueOriginal === 'number' || !isNaN(preValueOriginal)) {
                    preValue = getProperty(originals, updateKey) != null && getProperty(originals, updateKey) != undefined
                        ? getProperty(originals, updateKey) 
                        : getProperty(entity, `data.token.${updateKey}`);
                    if(preValue != null && preValue != undefined && isNaN(preValue)){
                        preValue = Number(preValue);
                    }
                } else {
                    preValue = preValueOriginal 
                        ? getProperty(originals, updateKey) 
                        : getProperty(entity, `data.token.${updateKey}`)  ? getProperty(entity, `data.token.${updateKey}`) : null;
                }
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
                        }
                    }
                    overrides[updateKey] = resultTmp ? resultTmp : result;
                    let ot = typeof getProperty(originals, updateKey)
                    if (ot === "null" || ot === "undefined") {
                        originals[updateKey] = getProperty(entity.data.token, updateKey);
                    }
                }
            }
        }

        if (changes.length < 1) overrides = originals


        // Expand the set of final overrides
        for (let eachToken of tokenArray) {
            let updates = duplicate(originals)
            Object.assign(updates, overrides)
            await eachToken.document.update(updates)
        }
        //update actor token
        let updatedToken = Object.assign(entity.data.token, overrides)
        if (link) await entity.setFlag("ATL", "originals", originals)
        else await entity.token.setFlag("ATL", "originals", originals)
        await entity.update({ token: updatedToken })
    }


    static apply(token, change, originals, preValue) {
        const modes = CONST.ACTIVE_EFFECT_MODES;
        switch (change.mode) {
            case modes.CUSTOM:
                return ATL.applyCustom(token, change, originals, preValue);
            case modes.ADD:
                return ATL.applyAdd(token, change, originals, preValue);
            case modes.MULTIPLY:
                return ATL.applyMultiply(token, change, originals, preValue);
            case modes.OVERRIDE:
            case modes.UPGRADE:
            case modes.DOWNGRADE:
                return ATL.applyOverride(token, change, originals, preValue);
        }
    }

    static switchType(key, value) {
        let numeric = ["light.dim", "light.bright", "dim", "bright", "scale", "height", "width", "light.angle", "light.alpha", "rotation"]
        let Boolean = ["mirrorX", "mirrorY"]
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
Hooks.on("ready", ATLUpdate.runUpdates)
