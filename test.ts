import {TemplatrInstance} from './index'

var str:string = `[#<b:number(3)="611">+]#<a:number(2,3)>`;

var tpl = new TemplatrInstance(str, {
    spacesRequired: true
});

console.log(tpl.parse('777+11'));