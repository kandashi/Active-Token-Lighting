# Active-Token-Lighting


Active Token Lighting will dynamicly adjust token light settings based on active effects present on the actor. 
You can use the syntax `flags.ATL.lighting.X` as the attribute key. 
X can be:
- dimLight
- brightLight
- dimSight
- brightSight
- sightAngle
- lightColor
- colorIntensity
- lightAngle
- lightEffect (for this enter an object as the value, eg. `{"type":"torch","speed":1,"intensity":1}` )

To adjust token size you can use `flags.ATL.size.X` where X can be:
- height
- width
- scale

There are 3 preset values for torch, lantern and candle. Use `flags.ATL.lighting.preset` and value of the name in lowercase `torch`, `lantern`, `candle`. These will override custom values set in other flags.

Works very well alongside DAE for equip-toggle effects (Goggles of Night for example) or with Midi QoL for consumables (like torches)

![Torch config](https://github.com/kandashi/Active-Token-Lighting/blob/main/Images/Torch%20config.PNG)
![Goggles of Night config](https://github.com/kandashi/Active-Token-Lighting/blob/main/Images/Goggles%20of%20Night%20config.PNG)
![Active Lighting](https://github.com/kandashi/Active-Token-Lighting/blob/main/Images/Active%20Token%20Lighting%20Demo.gif?raw=true)

## Modes
- Add will only add onto a current existing ATL flag, not onto the existing actor vision
- Upgrade will do as expected
- Override will only override other ATL flags, not the actor default
- Custom and Multiply do not work


## Presets
- 3 preset values 
-  Torch
            dimLight = "40";
            brightLight = "20";
            lightColor = "#a2642a";
            lightEffect = {
                'type': 'torch',
                'speed': 1,
                'intensity': 1
            }
            colorIntensity = "0.4"

- Lantern"
            dimLight = "60";
            brightLight = "30";
            lightColor = "#a2642a";
            lightEffect = {
                'type': 'torch',
                'speed': 1,
                'intensity': 1
            };
            colorIntensity = "0.4"
        
- Candle
            dimLight = "10";
            brightLight = "2";
            lightColor = "#a2642a";
            lightEffect = {
                'type': 'torch',
                'speed': 1,
                'intensity': 1
            };
            colorIntensity = "0.2"


## Upcoming
- Different presets based on game system values
