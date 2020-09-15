const {abbreviations} = require('./config.json');

//Removes any link or image tags (<a/> or <img/>) that could be printed as text
function removeTags(result) {
    if(result.indexOf('<') >=0 && result.indexOf('>') >= 0) {
        while(result.indexOf('<') >=0) {
            result = result.substring(0, result.indexOf('<')-1) + result.substring(result.indexOf('>')+1, result.length);
        }
    }
    return result;
}

//Adjusts input names to match expected behavior from Wiki pages -
// ' ' is replaced with '_'
function fixSpecialCharacters(name, names) {
    let fixed = name;
    while(fixed.indexOf(' ') >= 0) {
        fixed = fixed.replace(' ', '_');
    }

    //For loop that checks if champion is in list sans the special formatting and prints the name from the list if it is
    for(i = 0; i < names.length; i++) {
        if(names[i].replace('_', '').toUpperCase() === fixed.toUpperCase() || 
            names[i].replace('\'', '').toUpperCase() === fixed.toUpperCase() || 
            names[i].replace('.', '').replace(' ', '_').toUpperCase() === fixed.toUpperCase())
            return names[i];
    }
    return fixed;
}

//Converts common champion abbreviation to corresponding list entry - more can be added in future
function convertAbbreviation(name) {

    //Dictionary of common character abbreviations
    if(name in abbreviations) {
        return abbreviations[name];
    }
    else {
        return name;
    }
}

module.exports = {removeTags, fixSpecialCharacters, convertAbbreviation};