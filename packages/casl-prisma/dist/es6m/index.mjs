import { FieldCondition, CompoundCondition, NULL_CONDITION, ObjectQueryParser, buildAnd, createTranslatorFactory } from '@ucast/core';
import { createJsInterpreter, eq, ne, within as within$1, lt as lt$1, lte, gt, gte, and, or, compare } from '@ucast/js';
import { rulesToQuery } from '@casl/ability/extra';
import { ForbiddenError, PureAbility, fieldPatternMatcher } from '@casl/ability';

class ParsingQueryError extends Error {
  static invalidArgument(operatorName, value, expectValueType) {
    const valueType = `${typeof value}(${JSON.stringify(value, null, 2)})`;
    return new this(`"${operatorName}" expects to receive ${expectValueType} but instead got "${valueType}"`);
  }

}

const isPlainObject = value => {
  return value && (value.constructor === Object || !value.constructor);
};

const equals = {
  type: 'field',

  validate(instruction, value) {
    if (Array.isArray(value) || isPlainObject(value)) {
      throw new ParsingQueryError(`"${instruction.name}" does not supports comparison of arrays and objects`);
    }
  }

};
const not$1 = {
  type: 'field',

  parse(instruction, value, {
    hasOperators,
    field,
    parse
  }) {
    if (isPlainObject(value) && !hasOperators(value) || Array.isArray(value)) {
      throw new ParsingQueryError(`"${instruction.name}" does not supports comparison of arrays and objects`);
    }

    if (!isPlainObject(value)) {
      return new FieldCondition('notEquals', field, value);
    }

    return new CompoundCondition('NOT', [parse(value, {
      field
    })]);
  }

};
const within = {
  type: 'field',

  validate(instruction, value) {
    if (!Array.isArray(value)) {
      throw ParsingQueryError.invalidArgument(instruction.name, value, 'an array');
    }
  }

};
const lt = {
  type: 'field',

  validate(instruction, value) {
    const type = typeof value;
    const isComparable = type === 'string' || type === 'number' && Number.isFinite(value) || value instanceof Date;

    if (!isComparable) {
      throw ParsingQueryError.invalidArgument(instruction.name, value, 'comparable value');
    }
  }

};
const POSSIBLE_MODES = new Set(['insensitive', 'default']);
const mode = {
  type: 'field',

  validate(instruction, value) {
    if (!POSSIBLE_MODES.has(value)) {
      throw ParsingQueryError.invalidArgument(instruction.name, value, `one of ${Array.from(POSSIBLE_MODES).join(', ')}`);
    }
  },

  parse: () => NULL_CONDITION
};
const compareString = {
  type: 'field',

  validate(instruction, value) {
    if (typeof value !== 'string') {
      throw ParsingQueryError.invalidArgument(instruction.name, value, 'string');
    }
  },

  parse(instruction, value, {
    query,
    field
  }) {
    const name = query.mode === 'insensitive' ? `i${instruction.name}` : instruction.name;
    return new FieldCondition(name, field, value);
  }

};
const compound = {
  type: 'compound',

  validate(instruction, value) {
    if (!value || typeof value !== 'object') {
      throw ParsingQueryError.invalidArgument(instruction.name, value, 'an array or object');
    }
  },

  parse(instruction, arrayOrObject, {
    parse
  }) {
    const value = Array.isArray(arrayOrObject) ? arrayOrObject : [arrayOrObject];
    const conditions = value.map(v => parse(v));
    return new CompoundCondition(instruction.name, conditions);
  }

};
const isEmpty$1 = {
  type: 'field',

  validate(instruction, value) {
    if (typeof value !== 'boolean') {
      throw ParsingQueryError.invalidArgument(instruction.name, value, 'a boolean');
    }
  }

};
const has$1 = {
  type: 'field'
};
const hasSome$1 = {
  type: 'field',

  validate(instruction, value) {
    if (!Array.isArray(value)) {
      throw ParsingQueryError.invalidArgument(instruction.name, value, 'an array');
    }
  }

};
const relation = {
  type: 'field',

  parse(instruction, value, {
    field,
    parse
  }) {
    if (!isPlainObject(value)) {
      throw ParsingQueryError.invalidArgument(instruction.name, value, 'a query for nested relation');
    }

    return new FieldCondition(instruction.name, field, parse(value));
  }

};

const inverted = (name, baseInstruction) => {
  const parse = baseInstruction.parse;

  if (!parse) {
    return Object.assign({}, baseInstruction, {
      parse(_, value, ctx) {
        return new CompoundCondition('NOT', [new FieldCondition(name, ctx.field, value)]);
      }

    });
  }

  return Object.assign({}, baseInstruction, {
    parse(instruction, value, ctx) {
      const condition = parse(instruction, value, ctx);

      if (condition.operator !== instruction.name) {
        throw new Error(`Cannot invert "${name}" operator parser because it returns a complex Condition`);
      }

      condition.operator = name;
      return new CompoundCondition('NOT', [condition]);
    }

  });
};

