/**
 * The Application used for defining a preset configuration that can be used by the `ATL.preset`
 * active effect key. It can handle updating an existing preset as well as creating a new one.
 */
export class PresetConfig extends FormApplication {
  /**
   * Create a new application to add/edit a preset.
   * @param {Object} object The ATL preset, or `undefined` if creating a new one from scratch
   * @param {FormApplicationOptions} options Application configuration options
   */
  constructor(object = {}, options = {}) {
    super(object, options);

    /**
     * The token change preset
     */
    this.preset = this.object;

    /**
     * Whether this app is creating a new preset or not
     */
    this.newMode = !this.preset.id;

    /**
     * An array of form field names that were changed
     */
    this.fieldsChanged = [];
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet", "preset-config"],
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

  static savePreset(preset) {
    // put all the presets into a collection
    const collection = new Collection();
    let presets = game.settings.get("ATL", "presets");
    presets.forEach((p) => collection.set(p.id, p));

    // add or update in collection
    if (!preset.id) preset.id = foundry.utils.randomID();
    collection.set(preset.id, preset);

    // save collection
    presets = collection.toJSON();
    game.settings.set("ATL", "presets", presets);
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

  _getSubmitData(updateData = {}) {
    const formData = super._getSubmitData(updateData);

    // Mirror token scale
    if ("scale" in formData) {
      formData["texture.scaleX"] = formData.scale * (formData.mirrorX ? -1 : 1);
      formData["texture.scaleY"] = formData.scale * (formData.mirrorY ? -1 : 1);
    }
    ["scale", "mirrorX", "mirrorY"].forEach((k) => delete formData[k]);
    if (this.fieldsChanged.includes("scale")) this.fieldsChanged.push("texture.scaleX", "texture.scaleY");

    // Set default name if creating a new preset with no name
    if (this.newMode && !formData.name) {
      const presets = game.settings.get("ATL", "presets");
      const count = presets?.length;
      formData.name = `New Preset (${count + 1})`;
    }

    // Remove name change if updating a preset and trying to clear the name
    if (!this.newMode && "name" in formData && !formData.name) delete formData.name;

    return formData;
  }

  async _onChangeInput(event) {
    super._onChangeInput(event);

    // save the field's name that was changed
    const el = event.target;
    if (el.name) this.fieldsChanged.push(el.name);
    // colorPicker has matching name in the dataset
    else if (el.dataset.edit) this.fieldsChanged.push(el.dataset.edit);
  }

  async _updateObject(event, formData) {
    console.log("ATL |", "_updateObject called with formData:", formData);

    // apply the changes to the original preset
    Object.entries(formData)
      .filter(([k, _]) => this.fieldsChanged.includes(k))
      .forEach(([k, v]) => {
        if (v === "" || v === null) this._clearProperty(this.preset, k);
        else foundry.utils.setProperty(this.preset, k, v);
      });
    console.log("updated preset:", this.preset);

    PresetConfig.savePreset(this.preset);
  }

  _clearProperty(object, key) {
    let target = object;
    let cleared = false;
    let parts;

    // Convert the key to an object reference if it contains dot notation
    if (key.indexOf(".") !== -1) {
      parts = key.split(".");
      key = parts.pop();
      target = parts.reduce((o, i) => o[i], object);
    }

    // Update the target
    if (target && target.hasOwnProperty(key)) {
      cleared = true;
      delete target[key];
      // recursivly call to remove empty objects
      if (parts) {
        const remainingKey = parts.join(".");
        if (object[remainingKey] && isEmpty(object[remainingKey]))
          this._clearProperty(object, remainingKey);
      }
    }

    // Return changed status
    return cleared;
  }
}
