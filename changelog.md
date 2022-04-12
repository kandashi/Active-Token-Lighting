### 0.2.15
- internal changes of `colorIntensity` to `lightAlpha`
- added a update pathway for future breaking changes
- fixed issues with presets overwriting values when set to 0, instead of removing them (now leave fields blank for no change)

### 0.2.16
- fixed bug with presets and lightAlpha 
- Fixed item compendium for lightAlpha update

### 0.4.0
Changed to base of Prototype Token data, makes failure of the module less invasive
Fixed various integer/boolean/numeric issues
Fixed "unavaliable" effect issues
-key point is that you must run ATLUpdate.massFlagUpdate() as a script macro/command when you load in a new world (otherwise you'll have to manually update some prototype tokens)
    This will update in-world actors/tokens but not compendium actors. You can use ATLUpdate.flagBuster(actor) to individually update actors