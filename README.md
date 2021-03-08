# Active-Token-Lighting

### 0.2.0 Update
This is a large update that fundamentally changes the backend framework of the module. Your current ATL effects will not be changed in function, but you will get warnings to change to the new syntax. This will be slowly phased out over updates. Any ATL flag will now adjust a linked actor Prototype Token to match the data, these will carry between scenes as they should. The `lightEffect` key has been changed to `lightAnimation` any previous `lightEffect` flags will not work and need to be updated immediately. 

Active Token Lighting will dynamically adjust token light settings based on active effects present on the actor. 
You can use the syntax `ATL.X` as the attribute key. 
X can be:
- dimLight
- brightLight
- dimSight
- brightSight
- sightAngle
- lightColor
- colorIntensity
- lightAngle
- lightAnimation (for this enter an object as the value, eg. `{"type":"torch","speed":1,"intensity":1}` )

To adjust token size you can use `ATL.Y` where X can be:
- height
- width
- scale

There are 3 preset values for torch, lantern and candle. Use `ATL.preset` and value of the name in lowercase `torch`, `lantern`, `candle`. These will override custom values set in other flags.

Works very well alongside DAE for equip-toggle effects (Goggles of Night for example) or with Midi QoL for consumables (like torches)


## Modes
Modes will act the same as standard active effects

## Presets
- 3 preset values 
-  Torch
            dimLight = "40";
            brightLight = "20";
            lightColor = "#a2642a";
            lightAnimation = {
                'type': 'torch',
                'speed': 1,
                'intensity': 1
            }
            colorIntensity = "0.4"

- Lantern"
            dimLight = "60";
            brightLight = "30";
            lightColor = "#a2642a";
            lightAnimation = {
                'type': 'torch',
                'speed': 1,
                'intensity': 1
            };
            colorIntensity = "0.4"
        
- Candle
            dimLight = "10";
            brightLight = "2";
            lightColor = "#a2642a";
            lightAnimation = {
                'type': 'torch',
                'speed': 1,
                'intensity': 1
            };
            colorIntensity = "0.2"


## Altering presets or adding new ones
- You can now add to; remove, or alter the existing presets
- In the lighting menu is a plus button to trigger the UpdatePresets command from below
- 4 macro/console commands :
    - ATL.AddPreset() takes 2 arguments, the name of the preset to add and the obeject to add
    - ATL.RemovePreset() takes the name of the preset to be removed
    - ATL.GeneratePreset() will open a dialog to create a new preset
    - ATL.UpdatePresets() will open a dialog to edit,delete,add presets
- Use the presets in the same way with `flags.ATL.lighting.preset` with a value of the preset name

## Complications
- At the moment `flags.ATL.lighting.lightEffect` will not correctly apply if this effect is applied through Midi QoL
