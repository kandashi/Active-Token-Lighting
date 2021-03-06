class ATL {

    static init() {
        let defaultPresets = [
            {
                name: "torch",
                dimLight: 40,
                brightLight: 20,
                lightColor: "#a2642a",
                lightAnimation: {
                    'type': 'torch',
                    'speed': 1,
                    'intensity': 1
                },
                lightAlpha: 0.4,
                id: "ATLPresetTorch"
            },
            {
                name: "lantern",
                dimLight: 60,
                brightLight: 30,
                lightColor: "#a2642a",
                lightAnimation: {
                    'type': 'torch',
                    'speed': 1,
                    'intensity': 1
                },
                lightAlpha: 0.4,
                id: "ATLPresetLantern"

            },
            {
                name: "candle",
                dimLight: 10,
                brightLight: 2,
                lightColor: "#a2642a",
                lightAnimation: {
                    'type': 'torch',
                    'speed': 1,
                    'intensity': 1
                },
                lightAlpha: 0.2,
                id: "ATLPresetCandle"

            },
            {
                name: "flashlight",
                dimLight: 60,
                brightLight: 30,
                lightColor: "#8bfdf6",
                lightAlpha: 0.3,
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

        let { dimLight, brightLight, dimSight, brightSight, sightAngle, lightColor, lightAnimation, lightAlpha, lightAngle, name } = preset ? preset : 0
        switch (copy) {
            case true: name = `${name} (copy)`;
                break;
            case false: name = name;
                break;
            default: name = ""
        }
        if (dimLight === undefined) dimLight = "";
        if (brightLight === undefined) brightLight = ""
        if (dimSight === undefined) dimSight = ""
        if (brightSight === undefined) brightSight = ""
        if (sightAngle === undefined) sightAngle = ""
        if (lightColor === undefined) lightColor = ""
        if (lightAngle === undefined) lightAngle = ""
        if (lightAlpha === undefined) lightAlpha = ""
        if (lightAnimation === undefined) lightAnimation = {}


        let lightTypes = `<option selected value="none"> None</option>
        <option value="torch" ${lightAnimation.type === "torch" ? 'selected' : ''}> Torch</option>
        <option value="pulse" ${lightAnimation.type === "pulse" ? 'selected' : ''}> Pulse</option>
        <option value="chroma" ${lightAnimation.type === "chroma" ? 'selected' : ''}> Chroma</option>
        <option value="wave" ${lightAnimation.type === "wave" ? 'selected' : ''}> Pulsing Wave</option>
        <option value="fog" ${lightAnimation.type === "fog" ? 'selected' : ''}> Swirling Fog</option>
        <option value="sunburst" ${lightAnimation.type === "sunburst" ? 'selected' : ''}> Sunburst</option>
        <option value="dome" ${lightAnimation.type === "dome" ? 'selected' : ''}> Light Dome</option>
        <option value="emanation" ${lightAnimation.type === "emanation" ? 'selected' : ''}> Mysterious Emanation</option>
        <option value="hexa" ${lightAnimation.type === "hexa" ? 'selected' : ''}>  Hexa Dome</option>
        <option value="ghost" ${lightAnimation.type === "ghost" ? 'selected' : ''}> Ghostly Light</option>
        <option value="energy" ${lightAnimation.type === "energy" ? 'selected' : ''}> Energy Field</option>
        <option value="roiling" ${lightAnimation.type === "roiling" ? 'selected' : ''}> Roiling Mass (Darkness)</option>
        <option value="hole" ${lightAnimation.type === "hole" ? 'selected' : ''}> Black Hole (Darkness)</option>`


        if (game.modules.get("CommunityLighting")?.active) {
            lightTypes += `
            <optgroup label= "Blitz" id="animationType">
            <option value="BlitzFader" ${lightAnimation.type === "BlitzFader" ? 'selected' : ''}>Fader</option>
            <option value="BlitzLightning" ${lightAnimation.type === "BlitzLightning" ? 'selected' : ''}>Lightning (expirmental)</option>
            <option value="BlitzElectric Fault" ${lightAnimation.type === "BlitzElectric Fault" ? 'selected' : ''}>Electrical Fault</option>
            <option value="BlitzSimple Flash" ${lightAnimation.type === "BlitzSimple Flash" ? 'selected' : ''}>Simple Flash</option>
            <option value="BlitzRBG Flash" ${lightAnimation.type === "BlitzRBG Flash" ? 'selected' : ''}>RGB Flash</option>
            <option value="BlitzPolice Flash" ${lightAnimation.type === "BlitzPolice Flash" ? 'selected' : ''}>Police Flash</option>
            <option value="BlitzStatic Blur" ${lightAnimation.type === "BlitzStatic Blur" ? 'selected' : ''}> Static Blur</option>
            <option value="BlitzAlternate Torch" ${lightAnimation.type === "BlitzAlternate Torch" ? 'selected' : ''}>Alternate Torch</option>
            <option value="BlitzBlurred Torch" ${lightAnimation.type === "BlitzBlurred Torch" ? 'selected' : ''}>Blurred Torch</option>
            <option value="BlitzGrid Force-Field Colorshift" ${lightAnimation.type === "BlitzGrid Force-Field Colorshift" ? 'selected' : ''}>Grid Force-Field Colorshift</option>
            </optgroup>
            <optgroup label="SecretFire" id="animationType">
            <option value="SecretFireGrid Force-Field" ${lightAnimation.type === "SecretFireGrid Force-Field" ? 'selected' : ''}>Grid Force-Field</option>
            <option value="SecretFireSmoke Patch" ${lightAnimation.type === "SecretFireSmoke Patch" ? 'selected' : ''}>Smoke Patch</option>
            <option value="SecretFireStar Light" ${lightAnimation.type === "SecretFireStar Light" ? 'selected' : ''}>Star Light</option>
            <option value="SecretFireStar Light Disco" ${lightAnimation.type === "SecretFireStar Light Disco" ? 'selected' : ''}>Star Light Disco</option>
            </optgroup>
        `
        }

        let dialogContent = `
        <form>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
           
                    <label for="name"> Preset Name: </label>
                    <input id="name" name="name" type="text" value="${name}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">

                    <label for="dimLight"> Dim Light: </label>
                    <input id="dimLight" name="dimLight" type="number" value="${dimLight}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="brightLight"> Bright Light: </label>
                    <input id="brightLight" name="brightLight" type="number" value="${brightLight}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="dimSight"> Dim Sight: </label>
                    <input id="dimSight" name="dimSight" type="number" value="${dimSight}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="brightSight"> Bright Sight: </label>
                    <input id="brightSight" name="brightSight" type="number" value="${brightSight}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="lightAngle"> Light Angle: </label>
                    <input id="lightAngle" name="lightAngle" type="number" min="0" max="360" step="1" value="${lightAngle}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="sightAngle"> Sight Angle: </label>
                    <input id="sightAngle" name="sightAngle" type="number" min="0" max="360" step="1" value="${sightAngle}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                <label for="lightAlpha"> Light Intensity: </label>
                <input id="lightAlpha" name="lightAlpha" type="number" min="0" max="1" placeholder="0-1" value="${lightAlpha}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                <label for="lightColor"> Light Color: </label>
                <input type="color" id="lightColor" name="lightColor" value="${lightColor}">
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                <label for="animationType"> Animation Type: </label>
                <select id="animationType" name="animationType" >
                    ${lightTypes}
                </select>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="animationSpeed"> Animation Speed: </label>
                    <input id="animationSpeed" name="animationSpeed" type="range" min="1" max="10" step="1" value="${lightAnimation?.speed}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="animationIntensity"> Animation Intensity: </label>
                    <input id="animationIntensity" name="animationIntensity" type="range" min="1" max="10" step="1" value="${lightAnimation?.intensity}"></input>
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
                        let id = randomID()
                        let name = html.find("#name")[0].value
                        let dimLight = await ATL.checkString(html.find("#dimLight")[0].value)
                        let brightLight = await ATL.checkString(html.find("#brightLight")[0].value)
                        let dimSight = await ATL.checkString(html.find("#dimSight")[0].value)
                        let brightSight = await ATL.checkString(html.find("#brightSight")[0].value)
                        let lightColor = html.find("#lightColor")[0].value
                        let sightAngle = await ATL.checkString(html.find("#sightAngle")[0].value)
                        let lightAlpha = await ATL.checkString(html.find("#lightAlpha")[0].value)
                        let lightAngle = await ATL.checkString(html.find("#lightAngle")[0].value)
                        let animationType = html.find("#animationType")[0].value
                        let animationSpeed = await ATL.checkString(html.find("#animationSpeed")[0].value)
                        let animationIntensity = await ATL.checkString(html.find("#animationIntensity")[0].value)

                        let object = {
                            name: name,
                            dimLight: dimLight,
                            brightLight: brightLight,
                            lightColor: lightColor,
                            lightAnimation: {
                                'type': animationType,
                                'speed': animationSpeed,
                                'intensity': animationIntensity
                            },
                            lightAlpha: lightAlpha,
                            dimSight: dimSight,
                            brightSight: brightSight,
                            sightAngle: parseInt(sightAngle),
                            lightAngle: parseInt(lightAngle),
                            id: id
                        }
                        ATL.AddPreset(name, object)
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
                if ([overrides.dimLight, overrides.dimSight, overrides.brightLight, overrides.brightSight].some(checkString)) {
                    ui.notifications.error("ATL: preset string error")
                }
                delete overrides.id
                delete overrides.name
                overrides.lightAngle = parseInt(overrides?.lightAngle) || originals?.lightAngle || 360
                overrides.sightAngle = parseInt(overrides?.sightAngle) || originals?.sightAngle || 360

                for (const [key, value] of Object.entries(overrides)) {
                    let ot = typeof getProperty(originals, key)
                    if (ot === "null" || ot === "undefined") originals[key] = entity.data.token[key]
                }
            }
            else {
                let preValue = (overrides[updateKey] ? overrides[updateKey] : originals[updateKey]) ?? null;
                let result = ATL.apply(entity, change, originals, preValue);
                if (change.key === "ATL.lightAlpha") result = result * result
                if (result !== null) {
                    let resultTmp;
                    if (updateKey === "lightAnimation" && typeof result === "string") {
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
                        originals[updateKey] = entity.data.token[updateKey];
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
        else entity.token.setFlag("ATL", "originals", originals)
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

    static applyAdd(token, change, originals, current) {
        let { key, value } = change;
        key = key.slice(4)
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
        //const current = typeof getProperty(originals, key) === "number" ? getProperty(originals, key) : getProperty(token.data, key) || null;
        if ((typeof (current) !== "number") || (typeof (value) !== "number")) return null;
        const update = current * value;
        return update;
    }

    static applyOverride(token, change, originals, current) {
        let { key, value, mode } = change;
        key = key.slice(4)
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
class ATLUpdate {

    static runUpdates() {
        switch (game.settings.get("ATL", "conversion")) {
            case "0": { }
            case "0.2.0": {
                ATLUpdate.lightAlphaUpdate()
            }
            case "0.2.15": {
                console.log("ATL: no conversion needed")
            }
        }
    }
    static lightAlphaUpdate(){
        let presets = duplicate(game.settings.get("ATL", "presets"))
        for (let preset of presets) {
            if (!!preset.colorIntensity) {
                preset.lightAlpha = preset.colorIntensity
                delete preset.colorIntensity
            }
        }
        new Dialog({
            title: "ATL Preset Update",
            content: `Do you wish to mass auto-update your ATL presets, one time choice.<br>
            Changes: internal change of "colorIntensity" to "lightAlpha"`,
            buttons: {
                one: {
                    label: "Yes",
                    callback: async () => {
                        await game.settings.set("ATL", "presets", presets)
                        await game.settings.set("ATL", "conversion", "0.2.15")
                    }
                },
                two: {
                    label: "No, I'll update myself",
                    callback: async () => {
                        await game.settings.set("ATL", "conversion", "0.2.15")

                    }
                }
            }
        }).render(true)
    }
}
Hooks.on('init', ATL.init);
Hooks.on('ready', ATL.ready)
Hooks.on('getSceneControlButtons', ATL.getSceneControlButtons)
Hooks.on("ready", ATLUpdate.runUpdates)
