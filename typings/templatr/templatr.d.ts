
interface TemplatrMatch {
    name:string;
    type:string;
    defaultValue:string;
    optional:boolean;
    sizeStart:string;
    sizeEnd:string;
}

interface TemplatrOptions {
    spacesRequired?:boolean,
    strict?:boolean,
    overrideValues?:boolean,
    types?:any
}
