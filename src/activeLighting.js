class ATL {

    static init() {
        let defaultPresets = [
            {
                name: "torch",
                dimLight: "40",
                brightLight: "20",
                lightColor: "#a2642a",
                lightEffect: {
                    'type': 'torch',
                    'speed': 1,
                    'intensity': 1
                },
                colorIntensity: "0.4",
                id: "ATLPresetTorch"
            },
            {
                name: "lantern",
                dimLight: "60",
                brightLight: "30",
                lightColor: "#a2642a",
                lightEffect: {
                    'type': 'torch',
                    'speed': 1,
                    'intensity': 1
                },
                colorIntensity: "0.4",
                id: "ATLPresetLantern"

            },
            {
                name: "candle",
                dimLight: "10",
                brightLight: "2",
                lightColor: "#a2642a",
                lightEffect: {
                    'type': 'torch',
                    'speed': 1,
                    'intensity': 1
                },
                colorIntensity: "0.2",
                id: "ATLPresetCandle"

            }
        ]
        game.settings.register("ATL", "size", {
            name: "Size Adjustment with Flags",
            hint: "Allow for size adjustment to be made with flags, alwasy returns tokens to prototype token defaults is flag is not present",
            scope: "world",
            config: true,
            default: false,
            type: Boolean,
        });
        game.settings.register("ATL", "presets", {
            name: "Size Adjustment with Flags",
            hint: "Allow for size adjustment to be made with flags, alwasy returns tokens to prototype token defaults is flag is not present",
            scope: "world",
            config: false,
            default: defaultPresets,
            type: Object,
        })
    }
    static ready() {

        Hooks.on("updateActiveEffect", async (entity, effect, options) => {
            if (entity.data.type === "character") {
                let ATLUpdate = false;
                for (let change of effect.changes) {
                    if (change.key.includes("ATL")) ATLUpdate = true
                }
                if (ATLUpdate === false) return;
                ATL.ReadUpdate(entity.id, effect)
            }
        })

        Hooks.on("createActiveEffect", async (actor, effect, options) => {
            let ATLUpdate = false;
            for (let change of effect.changes) {
                if (change.key.includes("ATL")) ATLUpdate = true
            }
            if (ATLUpdate === false) return;
            ATL.ReadUpdate(actor.id, effect)
        })

        Hooks.on("deleteActiveEffect", async (actor, effect, options) => {
            let ATLUpdate = false;
            for (let change of effect.changes) {
                if (change.key.includes("ATL")) ATLUpdate = true
            }
            if (ATLUpdate === false) return;
            ATL.ReadUpdate(actor.id, effect)
        })

        Hooks.on("preUpdateToken", (scene, token, update) => {
            if (!(update.actorData?.effects)) return
            let removed = token.actorData?.effects?.filter(x => !update.actorData?.effects?.includes(x));
            let added = update.actorData?.effects?.filter(x => !token.actorData?.effects?.includes(x));
            let effects = []
            if (added) added.forEach(i => effects.push(i))
            if (removed) removed.forEach(i => effects.push(i))
            let ATLUpdate = false;
            for (let testEffect of effects) {
                for (let change of testEffect.changes) {
                    if (change.key.includes("ATL")) {
                        ATLUpdate = true;
                        break;
                    }
                }
            }

            if (ATLUpdate === false) return;
            ATL.ReadUpdateUnlinked(token._id)
        })
    }


    static ATLMap = new Map()

    static ReadUpdate(actorId, effect) {
        let gm = game.user === game.users.find((u) => u.isGM && u.active)
        if (!gm) return;
        setTimeout(() => {
            let actor = game.actors.get(actorId)
            const LightFlag = actor.getFlag('ATL', 'lighting')
            const SizeFlag = actor.getFlag('ATL', 'size')

            let token = actor.getActiveTokens()[0];
            ATL.performUpdate(token, LightFlag, SizeFlag, actor.data.token)
        }, 20)
    }



    static ReadUpdateUnlinked(tokenId) {
        let gm = game.user === game.users.find((u) => u.isGM && u.active)
        if (!gm) return;
        let ATLHookId = Hooks.on("updateToken", (scene, token1, update) => {
            if (token1._id !== tokenId) return;
            let token = canvas.tokens.get(tokenId);
            let actor = token.actor;
            let tokenData = actor.data.token;
            const LightFlag = actor.getFlag('ATL', 'lighting')
            const SizeFlag = actor.getFlag('ATL', 'size')


            ATL.performUpdate(token, LightFlag, SizeFlag, tokenData)
            Hooks.off("updateToken", ATLHookId)
        })
    }

    static performUpdate(token, LightFlag, SizeFlag, tokenData) {



        if (LightFlag?.preset) {
            let presetArray = game.settings.get("ATL", "presets")
            let preset = presetArray.find(i => i.name === LightFlag.preset)
            var { dimLight, brightLight, dimSight, brightSight, sightAngle, lightColor, lightEffect, colorIntensity, lightAngle } = preset;
        }
        else var { dimLight, brightLight, dimSight, brightSight, sightAngle, lightColor, lightEffect, colorIntensity, lightAngle } = LightFlag !== undefined ? LightFlag : 0;


        if (lightAngle) lightAngle = parseInt(lightAngle);
        if (sightAngle) sightAngle = parseInt(sightAngle);

        if (dimLight === undefined) dimLight = 0;
        if (brightLight === undefined) brightLight = 0
        if (dimSight === undefined) dimSight = 0
        if (brightSight === undefined) brightSight = 0
        if (sightAngle === undefined) sightAngle = 360
        if (lightColor === undefined) lightColor = ""
        if (lightAngle === undefined) lightAngle = 360
        if (colorIntensity === undefined) colorIntensity = tokenData.lightAlpha


        let { size, scale } = SizeFlag !== undefined ? SizeFlag : 0;
        if (size === undefined) size = tokenData.height
        if (scale === undefined) scale = tokenData.scale



        let newDimLight = tokenData.dimLight > dimLight ? tokenData.dimLight : dimLight;
        let newBrightLight = tokenData.brightLight > brightLight ? tokenData.brightLight : brightLight;
        let newDimSight = tokenData.dimSight > dimSight ? tokenData.dimSight : dimSight;
        let newBrightSight = tokenData.brightSight > brightSight ? tokenData.brightSight : brightSight;
        let newSightAngle = tokenData.sightAngle > sightAngle ? sightAngle : tokenData.sightAngle;
        let lightAnimation;

        if (lightEffect === undefined || lightEffect === "") lightAnimation = tokenData.lightAnimation
        else if (LightFlag?.preset) lightAnimation = lightEffect;
        else lightAnimation = JSON.parse(lightEffect)

        if (game.settings.get("ATL", "size") === true)
            token.update({ "lightAnimation": lightAnimation, dimLight: newDimLight, brightLight: newBrightLight, dimSight: newDimSight, brightSight: newBrightSight, lightColor: lightColor, sightAngle: newSightAngle, lightAlpha: (colorIntensity * colorIntensity), height: size, width: size, scale: scale, lightAngle: lightAngle })
        else if (game.settings.get("ATL", "size") === false)
            token.update({ "lightAnimation": lightAnimation, dimLight: newDimLight, brightLight: newBrightLight, dimSight: newDimSight, brightSight: newBrightSight, lightColor: lightColor, sightAngle: newSightAngle, lightAlpha: (colorIntensity * colorIntensity), lightAngle: lightAngle })

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

        let { dimLight, brightLight, dimSight, brightSight, sightAngle, lightColor, lightEffect, colorIntensity, lightAngle, name } = preset ? preset : 0
        switch (copy) {
            case true: name = `${name} (copy)`;
                break;
            case false: name = name;
                break;
            default: name = ""
        }
        if (dimLight === undefined) dimLight = 0;
        if (brightLight === undefined) brightLight = 0
        if (dimSight === undefined) dimSight = 0
        if (brightSight === undefined) brightSight = 0
        if (sightAngle === undefined) sightAngle = 360
        if (lightColor === undefined) lightColor = "#FFFFFF"
        if (lightAngle === undefined) lightAngle = 360
        if (colorIntensity === undefined) colorIntensity = 1
        if (lightEffect === undefined) lightEffect = {}
        new Dialog({
            title: "ATL Light Editor",
            content: `
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
                    <input id="lightAngle" name="lightAngle" type="number" min="0" max="360" value="${lightAngle}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="sightAngle"> Sight Angle: </label>
                    <input id="sightAngle" name="sightAngle" type="number" min="0" max="360" value="${sightAngle}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                <label for="lightAlpha"> Light Intensity: </label>
                <input id="lightAlpha" name="lightAlpha" type="number" min="0" max="1" placeholder="0-1" value="${colorIntensity}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                <label for="lightColor"> Light Color: </label>
                <input type="color" id="lightColor" name="lightColor" value="${lightColor}">
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                <label for="animationType"> Animation Type: </label>
                <select id="animationType" name="animationType" >
                    <option selected value="none"> None</option>
                    <option value="torch" ${lightEffect.type === "torch" ? 'selected' : ''}> Torch</option>
                    <option value="pulse" ${lightEffect.type === "pulse" ? 'selected' : ''}> Pulse</option>
                    <option value="chroma" ${lightEffect.type === "chroma" ? 'selected' : ''}> Chroma</option>
                    <option value="wave" ${lightEffect.type === "wave" ? 'selected' : ''}> Pulsing Wave</option>
                    <option value="fog" ${lightEffect.type === "fog" ? 'selected' : ''}> Swirling Fog</option>
                    <option value="sunburst" ${lightEffect.type === "sunburst" ? 'selected' : ''}> Sunburst</option>
                    <option value="dome" ${lightEffect.type === "dome" ? 'selected' : ''}> Light Dome</option>
                    <option value="emanation" ${lightEffect.type === "emanation" ? 'selected' : ''}> Mysterious Emanation</option>
                    <option value="hexa" ${lightEffect.type === "hexa" ? 'selected' : ''}>  Hexa Dome</option>
                    <option value="ghost" ${lightEffect.type === "ghost" ? 'selected' : ''}> Ghostly Light</option>
                    <option value="energy" ${lightEffect.type === "energy" ? 'selected' : ''}> Energy Field</option>
                    <option value="roiling" ${lightEffect.type === "roiling" ? 'selected' : ''}> Roiling Mass (Darkness)</option>
                    <option value="hole" ${lightEffect.type === "hole" ? 'selected' : ''}> Black Hole (Darkness)</option>
                </select>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="animationSpeed"> Animation Speed: </label>
                    <input id="animationSpeed" name="animationSpeed" type="number" min="0" max="1" placeholder="1-10" value="${lightEffect?.speed}"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="animationIntensity"> Animation Intensity: </label>
                    <input id="animationIntensity" name="animationIntensity" type="number" min="0" max="1" placeholder="1-10" value="${lightEffect?.intensity}"></input>
            </div>
                `,
            buttons: {
                one: {
                    label: "Add Preset",
                    icon: `<i class="fas fa-check"></i>`,
                    callback: (html) => {
                        let id = randomID()
                        let name = html.find("#name")[0].value
                        let dimLight = html.find("#dimLight")[0].value
                        let brightLight = html.find("#brightLight")[0].value
                        let dimSight = html.find("#dimSight")[0].value
                        let brightSight = html.find("#brightSight")[0].value
                        let lightColor = html.find("#lightColor")[0].value
                        let sightAngle = html.find("#sightAngle")[0].value
                        let lightAlpha = html.find("#lightAlpha")[0].value
                        let lightAngle = html.find("#lightAngle")[0].value
                        let animationType = html.find("#animationType")[0].value
                        let animationSpeed = html.find("#animationSpeed")[0].value
                        let animationIntensity = html.find("#animationIntensity")[0].value

                        let object = {
                            name: name,
                            dimLight: dimLight,
                            brightLight: brightLight,
                            lightColor: lightColor,
                            lightEffect: {
                                'type': animationType,
                                'speed': animationSpeed,
                                'intensity': animationIntensity
                            },
                            colorIntensity: lightAlpha,
                            dimSight: dimSight,
                            brightSight: brightSight,
                            sightAngle: sightAngle,
                            lightAngle: lightAngle,
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
}



Hooks.on('init', ATL.init);
Hooks.on('ready', ATL.ready);
Hooks.on('getSceneControlButtons', ATL.getSceneControlButtons)