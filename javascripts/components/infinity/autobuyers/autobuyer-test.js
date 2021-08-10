"use strict";


Vue.component("many-autobuyers", {
  // There are two types of display: multiple and single.
  // Dimensions and Arrays both use multiple, and are separated purely for backend reasons.
  computed: {
    dimensions() {
      return Autobuyers.display[0];
    },
    arrays() {
      return Autobuyers.display[1];
    },
    singles() {
      return Autobuyers.display[2];
    }
  },
  template: `
    <span>
      <multi-autobuyer-panel
        v-for="(type, id) in dimensions"
        :autobuyers="type"
        :key="id"
      />
      <multi-autobuyer-panel
        v-for="(type, id) in arrays"
        :autobuyers="type"
        :key="1000 + id"
      />
      <generic-single-autobuyer
        v-for="(type, id) in singles"
        :autobuyer="type[0]"
        :key="2000 + id"
      />
    </span>`
});

Vue.component("generic-single-autobuyer", {
  props: {
    autobuyer: Object,
  },
  data() {
    return {
      isUnlocked: false,
    };
  },
  computed: {
    name() {
      return this.autobuyer.name;
    },
  },
  methods: {
    update() {
      this.isUnlocked = this.autobuyer.isUnlocked;
    },
  },
  template: `
    <span class="c-autobuyer-box-row" styles="display: flex" v-if="isUnlocked">
      <automator-inner-toggle-label :autobuyer="autobuyer" />
      <div>
        {{ name }}
        <autobuyer-interval-label :autobuyer="autobuyer" />
      </div>
    </span>`
});


Vue.component("multi-autobuyer-panel", {
  props: {
    autobuyers: Array,
  },
  data() {
    return {
      anyUnlocked: false,
      sameInterval: false,
      sameBulk: false,
    };
  },
  computed: {
    name() {
      return this.autobuyers.name;
    },
    boxSize() {
      // The width of the name panel is 20% - the other 80% is divvied up between the multiple autobuyers.
      return `width: ${80 / this.autobuyers.length}%`;
    },
    showAutobuyers() {
      // Only display the Antimatter Dimension Autobuyers if the bulk is the same and there are any of them unlocked
      if (this.name === Autobuyers.antimatterDimensions.name) return this.sameBulk && this.anyUnlocked;
      return this.anyUnlocked;
    }
  },
  methods: {
    update() {
      // If any of the autobuyers are unlocked, we should display the whole thing.
      this.anyUnlocked = this.autobuyers.some(x => x.isUnlocked);
      // If the first autobuyer's interval isn't undefined, check if all the intervals are the same - if they are
      // we should show the interval on the main autobuyer instead of on each of the sub autobuyers.
      const sameIntervalSet = new Set(this.autobuyers.map(x => x.interval));
      this.sameInterval = !sameIntervalSet.has(undefined) && sameIntervalSet.size === 1;
      // If the first autobuyer's bulk is unlimited, the bulks are the same. Otherwise, we have to check if all the
      // other bulks are the same.
      // If they are the same, we should show it on the main instead of on each of the sub autobuyers.
      const sameBulkSet = new Set(this.autobuyers.map(x => x.bulk));
      this.sameBulk = this.autobuyers[0].hasUnlimitedBulk || sameBulkSet.size === 1;
    },
  },
  template: `
    <span
      class="c-autobuyer-box-row"
      styles="display: flex; padding: 0.25rem"
      v-if="showAutobuyers"
    >
      <div class="l-autobuyer-box__header--new">
        {{ name }}<br>Autobuyers
        <autobuyer-interval-label
          v-if="sameInterval || sameBulk"
          :autobuyer="autobuyers[0]"
          :showInterval="sameInterval"
          :showBulk="sameBulk"
        />
      </div>
      <tiny-autobuyer
        v-for="(autobuyer, id) in autobuyers"
        :autobuyer="autobuyer"
        :style="boxSize"
        :key="id"
        :showInterval="!sameInterval"
        :showBulk="!sameBulk"
      />
    </span>`
});


