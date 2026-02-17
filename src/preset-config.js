const { HandlebarsApplicationMixin, ApplicationV2, DocumentSheetV2, Base } = foundry.applications.api;
/**
 * The Application used for defining a preset configuration that can be used by the `ATL.preset`
 * active effect key. It can handle updating an existing preset as well as creating a new one.
 */
export class PresetConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  /**
   * Create a new application to add/edit a preset.    
   * @param {ApplicationConfiguration} options Options used to configure the Application instance
   * @param {Object} object The ATL preset, or `undefined` if creating a new one from scratch
   */
  constructor(options, object = {}) {
    super(options);

    /**
     * The token change preset
     */
    this.preset = object;

    /**
     * Whether this app is creating a new preset or not
     */
    this.newMode = !this.preset.id;

    /**
     * An array of form field names that were changed
     */
    this.fieldsChanged = [];
  }

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["preset-config"],
    tag: "form",
    position: {
      width: 560
    },
    window: {
      title: "ATL Light Editor",
      icon: "fas fa-plus-circle",
      contentClasses: ["standard-form"],
    },
    form: {
      handler: PresetConfig.#onSubmit,
      //submitOnChange: false,
      closeOnSubmit: true
    },
    actions: {
      addDetectionMode: PresetConfig.#onAddDetectionMode,
      removeDetectionMode: PresetConfig.#onRemoveDetectionMode
    }
  }

  /** @override */
  static PARTS = {
    header: {
      template: "modules/ATL/templates/header.hbs",
    },
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    appearance: {
      template: "modules/ATL/templates/appearance.hbs", scrollable: [""]
    },
    identity: {
      template: "modules/ATL/templates/identity.hbs", scrollable: [""]
    },
    vision: {
      template: "modules/ATL/templates/vision.hbs", scrollable: [""]
    },
    light: {
      template: "modules/ATL/templates/light.hbs", scrollable: [""]
    },
    //resources: {
    //  template: "modules/ATL/templates/resources.hbs", scrollable: [""]
    //},
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        { id: "identity", icon: "fa-solid fa-memo-pad" },
        { id: "appearance", icon: "fa-solid fa-square-user" },
        { id: "vision", icon: "fa-solid fa-eye" },
        { id: "light", icon: "fa-solid fa-lightbulb" }
        //{ id: "resources", icon: "fa-solid fa-heart" }
      ],
      initial: "appearance",
      labelPrefix: "TOKEN.TABS"
    }
  };

  /**
 * Localized Token Display Modes
 * @returns {Record<string, string>}
 */
  static get DISPLAY_MODES() {
    PresetConfig.#DISPLAY_MODES ??= Object.entries(CONST.TOKEN_DISPLAY_MODES).reduce((modes, [key, value]) => {
      modes[value] = game.i18n.localize(`TOKEN.DISPLAY_${key}`);
      return modes;
    }, {});
    return PresetConfig.#DISPLAY_MODES;
  }

  static #DISPLAY_MODES;

  /**
   * Localized Token Dispositions
   * @returns {Record<string, string>}
   */
  static get TOKEN_DISPOSITIONS() {
    PresetConfig.#TOKEN_DISPOSITIONS ??= Object.entries(CONST.TOKEN_DISPOSITIONS)
      .reduce((dispositions, [key, value]) => {
        dispositions[value] = game.i18n.localize(`TOKEN.DISPOSITION.${key}`);
        return dispositions;
      }, {});
    return PresetConfig.#TOKEN_DISPOSITIONS;
  }

  static #TOKEN_DISPOSITIONS;

  /**
   * Localized Token Turn Marker modes
   * @returns {Record<string, string>}
   */
  static get TURN_MARKER_MODES() {
    PresetConfig.#TURN_MARKER_MODES ??= Object.entries(CONST.TOKEN_TURN_MARKER_MODES)
      .reduce((modes, [key, value]) => {
        modes[value] = game.i18n.localize(`TOKEN.TURNMARKER.MODES.${key}`);
        return modes;
      }, {});
    return PresetConfig.#TURN_MARKER_MODES;
  }

  static #TURN_MARKER_MODES;

  /**
   * Localized Token Shapes
   * @returns {Record<string, string>}
   */
  static get TOKEN_SHAPES() {
    PresetConfig.#TOKEN_SHAPES ??= Object.entries(CONST.TOKEN_SHAPES)
      .reduce((shapes, [key, value]) => {
        shapes[value] = game.i18n.localize(`TOKEN.SHAPES.${key}.label`);
        return shapes;
      }, {});
    return PresetConfig.#TOKEN_SHAPES;
  }

  static #TOKEN_SHAPES;
  /* -------------------------------------------- */
  /**
 * Maintain a copy of the original to show a real-time preview of changes.
 * @type {TokenDocument|PrototypeToken|null}
 * @protected
 */
  _preview = null;

  /* -------------------------------------------- */

  /**
   * Process form submission for the sheet
   * @this {PresetConfig}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async #onSubmit(event, form, formData) {
    console.log("ATL |", "_updateObject called with formData:", formData.object);
    // Mirror token scale
    if ("scale" in formData.object) {
      formData.object["texture.scaleX"] = formData.object.scale * (formData.object.mirrorX ? -1 : 1);
      formData.object["texture.scaleY"] = formData.object.scale * (formData.object.mirrorY ? -1 : 1);
    }

    if (this.fieldsChanged.includes("scale" || "mirrorX" || "mirrorY")) this.fieldsChanged.push("texture.scaleX", "texture.scaleY");
    for (const key of ["scale", "mirrorX", "mirrorY"]) delete formData.object[key];

    // Set default name if creating a new preset with no name
    if (this.newMode && !formData.object.name) {
      const presets = game.settings.get("ATL", "presets");
      const count = presets?.length;
      formData.object.name = `New Preset (${count + 1})`;
      this.fieldsChanged.push("name")
    }

    // Remove name change if updating a preset and trying to clear the name
    if (!this.newMode && "name" in formData.object && !formData.object.name) delete formData.object.name;

    // apply the changes to the original preset
    Object.entries(formData.object)
      .filter(([k, _]) => this.fieldsChanged.includes(k))
      .forEach(([k, v]) => {
        if (v === "" || v === null) this._clearProperty(this.preset, k);
        else foundry.utils.setProperty(this.preset, k, v);
      });
    console.log("updated preset:", this.preset);

    PresetConfig.savePreset(this.preset);
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

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // prepare Preset data
    const preset = foundry.utils.deepClone(this.preset);

    return Object.assign(context, {
      rootId: this.id,
      object: preset,
      gridUnits: game.i18n.localize("GridUnits"),
      displayModes: PresetConfig.DISPLAY_MODES,
      visionModes: Object.values(CONFIG.Canvas.visionModes).filter((f) => f.tokenConfig),
      detectionModes: Object.values(CONFIG.Canvas.detectionModes).filter(f => f.tokenConfig),
      preparedDetectionModes: this.preset?.detectionModes,
      lightAnimations: Object.entries(CONFIG.Canvas.lightAnimations).reduce(
        (obj, e) => {
          obj[e[0]] = game.i18n.localize(e[1].label);
          return obj;
        },
        { "": game.i18n.localize("None") }
      ),
      shapes: PresetConfig.TOKEN_SHAPES,
      colorationTechniques: foundry.canvas.rendering.shaders.AdaptiveLightingShader.SHADER_TECHNIQUES,
      scale: (Math.abs(this.preset.texture?.scaleX) || 1),
      mirrorX: this.preset.texture?.scaleX < 0,
      mirrorY: this.preset.texture?.scaleY < 0,
      textureFitModes: CONST.TEXTURE_DATA_FIT_MODES.reduce((obj, fit) => {
        obj[fit] = game.i18n.localize(`TEXTURE_DATA.FIT.${fit}`);
        return obj;
      }, {}),
      movementActions: Object.entries(CONFIG.Token.movement.actions).reduce(
        (choices, [action, { label, canSelect }]) => {
          if (canSelect(this.token)) choices[action] = label;
          return choices;
        }, {}),
      dispositions: PresetConfig.TOKEN_DISPOSITIONS,
      buttons: [
        { type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" },
      ]
    });
  }
  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preFirstRender(context, options) {
    await super._preFirstRender(context, options);
  }

  /* -------------------------------------------- */

  /**
   * Mimic changes to the Token document as if they were true document updates.
   * @param {object} [changes]  The changes to preview.
   * @returns {void}
   * @protected
   */
  _previewChanges(changes) {
    if (!changes || !this._preview) return;
    const deletions = { "-=actorId": null, "-=actorLink": null };
    const mergeOptions = { inplace: false, performDeletions: true };
    this._preview.updateSource(mergeObject(changes, deletions, mergeOptions));
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    const tab = context.tabs[partId];
    if (tab) {
      context.tab = tab;
    }
    return context;
  }

  /* -------------------------------------------- */


  /** @inheritDoc */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);

    // save the field's name that was changed
    const el = event.target;
    if (el.name) this.fieldsChanged.push(el.name);
    // colorPicker has matching name in the dataset
    else if (el.dataset.edit) this.fieldsChanged.push(el.dataset.edit);
    console.log(this.fieldsChanged)
  }


  /* -------------------------------------------- */

  /**
   * Add a new detection mode to the Token preview.
   * @this {PresetConfig}
   * @type {ApplicationClickAction}
   */
  static async #onAddDetectionMode() {
    const formData = new FormDataExtended(this.form);
    const modes = Object.values(this._processFormData(event, this.form, formData).detectionModes ?? {});
    modes.push({ id: "", range: 0, enabled: true });
    this._previewChanges({ detectionModes: modes });
    await this.render({ parts: ["vision"], resetPreview: false });
  }

  /* -------------------------------------------- */

  /**
   * Remove a detection mode from the Token preview.
   * @this {PresetConfig}
   * @type {ApplicationClickAction}
   */
  static async #onRemoveDetectionMode(_event, target) {
    const formData = new FormDataExtended(this.form);
    const modes = Object.values(this._processFormData(event, this.form, formData).detectionModes ?? {});
    const index = Number(target.closest("[data-index]")?.dataset.index);
    modes.splice(index, 1);
    this._previewChanges({ detectionModes: modes });
    await this.render({ parts: ["vision"], resetPreview: false });

  }

  /** @inheritDoc */
  _processFormData(event, form, formData) {
    //const submitData = super._processFormData(event, form, formData);
    const submitData = foundry.utils.expandObject(formData.object);
    submitData.detectionModes ??= []; // Clear detection modes array
    this._processChanges(submitData);
    return submitData;
  }

  /**
 * Process several fields from form submission data into proper model changes.
 * @param {object} submitData Form submission data passed through {@link foundry.applications.ux.FormDataExtended}
 * @protected
 */
  _processChanges(submitData) {
    // Convert scale and mirror data from the form submission to TextureData changes
    // if (typeof submitData.scale === "number") {
    //   submitData.texture.scaleX = submitData.scale * (submitData.mirrorX ? -1 : 1);
    //   submitData.texture.scaleY = submitData.scale * (submitData.mirrorY ? -1 : 1);
    // }
    // for (const key of ["scale", "mirrorX", "mirrorY"]) delete submitData[key];

    // // Process token ring effects from the form submission
    // if (Array.isArray(submitData.ring?.effects)) {
    //   const TRE = CONFIG.Token.ring.ringClass.effects;
    //   let effects = submitData.ring.enabled ? TRE.ENABLED : TRE.DISABLED;
    //   for (const effectName of submitData.ring.effects) {
    //     const v = TRE[effectName] ?? 0;
    //     effects |= v;
    //   }
    //   submitData.ring.effects = effects;
    // }
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
        if (object[remainingKey] && foundry.utils.isEmpty(object[remainingKey]))
          this._clearProperty(object, remainingKey);
      }
    }

    // Return changed status
    return cleared;
  }

} 
