# Active-Token-Effects

Active Token Effects works as active effects for token data. This means any token data can be controlled through an Active Effect: size, lighting, vision, image etc.

You can use the syntax `ATL.X` as the attribute key for the active effect. Where `X` is the data path you wish to change.
For example to change dimSight on a token use `ATL.sight.dim` as the attribute key

There are 3 preset values for torch, lantern and candle. Use `ATL.preset` and value of the name in lowercase `torch`, `lantern`, `candle` and `flashlight`. These will override custom values set in other flags.

Works very well alongside DAE for equip-toggle effects (Goggles of Night for example) or with Midi QoL for consumables (like torches)

## System Compatibility

Most game systems work out-of-the-box, including those using the new active effect transferral mode introduced in Foundry v11. There is, hoever, some code for specific systems to improve compatibility:

- D&D 5e: Active effects on items only apply when equipped and attuned (if applicable), so there's special handling when those are changed (e.g. unequipping an item with an effect will turn off the effect)
- Warhammer Fantasy Roleplay 4e: same as above with equipped items
- Savage Worlds Adventure Edition: same as above with equippable items

## Premade Items

 These are made and (and only compatible with) the dnd5e system, but the syntax will apply across all systems.

## Modes

Modes will act the same as standard active effects. Note that any effect with a non-numeric value, eg light animation, will require OVERRIDE.

## Altering presets or adding new ones

- You can now add to; remove, or alter the existing presets
- In the lighting menu is a plus button to trigger the UpdatePresets command from below
- 4 macro/console commands :
  - ATL.AddPreset() takes 2 arguments, the name of the preset to add and the object to add
  - ATL.RemovePreset() takes the name of the preset to be removed
  - ATL.GeneratePreset() will open a dialog to create a new preset
  - ATL.UpdatePresets() will open a dialog to edit,delete,add presets
- Use the presets in the same way with `ATL.preset` with a value of the preset name.