Vue.component("tiny-autobuyer", {
  props: {
    autobuyer: Object,
    // You may notice that there are no autobuyers where showInterval or showBulk would apply - they are always the same
    // This is for future-proofing, also for the sunk costs fallacy after trying to fully integrate ADs into this system
    showInterval: Boolean,
    showBulk: Boolean,
  },
  data() {
    return {
      isVisible: false,
    };
  },
  computed: {
    name() {
      return this.autobuyer.name;
    },
    hasMode() {
      return this.autobuyer.mode !== undefined;
    },
  },
  methods: {
    update() {
      const buyer = this.autobuyer;
      this.isVisible = buyer.isUnlocked || buyer.isBought;
    },
  },
  template: `
    <span v-if="isVisible" class="c-autobuyer-box-slot">
      <automator-inner-toggle-label :autobuyer="autobuyer" />
      {{ name }}
      <autobuyer-interval-label :autobuyer="autobuyer" :showInterval="showInterval" :showBulk="showBulk" />
      <mode-button v-if="hasMode" :autobuyer="autobuyer" />
    </span>`
});

Vue.component("automator-inner-toggle-label", {
  props: {
    autobuyer: Object,
  },
  data() {
    return {
      isActive: false,
      globalToggle: false,
    };
  },
  computed: {
    name() {
      return this.autobuyer.name;
    },
    autobuyerToggleClass() {
      return this.isActive ? "fas fa-check" : "fas fa-times";
    },
    autobuyerStateClass() {
      return {
        "o-autobuyer-toggle-checkbox__label": true,
        "o-autobuyer-toggle-checkbox__label--active": this.isActive,
        "o-autobuyer-toggle-checkbox__label--disabled": !this.globalToggle
      };
    },
  },
  methods: {
    update() {
      this.isActive = this.autobuyer.isActive;
      this.globalToggle = player.auto.autobuyersOn;
    },
    toggle() {
      this.autobuyer.toggle();
    },
  },
  template: `
    <div class="l-autobuyer-box__footer" @click="toggle">
      <label
        :for="name"
        :class="autobuyerStateClass"
      >
        <span :class="autobuyerToggleClass"></span>
      </label>
      <input
        :checked="isActive && globalToggle"
        :disabled="!globalToggle"
        :name="name"
        type="checkbox"
      />
    </div>`
});

Vue.component("mode-button", {
  props: {
    autobuyer: Object,
  },
  data() {
    return {
      mode: AUTOBUYER_MODE.BUY_SINGLE
    };
  },
  computed: {
    modeDisplay() {
      switch (this.mode) {
        case AUTOBUYER_MODE.BUY_SINGLE: return "Buys singles";
        case AUTOBUYER_MODE.BUY_10: return "Buys max";
      }
      throw "Unknown Dimension Autobuyer mode";
    }
  },
  methods: {
    update() {
      this.mode = this.autobuyer.mode;
    },
    toggleMode() {
      this.autobuyer.toggleMode();
      this.update();
    }
  },
  template: `
    <button
      class="o-autobuyer-btn"
      style="width: 80%"
      @click="toggleMode"
    >
      {{ modeDisplay }}
    </button>`
});

Vue.component("autobuyer-interval-label", {
  props: {
    autobuyer: Object,
    showInterval: {
      type: Boolean,
      default: true,
    },
    showBulk: {
      type: Boolean,
      default: true,
    }
  },
  data() {
    return {
      interval: 0,
      bulk: 0,
      bulkUnlimited: false,
      displayInterval: false,
      displayBulk: false,
    };
  },
  computed: {
    // Rounds UP to the nearest 0.01 so that eg. 0.103 doesn't display as 0.10, appearing maxed when it isn't
    intervalDisplay() {
      const sec = TimeSpan.fromMilliseconds(this.interval).totalSeconds;
      return format(Math.ceil(100 * sec) / 100, 2, 2);
    }
  },
  methods: {
    update() {
      const buyer = this.autobuyer;
      this.interval = buyer.interval;
      this.bulk = buyer.bulk;
      this.bulkUnlimited = buyer.hasUnlimitedBulk;
      // We should only be displaying the interval if the interval is both !0 and !undefined, and we are told to show it
      this.displayInterval = this.showInterval && this.interval > 0;
      // We should only show the bulk if it is unlimited (to show "Unlimited"), or has a bulk amount, to show the bulk
      // amount. Additionally, it should only be shown if we are told to do so.
      this.displayBulk = this.showBulk && (this.bulkUnlimited || this.bulk > 0);
    }
  },
  template: `
    <div class="c-autobuyer-box__small-text">
      <span v-if="displayInterval">Current interval: {{ intervalDisplay }} seconds</span>
      <span v-if="displayBulk">
        <br v-if="displayInterval">Current bulk: {{ bulkUnlimited ? "Unlimited" : formatX(bulk, 2) }}
      </span>
    </div>`
});
