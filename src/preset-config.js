export class PresetConfig extends FormApplication {
  constructor(object = {}, options = {}) {
    super(object, options);

    /**
     * The token change preset
     */
    this.preset = this.object;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet"],
      title: "ATL Light Editor",
      template: "modules/ATL/templates/preset-config.hbs",
      width: 480,
      height: "auto",
      tabs: [
        {
          navSelector: '.tabs[data-group="main"]',
          contentSelector: "form",
          initial: "appearance",
        },
        {
          navSelector: '.tabs[data-group="light"]',
          contentSelector: '.tab[data-tab="light"]',
          initial: "basic",
        },
      ],
      closeOnSubmit: true,
    });
  }

  getData(options) {
    const gridUnits = game.system.gridUnits;

    // prepare Preset data
    const preset = foundry.utils.deepClone(this.object);

    return {
      object: preset,
      gridUnits: gridUnits || game.i18n.localize("GridUnits"),
      colorationTechniques: AdaptiveLightingShader.SHADER_TECHNIQUES,
      visionModes: Object.values(CONFIG.Canvas.visionModes).filter((f) => f.tokenConfig),
      lightAnimations: Object.entries(CONFIG.Canvas.lightAnimations).reduce(
        (obj, e) => {
          obj[e[0]] = game.i18n.localize(e[1].label);
          return obj;
        },
        { "": game.i18n.localize("None") }
      ),
      scale: Math.abs(this.object.texture?.scaleX || 1),
    };
  }

  async _updateObject(event, formData) {
    // TODO
    console.log("ATL |", "_updateObject called with formData:", formData);
  }
}
