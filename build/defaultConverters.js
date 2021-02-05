"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const _ = require("lodash");
require("reflect-metadata");
exports.defaultConverters = {
    [class_validator_1.ValidationTypes.CUSTOM_VALIDATION]: (meta, options) => {
        if (_.isFunction(meta.target)) {
            const type = getPropType(meta.target.prototype, meta.propertyName);
            return targetToSchema(type, options);
        }
    },
    [class_validator_1.ValidationTypes.NESTED_VALIDATION]: (meta, options) => {
        if (_.isFunction(meta.target)) {
            const typeMeta = options.classTransformerMetadataStorage
                ? options.classTransformerMetadataStorage.findTypeMetadata(meta.target, meta.propertyName)
                : null;
            const childType = typeMeta
                ? typeMeta.typeFunction()
                : getPropType(meta.target.prototype, meta.propertyName);
            return targetToSchema(childType, options);
        }
    },
    [class_validator_1.ValidationTypes.CONDITIONAL_VALIDATION]: {},
    [class_validator_1.ValidationTypes.IS_DEFINED]: {},
    [class_validator_1.ValidationTypes.EQUALS]: meta => {
        const schema = constraintToSchema(meta.constraints[0]);
        if (schema) {
            return Object.assign({}, schema, { enum: [meta.constraints[0]] });
        }
    },
    [class_validator_1.ValidationTypes.NOT_EQUALS]: meta => {
        const schema = constraintToSchema(meta.constraints[0]);
        if (schema) {
            return { not: Object.assign({}, schema, { enum: [meta.constraints[0]] }) };
        }
    },
    [class_validator_1.ValidationTypes.IS_EMPTY]: {
        anyOf: [
            { type: 'string', enum: [''] },
            {
                not: {
                    anyOf: [
                        { type: 'string' },
                        { type: 'number' },
                        { type: 'boolean' },
                        { type: 'integer' },
                        { type: 'array' },
                        { type: 'object' }
                    ]
                },
                nullable: true
            }
        ]
    },
    [class_validator_1.ValidationTypes.IS_NOT_EMPTY]: {
        minLength: 1,
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_IN]: meta => {
        const [head, ...rest] = meta.constraints[0].map(constraintToSchema);
        if (head && _.every(rest, { type: head.type })) {
            return Object.assign({}, head, { enum: meta.constraints[0] });
        }
    },
    [class_validator_1.ValidationTypes.IS_NOT_IN]: meta => {
        const [head, ...rest] = meta.constraints[0].map(constraintToSchema);
        if (head && _.every(rest, { type: head.type })) {
            return { not: Object.assign({}, head, { enum: meta.constraints[0] }) };
        }
    },
    [class_validator_1.ValidationTypes.IS_BOOLEAN]: {
        type: 'boolean'
    },
    [class_validator_1.ValidationTypes.IS_DATE]: {
        oneOf: [
            { format: 'date', type: 'string' },
            { format: 'date-time', type: 'string' }
        ]
    },
    [class_validator_1.ValidationTypes.IS_NUMBER]: {
        type: 'number'
    },
    [class_validator_1.ValidationTypes.IS_STRING]: {
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_DATE_STRING]: {
        pattern: 'd{4}-[01]d-[0-3]dT[0-2]d:[0-5]d:[0-5]d.d+Z?',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_ARRAY]: {
        items: {},
        type: 'array'
    },
    [class_validator_1.ValidationTypes.IS_INT]: {
        type: 'integer'
    },
    [class_validator_1.ValidationTypes.IS_ENUM]: meta => {
        return {
            enum: Object.values(meta.constraints[0]),
            type: 'string'
        };
    },
    [class_validator_1.ValidationTypes.IS_DIVISIBLE_BY]: meta => ({
        multipleOf: meta.constraints[0],
        type: 'number'
    }),
    [class_validator_1.ValidationTypes.IS_POSITIVE]: {
        exclusiveMinimum: true,
        minimum: 0,
        type: 'number'
    },
    [class_validator_1.ValidationTypes.IS_NEGATIVE]: {
        exclusiveMaximum: true,
        maximum: 0,
        type: 'number'
    },
    [class_validator_1.ValidationTypes.MIN]: meta => ({
        minimum: meta.constraints[0],
        type: 'number'
    }),
    [class_validator_1.ValidationTypes.MAX]: meta => ({
        maximum: meta.constraints[0],
        type: 'number'
    }),
    [class_validator_1.ValidationTypes.MIN_DATE]: meta => ({
        description: `After ${meta.constraints[0].toJSON()}`,
        oneOf: [
            { format: 'date', type: 'string' },
            { format: 'date-time', type: 'string' }
        ]
    }),
    [class_validator_1.ValidationTypes.MAX_DATE]: meta => ({
        description: `Before ${meta.constraints[0].toJSON()}`,
        oneOf: [
            { format: 'date', type: 'string' },
            { format: 'date-time', type: 'string' }
        ]
    }),
    [class_validator_1.ValidationTypes.IS_BOOLEAN_STRING]: {
        enum: ['true', 'false'],
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_NUMBER_STRING]: {
        pattern: '^[-+]?[0-9]+$',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.CONTAINS]: meta => ({
        pattern: meta.constraints[0],
        type: 'string'
    }),
    [class_validator_1.ValidationTypes.NOT_CONTAINS]: meta => ({
        not: { pattern: meta.constraints[0] },
        type: 'string'
    }),
    [class_validator_1.ValidationTypes.IS_ALPHA]: {
        pattern: '^[a-zA-Z]+$',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_ALPHANUMERIC]: {
        pattern: '^[0-9a-zA-Z]+$',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_ASCII]: {
        pattern: '^[\\x00-\\x7F]+$',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_BASE64]: {
        format: 'base64',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_BYTE_LENGTH]: {
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_CREDIT_CARD]: {
        format: 'credit-card',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_CURRENCY]: {
        format: 'currency',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_EMAIL]: {
        format: 'email',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_FQDN]: {
        format: 'hostname',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_FULL_WIDTH]: {
        pattern: '[^\\u0020-\\u007E\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE0-9a-zA-Z]',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_HALF_WIDTH]: {
        pattern: '[\\u0020-\\u007E\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE0-9a-zA-Z]',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_VARIABLE_WIDTH]: {
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_HEX_COLOR]: {
        pattern: '^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_HEXADECIMAL]: {
        pattern: '^[0-9a-fA-F]+$',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_IP]: meta => ({
        format: 'ipv' + (meta.constraints[0] || 4),
        type: 'string'
    }),
    [class_validator_1.ValidationTypes.IS_ISBN]: {
        format: 'isbn',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_ISIN]: {
        format: 'isin',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_ISO8601]: {
        oneOf: [
            { format: 'date', type: 'string' },
            { format: 'date-time', type: 'string' }
        ]
    },
    [class_validator_1.ValidationTypes.IS_JSON]: {
        format: 'json',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_LOWERCASE]: {
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_MOBILE_PHONE]: {
        format: 'mobile-phone',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_MONGO_ID]: {
        pattern: '^[0-9a-fA-F]{24}$',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_MULTIBYTE]: {
        pattern: '[^\\x00-\\x7F]',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_SURROGATE_PAIR]: {
        pattern: '[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_URL]: {
        format: 'url',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.IS_UUID]: {
        format: 'uuid',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.LENGTH]: meta => {
        const [minLength, maxLength] = meta.constraints;
        if (maxLength || maxLength === 0) {
            return { minLength, maxLength, type: 'string' };
        }
        return { minLength, type: 'string' };
    },
    [class_validator_1.ValidationTypes.IS_UPPERCASE]: {
        type: 'string'
    },
    [class_validator_1.ValidationTypes.MIN_LENGTH]: meta => ({
        minLength: meta.constraints[0],
        type: 'string'
    }),
    [class_validator_1.ValidationTypes.MAX_LENGTH]: meta => ({
        maxLength: meta.constraints[0],
        type: 'string'
    }),
    [class_validator_1.ValidationTypes.MATCHES]: meta => ({
        pattern: meta.constraints[0].source,
        type: 'string'
    }),
    [class_validator_1.ValidationTypes.IS_MILITARY_TIME]: {
        pattern: '^([01]\\d|2[0-3]):?([0-5]\\d)$',
        type: 'string'
    },
    [class_validator_1.ValidationTypes.ARRAY_CONTAINS]: meta => {
        const schemas = meta.constraints[0].map(constraintToSchema);
        if (schemas.length > 0 && _.every(schemas, 'type')) {
            return {
                not: {
                    anyOf: _.map(schemas, (d, i) => ({
                        items: {
                            not: Object.assign({}, d, { enum: [meta.constraints[0][i]] })
                        }
                    }))
                },
                type: 'array'
            };
        }
        return { items: {}, type: 'array' };
    },
    [class_validator_1.ValidationTypes.ARRAY_NOT_CONTAINS]: meta => {
        const schemas = meta.constraints[0].map(constraintToSchema);
        if (schemas.length > 0 && _.every(schemas, 'type')) {
            return {
                items: {
                    not: {
                        anyOf: _.map(schemas, (d, i) => (Object.assign({}, d, { enum: [meta.constraints[0][i]] })))
                    }
                },
                type: 'array'
            };
        }
        return { items: {}, type: 'array' };
    },
    [class_validator_1.ValidationTypes.ARRAY_NOT_EMPTY]: {
        items: {},
        minItems: 1,
        type: 'array'
    },
    [class_validator_1.ValidationTypes.ARRAY_MIN_SIZE]: meta => ({
        items: {},
        minItems: meta.constraints[0],
        type: 'array'
    }),
    [class_validator_1.ValidationTypes.ARRAY_MAX_SIZE]: meta => ({
        items: {},
        maxItems: meta.constraints[0],
        type: 'array'
    }),
    [class_validator_1.ValidationTypes.ARRAY_UNIQUE]: {
        items: {},
        type: 'array',
        uniqueItems: true
    }
};
function getPropType(target, property) {
    return Reflect.getMetadata('design:type', target, property);
}
function constraintToSchema(primitive) {
    const primitives = ['string', 'number', 'boolean'];
    const type = typeof primitive;
    if (_.includes(primitives, type)) {
        return { type };
    }
}
function targetToSchema(type, options) {
    if (_.isFunction(type)) {
        if (_.isString(type.prototype) || _.isSymbol(type.prototype)) {
            return { type: 'string' };
        }
        else if (_.isNumber(type.prototype)) {
            return { type: 'number' };
        }
        else if (_.isBoolean(type.prototype)) {
            return { type: 'boolean' };
        }
        return { $ref: options.refPointerPrefix + type.name };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdENvbnZlcnRlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGVmYXVsdENvbnZlcnRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxxREFBaUQ7QUFFakQsNEJBQTJCO0FBRTNCLDRCQUF5QjtBQWFaLFFBQUEsaUJBQWlCLEdBQXNCO0lBQ2xELENBQUMsaUNBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFO1FBQ3JELElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDN0IsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTtZQUNsRSxPQUFPLGNBQWMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7U0FDckM7SUFDSCxDQUFDO0lBQ0QsQ0FBQyxpQ0FBZSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUU7UUFDckQsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUM3QixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsK0JBQStCO2dCQUN0RCxDQUFDLENBQUMsT0FBTyxDQUFDLCtCQUErQixDQUFDLGdCQUFnQixDQUN0RCxJQUFJLENBQUMsTUFBTSxFQUNYLElBQUksQ0FBQyxZQUFZLENBQ2xCO2dCQUNILENBQUMsQ0FBQyxJQUFJLENBQUE7WUFDUixNQUFNLFNBQVMsR0FBRyxRQUFRO2dCQUN4QixDQUFDLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRTtnQkFDekIsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7WUFDekQsT0FBTyxjQUFj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