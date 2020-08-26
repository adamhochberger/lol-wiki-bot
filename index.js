const {champ_names, token} = require('./config.json')
const Discord = require('discord.js');
const client = new Discord.Client();
const cheerio = require('cheerio');
const got = require('got');



//Adjusts input names to match expected behavior from Wiki pages -
// ' ' is replaced with '_'
function fixSpecialCharacters(name) {
    let fixed = name;
    while(fixed.indexOf(' ') >= 0) {
        fixed = fixed.replace(' ', '_');
    }

    //For loop that checks if champion is in list sans the special formatting and prints the name from the list if it is
    for(i = 0; i < champ_names.length; i++) {
        if(champ_names[i].replace('_', '').toUpperCase() === fixed.toUpperCase() || champ_names[i].replace('\'', '').toUpperCase() === fixed.toUpperCase())
            return champ_names[i];
    }
    return fixed;
}

//Simple function that is a shell of list.includes function
function findChamp(name) {
    return champ_names.includes(name);
}

//Converts common champion abbreviation to corresponding list entry - more can be added in future
function convertAbbreviation(name) {

    //Dictionary of common character abbreviations
    let abbrev = {
        "Yi": "Master_Yi",
        "masteryi": "Master_Yi",
        "lee": "Lee_Sin",
        "leesin": "Lee_Sin",
        "mf": "Miss_Fortune",
        "missfortune": "Miss_Fortune",
        "vlad": "Vladimir",
        "blitz": "Blitzcrank",
        "kench": "Tahm_Kench",
        "trynd": "Tryndamere",
        "ez": "Ezreal",
        "cait": "Caitlyn",
    }

    if(name in abbrev) {
        return abbrev[name];
    }
    else {
        return name;
    }
}

function wrapText(text, channel) {
    //While loop that splits up text if length is >2000 (unable to be sent through Discord)
    while(text.length > 2000) {

        //Sets size based on length of string
        let size = text.length;

        //Creates small string that is of valid size
        let small_string = text.substring(0, 1999);

        //Finds the last occurrence of a "\n" in small string so output can be printed in a nicer format
        let ending = small_string.lastIndexOf('\n');

        //Sets the valid string to this new ending
        small_string = text.substring(0, ending);

        //Sends message to channel
        //TODO: Implement private user reply option as well
        channel.send(small_string);

        //Sets main string equal to the remaining sections
        text = text.substring(ending, size);
    }

    //Final print for value which is either all of the input if <2000 or remaining input after other sections
    channel.send(text);
}
//Visits corresponding url and prints stats for the rune along with description
//TODO: Implement functionality for returning rune stats/description
function parseRune(url) {
    return null;
}

//Visits corresponding url and prints stats for the item along with description
//TODO: Implement functionality for returning item stats
function parseItem(url) {
    //Will display the item passive, attributes, icon potentially, and gold efficiency
    return null;
}


//Visits corresponding url and prints stats (base, level up) for the champion
//TODO: Implement functionality, stat searching
function parseStats(url, statType) {
    return null;
}

