declare var require:Function;

var util = require('util');

interface TemplatrMatch {
    name:string;
    type:string;
    defaultValue:string;
    optional:boolean;
    sizeStart:number;
    sizeEnd:number;
}

interface TemplatrOptions {
    spacesRequired?:boolean,
    strict?:boolean,
    overrideValues?:boolean,
    types?:any
}

function getSizes(start:string, end:string, optional:boolean):any {
    var result:any;
    if (start === void 0) {
        result = optional ? {start: "0"} : {start: "1"};
    } else {
        if (end === void 0) {
            end = start;
            if (optional) {
                start = "0";
            }
        }

        result = {start, end}
    }

    return result;
}

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
        return /#(?:<(\w+)(\?)?(?::(\w+))?(?:\(([1-9]+)(?:,(\d+))?\))?(?:=(".*?"|@\w+))?>)?/g;
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
                        sizeStart:number,
                        sizeEnd:number
                        ;

                    if ( ! exec)
                        throw '1231312';

                    name = exec[1];
                    optional = exec[2] === '?';
                    type = exec[3] || 'any';
                    defaultValue = exec[3];

                    sizeStart = 0;
                    sizeEnd = 0;

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

        rgxString = template
            .replace(/[$.\\^+*]/g, '\\$&')
            .replace(/\s+/g, options.spacesRequired ? '\\s+' : '\\s*')
            .replace(/\[/g, '(?:')
            .replace(/\]/g, ')?' )
            .replace(/\{/g, '(?:')
            .replace(/\}/g, ')'  )
            .replace(TemplatrInstance.lexemRegexp(), (input:string, name:string, optional:string, type:string, sizeStart:string, sizeEnd:string, value:string) => {
                var str:string,
                    typeDef:string,
                    match:TemplatrMatch = this.findMatch(name);

                if (type === void 0)
                    type = 'any';

                if (this.types[type] === void 0)
                    throw `Type ${type} not exists`;

                let sizes:any = getSizes(sizeStart, sizeEnd, match.optional);
                match.sizeStart = sizes.start;
                match.sizeEnd = sizes.end;

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
                passedValue = thisMatch.defaultValue;
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
