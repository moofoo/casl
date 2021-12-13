import { PureAbility } from '@casl/ability';
import { signalBindings } from 'aurelia-framework';

const ABILITY_CHANGED_SIGNAL = 'caslAbilityChanged';
const HAS_AU_SUBSCRIPTION = new WeakMap();

class AbilityValueConverter {
  constructor(ability) {
    this.signals = [ABILITY_CHANGED_SIGNAL];
    this._ability = ability;
  }

  can(...args) {
    if (!HAS_AU_SUBSCRIPTION.has(this._ability)) {
      this._ability.on('updated', () => signalBindings(ABILITY_CHANGED_SIGNAL));

      HAS_AU_SUBSCRIPTION.set(this._ability, true);
    }

    return this._ability.can(...args);
  }

}

AbilityValueConverter.inject = [PureAbility];
class CanValueConverter extends AbilityValueConverter {
  toView(subject, action, field) {
    // eslint-disable-next-line
    console.warn('`can` value converter is deprecated. Use `able` converter instead');
    return this.can(action, subject, field);
  }

}
CanValueConverter.$resource = {
  name: 'can',
  type: 'valueConverter'
};
class AbleValueConverter extends AbilityValueConverter {
  toView(...args) {
    return this.can(...args);
  }

}
AbleValueConverter.$resource = {
  name: 'able',
  type: 'valueConverter'
};

function configure(config, defaultAbility) {
  if (defaultAbility && defaultAbility instanceof PureAbility) {
    config.container.registerInstance(PureAbility, defaultAbility);
  }

  config.globalResources([CanValueConverter, AbleValueConverter]);
}

export { AbleValueConverter, CanValueConverter, configure };
//# sourceMappingURL=index.mjs.map
