/* Preset Editor (Application V2)
 * Usage:
 *   new PresetConfig(presetObj?).render(true)
 *   - If presetObj is omitted → create new preset.
 *   - If presetObj has an id → edit/update existing preset.
 */
export class PresetConfig extends foundry.applications.api.ApplicationV2 {
  /** @param {object} preset - optional existing preset object */
  constructor(preset = {}) {
    super();
    this._incomingPreset = preset;
  }

  // ---------- ApplicationV2 options ----------
  static DEFAULT_OPTIONS = {
    id: "atl-preset-config",
    title: "ATL Preset",
    classes: ["atl", "preset-config"],
    width: 520,
    height: "auto",
    resizable: true,
    modal: true
  };

  // ---------- Data prep for render ----------
  async _prepareContext(_options) {
    // Provide defaults for a new preset
    const defaults = {
      id: this._incomingPreset?.id ?? null,
      name: this._incomingPreset?.name ?? "",
      light: {
        dim: getProperty(this._incomingPreset, "light.dim") ?? 40,
        bright: getProperty(this._incomingPreset, "light.bright") ?? 20,
        color: getProperty(this._incomingPreset, "light.color") ?? "#ffffff",
        alpha: getProperty(this._incomingPreset, "light.alpha") ?? 0.5,
        animation: {
          type: getProperty(this._incomingPreset, "light.animation.type") ?? "torch",
          speed: getProperty(this._incomingPreset, "light.animation.speed") ?? 1,
          intensity: getProperty(this._incomingPreset, "light.animation.intensity") ?? 1
        }
      }
    };

    // animation type options (extend as needed)
    const animationTypes = [
      "torch", "pulse", "chroma", "wave", "fog", "sunburst", "dome",
      "emanation", "hexa", "ghost", "energy", "roiling", "radial",
      "flicker", "blackHole", "none"
    ];

    return {
      preset: defaults,
      isEditing: !!defaults.id,
      animationTypes
    };
  }

  // ---------- Render HTML ----------
  async _renderHTML(context, _options) {
    const p = context.preset;
    const types = context.animationTypes.map(t =>
      `<option value="${t}" ${t === p.light.animation.type ? "selected" : ""}>${t}</option>`
    ).join("");

    return `
      <div class="atl-preset-editor">
        <div class="form-group" style="padding: 12px 16px;">
          <label>Name</label>
          <input type="text" name="name" value="${foundry.utils.escapeHTML(p.name)}" placeholder="Preset name" />
        </div>

        <fieldset style="margin: 8px 12px 0; padding: 8px 12px; border-radius: 8px;">
          <legend>Light</legend>

          <div class="form-fields" style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <label>Dim Distance (ft)<input type="number" step="1" min="0" name="light.dim" value="${p.light.dim}"></label>
            <label>Bright Distance (ft)<input type="number" step="1" min="0" name="light.bright" value="${p.light.bright}"></label>

            <label>Color<input type="color" name="light.color" value="${p.light.color}"></label>
            <label>Alpha (0–1)<input type="number" step="0.05" min="0" max="1" name="light.alpha" value="${p.light.alpha}"></label>

            <label>Animation Type
              <select name="light.animation.type">${types}</select>
            </label>
            <label>Animation Speed
              <input type="number" step="0.1" min="0" name="light.animation.speed" value="${p.light.animation.speed}">
            </label>
            <label>Animation Intensity
              <input type="number" step="0.1" min="0" name="light.animation.intensity" value="${p.light.animation.intensity}">
            </label>
          </div>
        </fieldset>

        <footer class="sheet-footer flexrow" style="gap: 8px; padding: 12px;">
          <button type="button" data-action="save" class="save"><i class="fas fa-save"></i> Save</button>
          ${context.isEditing ? `<button type="button" data-action="delete" class="danger"><i class="fas fa-trash-alt"></i> Delete</button>` : ""}
          <button type="button" data-action="cancel"><i class="fas fa-times"></i> Cancel</button>
        </footer>
      </div>`;
  }

  // ---------- Inject + listeners ----------
  async _replaceHTML(elementOrHtml, htmlOrElement, _options) {
    // Normalize param order (some builds pass html first, element second)
    let target = elementOrHtml;
    let content = htmlOrElement;
    const isEl = (n) => n && typeof n === "object" && n.nodeType === 1;
    if (typeof target === "string" && isEl(content)) [target, content] = [content, target];
    if (!isEl(target)) target = this.element;
    if (!target) return;

    if (typeof content === "string") target.innerHTML = content;
    else if (isEl(content)) target.replaceChildren(content);
    else target.innerHTML = String(content ?? "");

    const root = target;

    // Buttons
    root.querySelector('[data-action="save"]')?.addEventListener("click", () => this._onSave(root));
    root.querySelector('[data-action="cancel"]')?.addEventListener("click", () => this.close());
    root.querySelector('[data-action="delete"]')?.addEventListener("click", () => this._onDelete());
  }

  // ---------- Helpers ----------
  _readForm(root) {
    const val = (sel) => root.querySelector(sel)?.value ?? "";
    const num = (sel, fallback = 0) => {
      const v = parseFloat(val(sel));
      return Number.isFinite(v) ? v : fallback;
    };

    const name = String(val('input[name="name"]')).trim();

    return {
      // Keep existing id if editing; generate if new
      id: this._incomingPreset?.id ?? randomID(10),
      name,
      light: {
        dim: num('input[name="light.dim"]', 0),
        bright: num('input[name="light.bright"]', 0),
        color: String(val('input[name="light.color"]') || "#ffffff"),
        alpha: num('input[name="light.alpha"]', 0.5),
        animation: {
          type: String(val('select[name="light.animation.type"]') || "none"),
          speed: num('input[name="light.animation.speed"]', 1),
          intensity: num('input[name="light.animation.intensity"]', 1)
        }
      }
    };
  }

  async _onSave(root) {
    const data = this._readForm(root);

    if (!data.name) {
      ui.notifications.warn("ATL: Please give the preset a name.");
      return;
    }

    // Load current presets
    const presets = await game.settings.get("ATL", "presets") ?? [];

    // If editing, replace by id; otherwise push
    const idx = presets.findIndex(p => p.id === data.id);
    if (idx >= 0) presets[idx] = data;
    else presets.push(data);

    await game.settings.set("ATL", "presets", presets);
    ui.notifications.info("ATL: Preset saved.");
    this.close();
  }

  async _onDelete() {
    const currentId = this._incomingPreset?.id;
    if (!currentId) return this.close();

    const confirmed = await Dialog.confirm({
      title: "Delete Preset",
      content: `<p>Are you sure you want to delete this preset?</p>`
    });
    if (!confirmed) return;

    const presets = await game.settings.get("ATL", "presets") ?? [];
    const idx = presets.findIndex(p => p.id === currentId);
    if (idx >= 0) {
      presets.splice(idx, 1);
      await game.settings.set("ATL", "presets", presets);
      ui.notifications.info("ATL: Preset deleted.");
    }
    this.close();
  }
}

/** Utility: Foundry-style random id (10 chars) if not globally present */
function randomID(length = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