//Visits corresponding url and prints passive + ability data for the given champion
//TODO: Implement search by specific ability (q, w, e, r ,p[assive])
function parseAbilities(url, abilityType) {
    let result = '';
    let skill = abilityType;

    if (skill === 'p') { skill = 'innate';}

    //Promise for successful query of URl
    return got(url).then(response => {

        //Saves a const that allows for jQuery-like obtaining of page elements
        const $ = cheerio.load(response.body);

        // if($(this).parent('.skill_' + skill)) {
        //     console.log($('.skill_' + skill).text());
        //     return;
        // }
        let suffix = ''
        if(skill !== '') {suffix = '_' + skill;}

        $('.skill' + suffix).each(function(i,e) {
        //For-each loop that iterates over each ability on the page
            $(this).find('.ability-info-container').each(function(i, e) {

                //Sets name to be the id of this attribute
                let name = $(this).attr('id');

                //Performs replace of characters from webpage 
                if(name !== undefined) {
                    while(name.indexOf('_') >=0) {
                        name = name.replace('_', ' ');
                    }
                    while(name.indexOf('.27') >= 0) {
                        name = name.replace('.27', '\'');
                    }
                    while(name.indexOf('.2C') >= 0) {
                        name = name.replace('.2C', ',');
                    }
                    while(name.indexOf('.21') >= 0) {
                        name = name.replace('.21', '!');
                    }
                    result += name + "\n";
                    console.log(name);
                }

                //For-each loop that iterates over each table within the ability 
                $(this).find('table').each(function(i,e) {

                    //For-each loop that iterates over each p element (description) within the ability
                    $(this).find('p').each(function(i,e) {

                        //Removes all img src elements from the <p> text
                        let text = $(this).text();
                        while(text.indexOf('<') >=0) {
                            text = text.substring(0, text.indexOf('<')-1) + text.substring(text.indexOf('>')+1, text.length);
                        }

                        //Appends final description text to result string 
                        result += text.substring(0, text.length) + "\n";

                        //Debug console log
                        //console.log(text.substring(0, text.length-1));
                        
                        
                    });

                    //For-each loop that iterates over the "rank" sections (damage, healing, etc) within the ability
                    $(this).find('.skill_leveling').each(function(i,e) {

                        //Checks if there are multiple tabs within the leveling area (more common on complex characters)
                        if($(this).find('.skill-tabs').length > 0) {

                            //For-each loop that iterates over the subtabs located within the "rank" sections
                            $(this).find('.skill-tabs').each(function(i,e) {

                                //For-each loop that prints the text and values of a skill damage/heal component
                                $(this).children().each(function(i,e) {

                                    //Removes all img src elements from the children text
                                    let text = $(this).text();
                                    while(text.indexOf('<') >=0) {
                                        text = text.substring(0, text.indexOf('<')-1) + text.substring(text.indexOf('>')+1, text.length);
                                    }

                                    //Appends final description text to result string 
                                    result += text.substring(0, text.length) + "\n";

                                    //Debug console log
                                    //console.log(text.substring(0, text.length));
                                });

                                //Appends newline for formatting
                                result += "\n";
                            });
                        }

                        //If there are not multiple skill tabs, entirety of text is printed
                        else {

                            //Removes all img src elements from the children text
                            let text = $(this).text();
                            while(text.indexOf('<') >=0) {
                                text = text.substring(0, text.indexOf('<')-1) + text.substring(text.indexOf('>')+1, text.length);
                            }
                            //Appends final description text to result string 
                            result += text.substring(0, text.length) + "\n";

                            //Debug console log
                            //console.log(text.substring(0, text.length));
                        }
                        
                    });
                });
                result += "\n";
                //console.log();
            });
        });
    

        return new Promise(resolve => {
             if (result == '') throw new Error("Champion information was not found.");
             setTimeout(() => resolve(result), 1000);
        });
    });
    
}

client.on('ready', () => {

    console.log('Logged in as ' + client.user["username"] + '!');
});

client.on('message', msg  => {

    if(!msg.content.startsWith("!") || msg.author.bot) return;


    const args = msg.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Checks if command is for champion
    // TODO: Implement item, rune
    if (command === 'champ') {
        if(!args.length) {
            return msg.channel.send('Please add the parameters for the command `!lol [champion, rune, item name]`');
            
        }
        offset = 0;
        param = '';
        if (args[args.length-1].toLowerCase() === 'passive') {args[args.length-1] = 'p';}
        if(args[args.length -1].length === 1) { offset = 1; param = args[args.length-1]}

        let name = '';
        for(i=0; i < args.length - offset; i++) {
            name = name + args[i];
        }
        name = convertAbbreviation(name);
        name = fixSpecialCharacters(name.toUpperCase());
        
        
        if (champ_names.includes(name) === true) {
            //let url = "https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay";
            //var champText = parseAbilities.then(function(result){});

            parseAbilities("https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay", param.toLowerCase()).then(value =>{

            wrapText(value, msg.channel);

            }).catch(error => {
                console.log(error);
            });

            //Debug message to ensure link worked well
            //msg.channel.send("https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay");
        }

        //Error checking in the even the champion is not found
        else {
            msg.channel.send('Champion: ' + name + ' not found');
        }
    }
    else if (command === "item") {

    }
    else if (command === "rune") {

    }
    else {
        msg.channel.send("\"!" + command + "\"" + " is not a valid command.");
    }
});


client.login(token)