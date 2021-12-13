'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ability = require('@casl/ability');
var mongoose = require('mongoose');
var extra = require('@casl/ability/extra');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var mongoose__default = /*#__PURE__*/_interopDefaultLegacy(mongoose);

function convertToMongoQuery(rule) {
  const conditions = rule.conditions;
  return rule.inverted ? {
    $nor: [conditions]
  } : conditions;
}

function toMongoQuery(ability, subjectType, action = 'read') {
  return extra.rulesToQuery(ability, action, subjectType, convertToMongoQuery);
}

function failedQuery(ability$1, action, modelName, query) {
  query.where({
    __forbiddenByCasl__: 1
  }); // eslint-disable-line

  const anyQuery = query;

  if (typeof anyQuery.pre === 'function') {
    anyQuery.pre(cb => {
      const error = ability.ForbiddenError.from(ability$1);
      error.action = action;
      error.subjectType = modelName;
      error.setMessage(ability.getDefaultErrorMessage(error));
      cb(error);
    });
  }

  return query;
}

function accessibleBy(ability, action) {
  let modelName = this.modelName;

  if (!modelName) {
    modelName = 'model' in this ? this.model.modelName : null;
  }

  if (!modelName) {
    throw new TypeError('Cannot detect model name to return accessible records');
  }

  const query = toMongoQuery(ability, modelName, action);

  if (query === null) {
    return failedQuery(ability, action || 'read', modelName, this.where());
  }

  return this instanceof mongoose__default["default"].Query ? this.and([query]) : this.where({
    $and: [query]
  });
}

function accessibleRecordsPlugin(schema) {
  schema.query.accessibleBy = accessibleBy;
  schema.statics.accessibleBy = accessibleBy;
}

const getSchemaPaths = schema => Object.keys(schema.paths);

function fieldsOf(schema, options) {
  const fields = options.getFields(schema);

  if (!options || !('except' in options)) {
    return fields;
  }

  const excludedFields = ability.wrapArray(options.except);
  return fields.filter(field => excludedFields.indexOf(field) === -1);
}

function modelFieldsGetter() {
  let fieldsFrom;
  return (schema, options) => {
    if (!fieldsFrom) {
      const ALL_FIELDS = options && 'only' in options ? ability.wrapArray(options.only) : fieldsOf(schema, options);

      fieldsFrom = rule => rule.fields || ALL_FIELDS;
    }

    return fieldsFrom;
  };
}

function accessibleFieldsPlugin(schema, rawOptions) {
  const options = Object.assign({
    getFields: getSchemaPaths
  }, rawOptions);
  const fieldsFrom = modelFieldsGetter();

  function accessibleFieldsBy(ability, action) {
    const subject = typeof this === 'function' ? this.modelName : this;
    return extra.permittedFieldsOf(ability, action || 'read', subject, {
      fieldsFrom: fieldsFrom(schema, options)
    });
  }

  schema.statics.accessibleFieldsBy = accessibleFieldsBy;
  schema.method('accessibleFieldsBy', accessibleFieldsBy);
}

exports.accessibleFieldsPlugin = accessibleFieldsPlugin;
exports.accessibleRecordsPlugin = accessibleRecordsPlugin;
exports.getSchemaPaths = getSchemaPaths;
exports.toMongoQuery = toMongoQuery;
//# sourceMappingURL=index.js.map
