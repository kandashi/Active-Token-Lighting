Hooks.on('init', () => {
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
})

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
        colorIntensity: "0.4"
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
        colorIntensity: "0.4"
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
        colorIntensity: "0.2"
    }
]

Hooks.on("updateActiveEffect", async (entity, effect, options) => {
    if (entity.data.type === "character") {
        let ATLUpdate = false;
        for (let change of effect.changes) {
            if (change.key.includes("ATL")) ATLUpdate = true
        }
        if (ATLUpdate === false) return;
        ReadUpdate(entity.id, effect)
    }
})

Hooks.on("createActiveEffect", async (actor, effect, options) => {
    let ATLUpdate = false;
    for (let change of effect.changes) {
        if (change.key.includes("ATL")) ATLUpdate = true
    }
    if (ATLUpdate === false) return;
    ReadUpdate(actor.id, effect)
})

Hooks.on("deleteActiveEffect", async (actor, effect, options) => {
    let ATLUpdate = false;
    for (let change of effect.changes) {
        if (change.key.includes("ATL")) ATLUpdate = true
    }
    if (ATLUpdate === false) return;
    ReadUpdate(actor.id, effect)
})

Hooks.on("preUpdateToken", (scene, token, update) => {
    if (!(update.actorData?.effects)) return
    let removed = token.actorData.effects.filter(x => !update.actorData.effects.includes(x));
    let added = update.actorData.effects.filter(x => !token.actorData.effects.includes(x));
    let effects = []
    added.forEach(i => effects.push(i))
    removed.forEach(i => effects.push(i))
    let ATLUpdate = false;
    for (let testEffect of effects) {
        for (let change of testEffect.changes) {
            if (change.key.includes("ATL")) ATLUpdate = true; break;
        }
    }

    if (ATLUpdate === false) return;
    ReadUpdateUnlinked(token._id)
})


let ATLMap = new Map()

Hooks.on("ready", () => {

})

function ReadUpdate(actorId, effect) {
    let gm = game.user === game.users.find((u) => u.isGM && u.active)
    if (!gm) return;
    setTimeout(() => {
        let actor = game.actors.get(actorId)
        const LightFlag = actor.getFlag('ATL', 'lighting')
        const SizeFlag = actor.getFlag('ATL', 'size')

        let token = actor.getActiveTokens()[0];
        performUpdate(token, LightFlag, SizeFlag, actor.data.token)
    }, 20)
}



function ReadUpdateUnlinked(tokenId) {
    let gm = game.user === game.users.find((u) => u.isGM && u.active)
    if (!gm) return;
    Hooks.once("updateToken", () => {
        let token = canvas.tokens.get(tokenId);
        let actor = token.actor;
        let tokenData = actor.data.token;
        const LightFlag = actor.getFlag('ATL', 'lighting')
        const SizeFlag = actor.getFlag('ATL', 'size')


        performUpdate(token, LightFlag, SizeFlag, tokenData)
    })
}

function performUpdate(token, LightFlag, SizeFlag, tokenData) {



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

function ATLAddPreset(name, object) {
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
function ATLRemovePreset(name) {
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

function ATLGeneratePreset() {
    new Dialog({
        name: "ATL Preset setter",
        content: `
        <form>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
           
                    <label for="name"> Preset Name: </label>
                    <input id="name" name="name" type="text"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">

                    <label for="dimLight"> Dim Light: </label>
                    <input id="dimLight" name="dimLight" type="text"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="brightLight"> Bright Light: </label>
                    <input id="brightLight" name="brightLight" type="text"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="dimSight"> Dim Sight: </label>
                    <input id="dimSight" name="dimSight" type="text"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="brightSight"> Bright Sight: </label>
                    <input id="brightSight" name="brightSight" type="text"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="lightAngle"> Light Angle: </label>
                    <input id="lightAngle" name="lightAngle" type="text"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="sightAngle"> Sight Angle: </label>
                    <input id="sightAngle" name="sightAngle" type="text"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                <label for="lightAlpha"> Light Intensity (0-1): </label>
                <input id="lightAlpha" name="lightAlpha" type="text"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                <label for="lightColor"> Light Color: </label>
                <input id="lightColor" name="lightColor" type="text"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                <label for="animationType"> Animation Type: </label>
                <select id="animationType" name="animationType" >
                    <option value="torch"> Torch</option>
                    <option value="pulse"> Pulse</option>
                    <option value="chroma"> Chroma</option>
                    <option value="wave"> Pulsing Wave</option>
                    <option value="fog"> Swirling Fog</option>
                    <option value="sunburst"> Sunburst</option>
                    <option value="dome"> Light Dome</option>
                    <option value="emanation"> Mysterious Emanation</option>
                    <option value="hexa"> Hexa Dome</option>
                    <option value="ghost"> Ghostly Light</option>
                    <option value="energy"> Energy Field</option>
                    <option value="roiling"> Roiling Mass (Darkness)</option>
                    <option value="hole"> Black Hole (Darkness)</option>
                </select>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="animationSpeed"> Animation Speed (1-10): </label>
                    <input id="animationSpeed" name="animationSpeed" type="number" min="0" max="1"></input>
            </div>
            <div class="form-group" clear: both; display: flex; flex-direction: row; flex-wrap: wrap;margin: 3px 0;align-items: center;">
                    <label for="animationIntensity"> Animation Intensity (1-10): </label>
                    <input id="animationIntensity" name="animationIntensity" type="number" min="0" max="1"></input>
            </div>
                `,
        buttons: {
            one: {
                label: "Add Preset",
                callback: (html) => {
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
                        lightAngle: lightAngle
                    }
                    ATLAddPreset(name, object)
                }
            },
            two: {
                label: "Cancel",
            }
        }

    }).render(true)
}


