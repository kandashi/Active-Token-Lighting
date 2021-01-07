Hooks.on("updateActiveEffect", (actor, effect, options) => {
    ReadUpdate(actor, effect)
})

Hooks.on("createActiveEffect", (actor, effect, options) => {
    ReadUpdate(actor, effect)
})

function ReadUpdate(actor, effect,) {
    Hooks.once("renderActorSheet5eCharacter", () => {
        let flag = actor.getFlag('ALT', 'lighting')
        let lightUpdate = false;
        for (let change of effect.changes) {
            if (change.key.includes("ALT")) lightUpdate = true
        }
        if (lightUpdate === false) return;
        actor = game.actors.get(actor._id)
        let token = actor.getActiveTokens()[0];
        let { dimLight, brightLight, dimSight, brightSight } = flag !== undefined ? flag : 0;
        if (typeof dimLight !== "string") dimLight = 0;
        if (typeof brightLight !== "string") brightLight = 0
        if (typeof dimSight !== "string") dimSight = 0
        if (typeof brightSight !== "string") brightSight = 0
        let newDimLight = actor.data.token.dimLight > dimLight ? actor.data.token.dimLight : dimLight;
        let newBrightLight = actor.data.token.brightLight > brightLight ? actor.data.token.brightLight : brightLight;
        let newDimSight = actor.data.token.dimSight > dimSight ? actor.data.token.dimSight : dimSight;
        let newBrightSight = actor.data.token.brightSight > brightSight ? actor.data.token.brightSight : brightSight;

        token.update({ dimLight: newDimLight, brightLight: newBrightLight, dimSight: newDimSight, brightSight: newBrightSight })
    })
}