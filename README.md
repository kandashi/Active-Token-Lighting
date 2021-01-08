# Active-Token-Lighting


Active Token Lighting will dynamicly adjust token light settings based on active effects present on the actor. 
You can use the syntax `flags.ATL.lighting.dimLight/brightLight/dimSight/brightSight` as the attribute key. 

Works very well alongside DAE for equip-toggle effects (Goggles of Night for example) or with Midi QoL for consumables (like torches)

![Torch config](https://github.com/kandashi/Active-Token-Lighting/blob/main/Images/Torch%20config.PNG)
![Goggles of Night config](https://github.com/kandashi/Active-Token-Lighting/blob/main/Images/Goggles%20of%20Night%20config.PNG)
![Active Lighting](https://github.com/kandashi/Active-Token-Lighting/blob/main/Images/Active%20Token%20Lighting.gif?raw=true)

## Modes
- Add will only add onto a current existing ATL flag, not onto the existing actor vision
- Upgrade will do as expected
- Override will only override other ATL flags, not the actor default
- Custom and Multiply do not work