const instructions = {
  equals,
  not: not$1,
  in: within,
  notIn: inverted('in', within),
  lt,
  lte: lt,
  gt: lt,
  gte: lt,
  mode,
  startsWith: compareString,
  endsWith: compareString,
  contains: compareString,
  isEmpty: isEmpty$1,
  has: has$1,
  hasSome: hasSome$1,
  hasEvery: hasSome$1,
  NOT: compound,
  AND: compound,
  OR: compound,
  every: relation,
  some: relation,
  none: inverted('some', relation),
  is: relation,
  isNot: inverted('is', relation)
};
class PrismaQueryParser extends ObjectQueryParser {
  constructor() {
    super(instructions, {
      defaultOperatorName: 'equals'
    });
  }

  parse(query, options) {
    if (options && options.field) {
      return buildAnd(this.parseFieldOperators(options.field, query));
    }

    return super.parse(query);
  }

}

const startsWith = (condition, object, {
  get
}) => {
  return get(object, condition.field).startsWith(condition.value);
};

const istartsWith = (condition, object, {
  get
}) => {
  return get(object, condition.field).toLowerCase().startsWith(condition.value.toLowerCase());
};

const endsWith = (condition, object, {
  get
}) => {
  return get(object, condition.field).endsWith(condition.value);
};

const iendsWith = (condition, object, {
  get
}) => {
  return get(object, condition.field).toLowerCase().endsWith(condition.value.toLowerCase());
};

const contains = (condition, object, {
  get
}) => {
  return get(object, condition.field).includes(condition.value);
};

const icontains = (condition, object, {
  get
}) => {
  return get(object, condition.field).toLowerCase().includes(condition.value.toLowerCase());
};

const isEmpty = (condition, object, {
  get
}) => {
  const value = get(object, condition.field);
  const empty = Array.isArray(value) && value.length === 0;
  return empty === condition.value;
};

const has = (condition, object, {
  get
}) => {
  const value = get(object, condition.field);
  return Array.isArray(value) && value.includes(condition.value);
};

const hasSome = (condition, object, {
  get
}) => {
  const value = get(object, condition.field);
  return Array.isArray(value) && condition.value.some(v => value.includes(v));
};

const hasEvery = (condition, object, {
  get
}) => {
  const value = get(object, condition.field);
  return Array.isArray(value) && condition.value.every(v => value.includes(v));
};

const every = (condition, object, {
  get,
  interpret
}) => {
  const items = get(object, condition.field);
  return Array.isArray(items) && items.length > 0 && items.every(item => interpret(condition.value, item));
};

const some = (condition, object, {
  get,
  interpret
}) => {
  const items = get(object, condition.field);
  return Array.isArray(items) && items.some(item => interpret(condition.value, item));
};

const is = (condition, object, {
  get,
  interpret
}) => {
  const item = get(object, condition.field);
  return item && typeof item === 'object' && interpret(condition.value, item);
};

const not = (condition, object, {
  interpret
}) => {
  return condition.value.every(subCondition => !interpret(subCondition, object));
};

function toComparable(value) {
  return value && typeof value === 'object' ? value.valueOf() : value;
}

const compareValues = (a, b) => compare(toComparable(a), toComparable(b));

const interpretPrismaQuery = createJsInterpreter({
  // TODO: support arrays and objects comparison
  equals: eq,
  notEquals: ne,
  in: within$1,
  lt: lt$1,
  lte,
  gt,
  gte,
  startsWith,
  istartsWith,
  endsWith,
  iendsWith,
  contains,
  icontains,
  isEmpty,
  has,
  hasSome,
  hasEvery,
  and,
  or,
  AND: and,
  OR: or,
  NOT: not,
  every,
  some,
  is
}, {
  get: (object, field) => object[field],
  compare: compareValues
});

const parser = new PrismaQueryParser();
const prismaQuery = createTranslatorFactory(parser.parse, interpretPrismaQuery);

function convertToPrismaQuery(rule) {
  return rule.inverted ? {
    NOT: rule.conditions
  } : rule.conditions;
}

const proxyHandlers = {
  get(target, subjectType) {
    const query = rulesToQuery(target._ability, target._action, subjectType, convertToPrismaQuery);

    if (query === null) {
      const error = ForbiddenError.from(target._ability).setMessage(`It's not allowed to run "${target._action}" on "${subjectType}"`);
      error.action = target._action;
      error.subjectType = error.subject = subjectType;
      throw error;
    }

    const prismaQuery = Object.create(null);

    if (query.$or) {
      prismaQuery.OR = query.$or;
    }

    if (query.$and) {
      prismaQuery.AND = query.$and;
    }

    return prismaQuery;
  }

};

function createQuery(ability, action) {
  return new Proxy({
    _ability: ability,
    _action: action
  }, proxyHandlers);
}

function accessibleBy(ability, action = 'read') {
  return createQuery(ability, action);
}

class PrismaAbility extends PureAbility {
  constructor(rules, options) {
    super(rules, Object.assign({
      conditionsMatcher: prismaQuery,
      fieldMatcher: fieldPatternMatcher
    }, options));
  }

}

export { ParsingQueryError, PrismaAbility, accessibleBy, prismaQuery };
//# sourceMappingURL=index.mjs.map
