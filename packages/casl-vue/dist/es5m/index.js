import { ref, inject, provide, defineComponent } from 'vue';
import { PureAbility } from '@casl/ability';

function reactiveAbility(ability) {
  if (ability.hasOwnProperty('possibleRulesFor')) {
    return ability;
  }

  var watcher = ref(true);
  ability.on('updated', function () {
    watcher.value = !watcher.value;
  });
  var possibleRulesFor = ability.possibleRulesFor.bind(ability);

  ability.possibleRulesFor = function (action, subject) {
    watcher.value = watcher.value; // eslint-disable-line

    return possibleRulesFor(action, subject);
  };

  ability.can = ability.can.bind(ability);
  ability.cannot = ability.cannot.bind(ability);
  return ability;
}

var ABILITY_TOKEN = Symbol('ability');
function useAbility() {
  var ability = inject(ABILITY_TOKEN);

  if (!ability) {
    throw new Error('Cannot inject Ability instance because it was not provided');
  }

  return ability;
}
function provideAbility(ability) {
  provide(ABILITY_TOKEN, reactiveAbility(ability));
}

function detectSubjectProp(props) {
  if ('a' in props) {
    return 'a';
  }

  if ('this' in props) {
    return 'this';
  }

  if ('an' in props) {
    return 'an';
  }

  return '';
}

var Can = defineComponent({
  name: 'Can',
  props: {
    I: String,
    do: String,
    a: [String, Function],
    an: [String, Function],
    this: [String, Function, Object],
    on: [String, Function, Object],
    not: Boolean,
    passThrough: Boolean,
    field: String
  },
  setup: function setup(props, _ref) {
    var slots = _ref.slots;
    var $props = props;
    var actionProp = 'do';
    var subjectProp = 'on';

    if (!(actionProp in props)) {
      actionProp = 'I';
      subjectProp = detectSubjectProp(props);
    }

    if (!$props[actionProp]) {
      throw new Error('Neither `I` nor `do` prop was passed in <Can>');
    }

    if (!slots.default) {
      throw new Error('Expects to receive default slot');
    }

    var ability = useAbility();
    return function () {
      var isAllowed = ability.can($props[actionProp], $props[subjectProp], $props.field);
      var canRender = props.not ? !isAllowed : isAllowed;

      if (!props.passThrough) {
        return canRender ? slots.default() : null;
      }

      return slots.default({
        allowed: canRender,
        ability: ability
      });
    };
  }
});

function abilitiesPlugin(app, ability, options) {
  if (!ability || !(ability instanceof PureAbility)) {
    throw new Error('Please provide an Ability instance to abilitiesPlugin plugin');
  }

  app.provide(ABILITY_TOKEN, reactiveAbility(ability));

  if (options && options.useGlobalProperties) {
    app.config.globalProperties.$ability = ability;
    app.config.globalProperties.$can = ability.can.bind(ability);
  }
}

export { ABILITY_TOKEN, Can, abilitiesPlugin, provideAbility, useAbility };
//# sourceMappingURL=index.js.map
