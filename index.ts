/// <reference path="typings/templatr/templatr.d.ts" />
declare var require:Function;

var util = require('util');

export class TemplatrInstance {
    public regExp:RegExp;
    public matches:TemplatrMatch[];
    public types:any = {
        any: '.:size',
        number: '\\d:size',
        alnum: '\\w:size',
        hex: '0x[\\da-f]:size'
    };
    public overrideValues:boolean;

    static lexemRegexp():RegExp {
        return /#(?:<(\w+)(\?)?(?::(\w+))?(?:\(((?:\d+,\d+|\d+|\d+,|,\d+)?)\))?(?:=(".*?"|@\w+))?>)/g;
    }

    static lexemRegexp2():RegExp {
        return (function(){
            var result =
                    '(?:^|[^\\\\])'         + // BOS or not slash
                    '#'                     + // #
                    '<'                     + // Start of main options part
                    '(\\w+)'                + // Start of main options part
                    '(\\?)?'                + // Optional question char
                    '(?::(\\w+))?'          + // Optional type group
                    '(?:(\\(('              + // Start of optional size group
                    '\d+,\d+'               + // #,#
                    '\d+'                   +
                    '\d+,'                  +
                    ',\d+'                  +
                    ')\\)))?'               + // End of optional size group
                    '(?:=(".*?"|@\\w+))?'   + // Optional value group
                    '>'                       // End of main options part
                ;
            return new RegExp(result, 'g');
        }())
    }

    constructor(private template:string, private options:TemplatrOptions) {
        var defaultOptions:TemplatrOptions = {
                spacesRequired: true,
                strict: true,
                overrideValues: false,
                types: {}
            },
            rgxString:string;

        this.matches = (():TemplatrMatch[] => template.match(TemplatrInstance.lexemRegexp())
                .map((e):TemplatrMatch => {
                    var exec:RegExpExecArray = TemplatrInstance.lexemRegexp().exec(e),
                        name:string,
                        type:string,
                        defaultValue:string,
                        optional:boolean,
                        sizeStart:string,
                        sizeEnd:string
                        ;

                    if ( ! exec)
                        throw '1231312';

                    name = exec[1];
                    optional = exec[2] === '?';
                    type = exec[3] || 'any';
                    defaultValue = exec[5];

                    sizeStart = "0";
                    sizeEnd = "0";

                    return {
                        name,
                        type,
                        defaultValue,
                        optional,
                        sizeStart,
                        sizeEnd
                    };
                })
        )();

        util._extend(defaultOptions, options);

        options = defaultOptions;

        util._extend(this.types, options.types);

        rgxString = template;

        rgxString = rgxString.replace(/[$.\\^+*]/g, '\\$&');
        rgxString = rgxString.replace(/\s+/g, options.spacesRequired ? '\\s+' : '\\s*');
        rgxString = rgxString.replace(/\[/g, '(?:');
        rgxString = rgxString.replace(/\]/g, ')?' );
        rgxString = rgxString.replace(/\{/g, '(?:');
        rgxString = rgxString.replace(/\}/g, ')'  );
        rgxString = rgxString.replace(TemplatrInstance.lexemRegexp(), (input:string, name:string, optional:string, type:string, size:string, value:string) => {
                var str:string,
                    typeDef:string,
                    match:TemplatrMatch = this.findMatch(name);

                if (type === void 0)
                    type = 'any';

                if (this.types[type] === void 0)
                    throw `Type ${type} not exists`;

                let sizeData = size.split(',');

                if (sizeData.length === 2) {
                    match.sizeStart = sizeData[0] || "0";
                    match.sizeEnd = sizeData[1] || '';
                } else {
                    match.sizeStart = sizeData[0] || "0";
                    match.sizeEnd = sizeData[0] || "0";
                }

                typeDef = this.types[type].replace(/:size/g, `{${match.sizeStart},${match.sizeEnd||""}}`);

                str = `(?:${typeDef})`;

                return `(${str})`;
            })
        ;

        if (options.strict) {
            rgxString = `^${rgxString}$`;
        }

        this.regExp = new RegExp(rgxString, 'i');
        this.overrideValues = options.overrideValues;
    }

    private findMatch(name:string):TemplatrMatch {
        for (var match of this.matches) {
            if (match.name === name)
                return match;
        }

        return null;
    }

    public parse(str:string, strict:boolean = false):any {
        var matches:RegExpMatchArray = str.match(this.regExp),
            result:any = {},
            types:any = {},
            defaults:any = {}
            ;

        if (matches === null) {
            if (strict)
                throw "123";

            return null;
        }

        matches.shift();

        for (let i = 0; i < matches.length; i++) {
            let thisMatch = this.matches[i];
            let passedValue = matches[i];
            if (passedValue === void 0) {
                passedValue = thisMatch.defaultValue.replace(/^"|"$/g, '');
            }

            result[thisMatch.name] = passedValue;
            types[thisMatch.name] = thisMatch.type;
            defaults[thisMatch.name] = thisMatch.defaultValue;
        }

        for (let key in result) {
            if ( ! result.hasOwnProperty(key))
                continue;

            if (result[key][0] === '@') {
                let anotherKey = result[key].substr(1);
                result[key] = result[anotherKey];
                if (this.overrideValues)
                    result[anotherKey] = defaults[anotherKey];
            } else {
                if (result[key] === void 0) {
                    if (defaults[key] !== void 0) {
                        result[key] = defaults[key].replace(/^"|"$/g, '');
                    } else
                        throw 123;
                }
            }

            let typeDef:string = this.types[types[key]];

            switch (typeof typeDef) {
                case 'string':
                    let typeRgx:RegExp,
                        match:TemplatrMatch = this.findMatch(key);

                    typeDef = this.types[match.type].replace(/:size/g, `{${match.sizeStart},${match.sizeEnd||""}}`);

                    typeRgx = new RegExp(`^${typeDef}$`, 'i');

                    if ( ! typeRgx.test(result[key]))
                        throw `Value of param ${key} - ${result[key]} is incorrect`;

                    break;

                // case ...
                default:
                    throw `Type ${typeof this.types[types[key]]} is not supported`;
            }
        }

        return result;
    }

    public registerType(name:string, chars:string, force:boolean = false):TemplatrInstance {
        if (force) {
            this.types[name] = chars;
            return this;
        }

        if (this.types[name] !== void 0)
            throw `Type ${name} already exists`;

        this.types[name] = chars;

        return this;
    }
}
