import {TemplatrInstance} from './index'

var tpl = new TemplatrInstance('#<a>@#<b?>.#<c>', {
    spacesRequired: true
});

console.log(tpl.regExp);
console.log(tpl.parse('email@.com'));