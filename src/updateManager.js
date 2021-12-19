export class ATLUpdate {

    static runUpdates() {
        switch (game.settings.get("ATL", "conversion")) {
            case "0": { }
            case "0.2.0": {
                ATLUpdate.lightAlphaUpdate()
            }
            case "0.2.15": {
                ATLUpdate.v9Update()
            }
            case "0.3.0": {
                console.log("ATL: no conversion needed")
            }
        }
    }
    static lightAlphaUpdate() {
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

    static async v9UpdateActor(actor) {
        if (!actor.data.token.actorLink) return
        if (actor.getFlag("ATL", "conversion") >= 3.0) return
        let flag = actor.getFlag("ATL", "originals")
        if (!!flag) {
            let newData = this.newFlagV9(flag)
            await actor.setFlag("ATL", "originals", newData)
        }
        let effects = actor.data.effects
        for (let effect of effects) {
            let updates = []
            for (let change of effect.data.changes) {
                if (change.key.includes("ATL")) {
                    updates.push(this.v9UpdateEffect(duplicate(change)))
                }
            }
            await effect.update({ "changes": updates })
        }
        if (updates.length > 1) {
            await actor.setFlag("ATL", "conversion", 3.0)
        }
        console.warn(`ATL v9 update: Actor ${actor.name} updated`)
    }

    static v9UpdateEffect(change) {
        switch (change.key) {
            case "ATL.preset":
            case "ATL.brightSight":
            case "ATL.dimSight":
            case "ATL.height":
            case "ATl.img":
            case "ATL.mirrorX":
            case "ATL.mirrorY":
            case "ATL.rotation":
            case "ATL.scale":
            case "ATL.width":
                break;
            case "ATL.dimLight":
                change.key = "ATL.light.dim";
                break;
            case "ATL.brightLight":
                change.key = "ATL.light.bright";
                break;
            case "ATL.lightAnimation":
                change.key = "ATL.light.animation";
                break;
            case "ATL.lightColor":
                change.key = "ATL.light.color";
                break;
            case "ATL.lightAlpha":
                change.key = "ATL.light.alpha";
                break;
            case "ATL.lightAngle":
                change.key = "ATL.light.angle"
                break;
        }
        return change
    }

    static async v9UpdateScene(scene) {
        for (let token of scene.tokens) {
            if (token.data.actorLink) return;
            let flag = token.getFlag("ATL", "originals")
            if (!flag) return
            let newData = this.newFlagV9(flag)
            console.warn(`ATL v9 update: Token ${actor.name} in ${scene.name} updated`)
            await token.setFlag("ATL", "originals", newData)
        }
    }

    static async v9UpdateItem(item) {
        if (item.getFlag("ATL", "conversion") >= 3.0) return
        let effects = item.data.effects.contents
        for (let effect of effects) {
            let updates = []
            for (let change of effect.data.changes) {
                if (change.key.includes("ATL")) {
                    updates.push(this.v9UpdateEffect(duplicate(change)))
                }
            }
            if (updates.length > 1) {
                await effect.update({ "changes": updates })
                await item.setFlag("ATL", "conversion", 3.0)
            }
            console.warn(`ATL v9 update: item ${item.name} updated`)
        }
    }

    static async v9Update() {
        let presets = duplicate(game.settings.get("ATL", "presets"))
        let updateArray = []
        for (let preset of presets) {
            let newPreset = {
                light: {
                    dim: preset.dimLight,
                    bright: preset.brightLight,
                    animation: preset.lightAnimation,
                    color: preset.lightColor,
                    alpha: preset.lightAlpha,
                    angle: preset.lightAngle,
                    coloration: 0,
                },
                brightSight: preset.brightSight,
                dimSight: preset.dimSight,
                id: preset.id,
                name: preset.name
            }
            updateArray.push(newPreset)
        }
        console.warn("ATL v9 update: Preset array updated")
        game.settings.set("ATL", "presets", updateArray)
        console.log("ATL: Updating Actors")
        for (let actor of game.actors) {
            await this.v9UpdateActor(actor)
        }
        console.log("ATL: Finished Updating Actors")

        console.log("ATL: Updating Scenes")
        for (let scene of game.scenes) {
            await this.v9UpdateScene(scene)
        }
        console.log("ATL: Finished Updating Scenes")

        console.log("ATL: Updating Items")
        for (let item of game.items) {
            await this.v9UpdateItem(item)
        }
        console.log("ATL: Finished Updating Items")

        await game.settings.set("ATL", "conversion", "0.3.0")
    }

    static newFlagV9(flag) {
        let conversion = {
            light: {
                dim: flag.dimLight,
                bright: flag.brightLight,
                animation: flag.lightAnimation,
                color: flag.lightColor,
                alpha: flag.lightAlpha,
                angle: flag.lightAngle,
            },
            brightSight: flag.brightSight,
            dimSight: flag.dimSight,
            height: flag.height,
            img: flag.img,
            mirrorX: flag.mirrorX,
            mirrorY: flag.mirrorY,
            rotation: flag.rotation,
            name: flag.name,
            scale: flag.scale,
            width: flag.width,
        }
        let newData = Object.fromEntries(Object.entries(conversion).filter(([_, v]) => { v != null && v != undefined }))
        return newData
    }

}

