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
                ATLUpdate.v10Update();
            }
            case "0.5.0": {
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
            let updates = [];
            let changeFound = false;
            for (let change of effect.data.changes) {
                if (change.key.includes("ATL")) {
                    changeFound = true;
                    updates.push(this.v9UpdateEffect(duplicate(change)))
                }
                else updates.push(change);
            }
            if (changeFound) {
                await effect.update({ "changes": updates })
                await actor.setFlag("ATL", "conversion", 3.0)
            }
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
            console.warn(`ATL v9 update: Token ${token.name} in ${scene.name} updated`)
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
                    dim: preset.dimLight || preset.light?.dim,
                    bright: preset.brightLight || preset.light?.bright,
                    animation: preset.lightAnimation || preset.light?.animation,
                    color: preset.lightColor || preset.light?.color,
                    alpha: preset.lightAlpha || preset.light?.alpha,
                    angle: preset.lightAngle || preset.light?.angle,
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

    static async flagBuster(actor) {
        console.warn(`Updating ${actor.name}`)
        let flag = actor.getFlag("ATL", "originals")
        if (!flag) return ui.notifications.notify(`No Flag for ${actor.name}`)
        let updates = mergeObject(actor.data.token, flag, { inplace: false })
        await actor.update({ token: updates })
    }

    static async massFlagUpdate() {
        for (let actor of game.actors) {
            await this.flagBuster(actor)
        }
    }

    static async v10Update() {
        console.log("ATL: v10 update process starting");

        // update presets
        console.log("ATL: v10 update presets");
        const presets = duplicate(game.settings.get("ATL", "presets"));
        presets.forEach(this.v10UpdatePreset);
        game.settings.set("ATL", "presets", presets);
        console.log("ATL: v10 update presets done");

        // update actors w/ linked tokens
        console.log("ATL: v10 update actors");
        for (const actor of game.actors.filter(a => a.prototypeToken.actorLink)) {
            // update originals flag
            const originals = actor.getFlag("ATL", "originals");
            if (!!originals) {
                this.v10UpdatePreset(originals);
                await actor.setFlag("ATL", "originals", originals);
            }

            // update effects
            for (const effect of actor.effects) {
                const newChanges = this.v10UpdateEffectChanges(effect);
                if (newChanges) await effect.update({ changes: newChanges });
            }
        }
        console.log("ATL: v10 update actors done");

        // update scenes
        console.log("ATL: v10 update scenes");
        for (const scene of game.scenes) {
            // update the unlinked tokens
            for (const token of scene.tokens.filter(t => !t.document.actorLink)) {
                // update originals flag
                const originals = token.getFlag("ATL", "originals");
                if (!!originals) {
                    this.v10UpdatePreset(originals);
                    await token.setFlag("ATL", "originals", originals);
                }
            }
        }
        console.log("ATL: v10 update scenes done");

        // update items
        console.log("ATL: v10 update items");
        for (const item of game.items) {
            // update effects
            for (const effect of item.effects) {
                const newChanges = this.v10UpdateEffectChanges(effect);
                if (newChanges) await effect.update({ changes: newChanges });
            }
        }
        console.log("ATL: v10 update items done");

        // record v10 update finished
        await game.settings.set("ATL", "conversion", "0.5.0");
    }

    static v10UpdatePreset(preset) {
        // rename some keys
        const renamedKeys = [
            ["sightAngle", "sight.angle"],
            ["vision", "sight.enabled"]
        ];
        for (const [oldKey, newKey] of renamedKeys) {
            if (Object.hasOwn(preset, oldKey)) {
                setProperty(preset, newKey, data[oldKey]);
                delete data[oldKey];
            }
        }

        // migrate old sight keys
        if (Object.hasOwn(preset, "dimSight") || Object.hasOwn(preset, "brightSight")) {
            // range is max previous keys
            const dimSight = preset.dimSight ?? 0;
            const brightSight = preset.brightSight ?? 0;
            const range = Math.max(dimSight, brightSight);
            setProperty(preset, "sight.range", range);
            delete preset.dimSight;
            delete preset.brightSight;

            // compute brightness
            const brightness = brightSight >= dimSight ? 1 : 0;
            setProperty(preset, "sight.brightness", brightness);
        }
    }

    static v10UpdateEffectChanges(effect) {
        let changeFound = false;
        const changes = duplicate(effect.changes);

        // handle the renames
        for (const change of changes) {
            switch (change.key) {
                case "ATL.sightAngle":
                    changeFound = true;
                    change.key = "ATL.sight.angle";
                    break;
                case "ATL.vision":
                    changeFound = true;
                    change.key = "ATL.sight.enabled";
                    break;
            }
        }

        // look for dimSight and brightSight to migrate to sight.range and sight.brightness
        const dimSightChange = changes.find(change => change.key === "ATL.dimSight");
        const brightSightChange = changes.find(change => change.key === "ATL.brightSight");
        if (dimSightChange || brightSightChange) {
            changeFound = true;

            // calculate range and brightness
            const dimSight = dimSightChange?.value ?? 0;
            const brightSight = brightSightChange?.value ?? 0;
            const range = Math.max(dimSight, brightSight);
            const brightness = brightSight >= dimSight ? 1 : 0;

            // remove the existing two changes
            if (dimSightChange) changes.splice(changes.indexOf(dimSightChange), 1);
            if (brightSightChange) changes.splice(changes.indexOf(brightSightChange), 1);

            // create new changes
            const mode = dimSightChange?.mode ?? brightSightChange?.mode ?? 0;
            const priority = dimSightChange?.priority ?? brightSightChange?.priority ?? null;
            changes.push({ key: "ATL.sight.range", value: range, mode, priority });
            if (brightness !== 0)
                changes.push({ key: "ATL.sight.brightness", value: brightness, mode, priority });
        }

        if (changeFound) return changes;
    }
}

