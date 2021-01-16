Hooks.on("updateActiveEffect", async (entity, effect, options) => {
    if (entity.data.type === "character")
        ReadUpdate(entity.id, effect)
})

Hooks.on("createActiveEffect", async (actor, effect, options) => {
    ReadUpdate(actor.id, effect)
})

Hooks.on("deleteActiveEffect", async (actor, effect, options) => {
    ReadUpdate(actor.id, effect)
})

Hooks.on("preUpdateToken", (scene, token, update) => {
    if (!(update.actorData?.effects)) return
    let removed = token.actorData.effects.filter(x => !update.actorData.effects.includes(x));
    let added = update.actorData.effects.filter(x => !token.actorData.effects.includes(x));
    if (added.length > 0) ReadUpdateUnlinked(token._id, added, token)
    if (removed.length > 0) ReadUpdateUnlinked(token._id, removed, token)

})


function ReadUpdate(actorId, effect) {
    let gm = game.user === game.users.find((u) => u.isGM && u.active)
    if (!gm) return;
    setTimeout(() => {
        let actor = game.actors.get(actorId)
        let flag = actor.getFlag('ATL', 'lighting')
        let lightUpdate = false;
        let tokenData = actor.data.token
        for (let change of effect.changes) {
            if (change.key.includes("ATL")) lightUpdate = true
        }
        if (lightUpdate === false) return;
        let token = actor.getActiveTokens()[0];
        let { dimLight, brightLight, dimSight, brightSight, sightAngle, lightColor, lightEffect, colorIntensity, size, scale } = flag !== undefined ? flag : 0;
        if (typeof dimLight !== "string") dimLight = 0;
        if (typeof brightLight !== "string") brightLight = 0
        if (typeof dimSight !== "string") dimSight = 0
        if (typeof brightSight !== "string") brightSight = 0
        if (typeof sightAngle !== "string") sightAngle = 360
        if (typeof lightColor !== "string") lightColor = ""
        if (typeof lightEffect !== "string") lightEffect = tokenData.lightAnimation.type
        if (typeof colorIntensity !== "string") colorIntensity = tokenData.lightAlpha
        if (typeof size !== "string") size = tokenData.height
        if (typeof scale !== "string") scale = tokenData.scale


        let newDimLight = tokenData.dimLight > dimLight ? tokenData.dimLight : dimLight;
        let newBrightLight = tokenData.brightLight > brightLight ? tokenData.brightLight : brightLight;
        let newDimSight = tokenData.dimSight > dimSight ? tokenData.dimSight : dimSight;
        let newBrightSight = tokenData.brightSight > brightSight ? tokenData.brightSight : brightSight;
        let newSightAngle = tokenData.sightAngle > sightAngle ? sightAngle : tokenData.sightAngle;
        let lightAnimation;
        if(lightEffect === "") lightAnimation = tokenData.lightAnimation
        else lightAnimation = JSON.parse(lightEffect)

        token.update({ "lightAnimation": lightAnimation, dimLight: newDimLight, brightLight: newBrightLight, dimSight: newDimSight, brightSight: newBrightSight, lightColor: lightColor, sightAngle: newSightAngle, lightAlpha: (colorIntensity * colorIntensity), height: size, width: size, scale: scale })
    }, 10)
}

function ReadUpdateUnlinked(tokenId, effect, token) {
    if (effect.length < 1) return;
    let gm = game.user === game.users.find((u) => u.isGM && u.active)
    if (!gm) return;
    setTimeout(() => {
        let token = canvas.tokens.get(tokenId)
        let actor = token.actor
        let flag = actor.getFlag('ATL', 'lighting')
        let lightUpdate = false;
        for (let change of effect[0].changes) {
            if (change.key.includes("ATL")) lightUpdate = true; break;
        }

        if (lightUpdate === false) return;
        let { dimLight, brightLight, dimSight, brightSight, sightAngle, lightColor, lightEffect, colorIntensity, animationSpeed, animationIntensity } = flag !== undefined ? flag : 0;
        if (typeof dimLight !== "string") dimLight = 0;
        if (typeof brightLight !== "string") brightLight = 0
        if (typeof dimSight !== "string") dimSight = 0
        if (typeof brightSight !== "string") brightSight = 0
        if (typeof sightAngle !== "string") sightAngle = 360
        if (typeof lightColor !== "string") lightColor = ""
        if (typeof lightEffect !== "string") lightEffect = tokenData.lightAnimation.type
        if (typeof colorIntensity !== "string") colorIntensity = tokenData.lightAlpha


        let newDimLight = tokenData.dimLight > dimLight ? tokenData.dimLight : dimLight;
        let newBrightLight = tokenData.brightLight > brightLight ? tokenData.brightLight : brightLight;
        let newDimSight = tokenData.dimSight > dimSight ? tokenData.dimSight : dimSight;
        let newBrightSight = tokenData.brightSight > brightSight ? tokenData.brightSight : brightSight;
        let newSightAngle = tokenData.sightAngle > sightAngle ? sightAngle : tokenData.sightAngle;
        let lightAnimation;
        if(lightEffect === "") lightAnimation = tokenData.lightAnimation
        else lightAnimation = JSON.parse(lightEffect)


        token.update({ "lightAnimation": lightAnimation, dimLight: newDimLight, brightLight: newBrightLight, dimSight: newDimSight, brightSight: newBrightSight, lightColor: lightColor, sightAngle: newSightAngle, lightAlpha: (colorIntensity * colorIntensity), })
    }, 10)
}
