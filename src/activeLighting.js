Hooks.on('init', () => {
    game.settings.register("ATL", "size", {
        name: "Size Adjustment with Flags",
        hint: "Allow for size adjustment to be made with flags, alwasy returns tokens to prototype token defaults is flag is not present",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
})

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


    let { dimLight, brightLight, dimSight, brightSight, sightAngle, lightColor, lightEffect, colorIntensity, lightAngle } = LightFlag !== undefined ? LightFlag : 0;

    if (LightFlag?.preset === 'torch') {
        dimLight = "40";
        brightLight = "20";
        lightColor = "#a2642a";
        lightEffect = {
            'type': 'torch',
            'speed': 1,
            'intensity': 1
        };
        colorIntensity = "0.4"
    }
    if (LightFlag?.preset === "lantern") {
        dimLight = "60";
        brightLight = "30";
        lightColor = "#a2642a";
        lightEffect = {
            'type': 'torch',
            'speed': 1,
            'intensity': 1
        };
        colorIntensity = "0.4"
    }
    if (LightFlag?.preset === "candle") {
        dimLight = "10";
        brightLight = "2";
        lightColor = "#a2642a";
        lightEffect = {
            'type': 'torch',
            'speed': 1,
            'intensity': 1
        };
        colorIntensity = "0.2"
    }
    if (lightAngle) lightAngle = parseInt(lightAngle);
    if (sightAngle) sightAngle = parseInt(sightAngle);

    if (dimLight === undefined) dimLight = 0;
    if (brightLight === undefined) brightLight = 0
    if (dimSight === undefined) dimSight = 0
    if (brightSight === undefined) brightSight = 0
    if (sightAngle === undefined) sightAngle = 360
    if (lightColor === undefined) lightColor = ""
    if (lightAngle === undefined) lightAngle = 360
    if (lightEffect === undefined && !LightFlag?.preset) lightEffect = tokenData.lightAnimation.type
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

