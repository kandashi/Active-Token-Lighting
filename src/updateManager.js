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
        if (actor.data.token.actorLink) return
        let flag = actor.getFlag("ATL", "originals")
        if (!flag) return
        let newData = newFlagV9(flag)
        console.warn(`ATL v9 update: Actor ${actor.name} updated`)
        await actor.setFlag("ATL", "originals", newData)
    }

    static async v9UpdateScene(scene) {
        for (let token of scene.tokens) {
            if (token.data.actorLink) return;
            let flag = actor.getFlag("ATL", "originals")
            if (!flag) return
            let newData = newFlagV9(flag)
            console.warn(`ATL v9 update: Token ${actor.name} in ${scene.name} updated`)
            await token.setFlag("ATL", "originals", newData)
        }
    }

    static async v9Update() {

        function newFlagV9(flag) {
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
            let newData = Object.fromEntries(Object.entries(conversion).filter(([_, v]) => v != null))
            return newData
        }
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
        for (let actor of game.actors) {
            if (actor.data.token.actorLink) return
            let flag = actor.getFlag("ATL", "originals")
            if (!flag) return
            let newData = newFlagV9(flag)
            console.warn(`ATL v9 update: Actor ${actor.name} updated`)
            await actor.setFlag("ATL", "originals", newData)
        }
        for (let scene of game.scenes) {
            for (let token of scene.tokens) {
                if (token.data.actorLink) return;
                let flag = actor.getFlag("ATL", "originals")
                if (!flag) return
                let newData = newFlagV9(flag)
                console.warn(`ATL v9 update: Token ${actor.name} in ${scene.name} updated`)
                await token.setFlag("ATL", "originals", newData)
            }
        }
    }
}