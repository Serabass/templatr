var tests = [
    [
        '[#<b:number(3)="611">+]#<a:number(2,3)>',
        '777+11'
    ], // { b: '777', a: '11' }
    [
        '[#<b:number(3)="611">+]#<a:number(2,3)>',
        '11'
    ], // { b: '611', a: '11' }
    [
        '[#<b:hex(3)="AD4">+]#<a:number(2,3)>',
        'FFF+11'
    ], // { b: 'FFF', a: '11' }
];

import {TemplatrInstance} from './index'

var str:string = '[#<b:hex(3)="AD4">+]#<a:number(2,3)>';

var tpl = new TemplatrInstance(str, {
    spacesRequired: true
});

console.log(tpl.parse('11'));