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
        if(champ_names[i].replace('_', '').toUpperCase() === fixed.toUpperCase() || champ_names[i].replace('\'', '').toUpperCase() === fixed.toUpperCase()
            || champ_names[i].replace('.', '').replace(' ').toUpperCase() === fixed.toUpperCase())
            return champ_names[i];
    }
    return fixed;
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
        "mundo": "Dr._Mundo"
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
// urL - the fandom wiki link for the corresponding character or page
function parseStats(url) {
    return got(url).then(response => {

        let result = '';

        //Saves a const that allows for jQuery-like obtaining of page elements
        const $ = cheerio.load(response.body);

        //Selects first stats table available on page
        $('.pi-theme-stats-table').each(function(i,e) {

            //Use only index at i === 0
            if(i === 0) {

                //Add title and formatting for statistics group
                result += "**Base statistics**\n";

                //For-each loop that iterates over each group of stats on the page
                $(this).find('.pi-group').each(function(i,e) {

                    //Finds header for all sections of the table (past the first)
                    if(i!==0) {
                        let header = '';
                        if($(this).find('a').length === 0){header = $(this).find('h2').text();}
                        else {header = $(this).find('a').attr('title');}
                        
                        while(header.indexOf('<') >=0) {
                            header = header.substring(0, header.indexOf('<')-1) + header.substring(header.indexOf('>')+1, header.length);
                        }
                        result += "\n**"+header+"**\n";
                    }

                    //Stores names for the last section where informations is within different sections/tabs
                    let names = [];
                    if($(this).find(".pi-section-label").length>0) {
                        $(this).find(".pi-section-label").each(function(i,e) {
                            names[i] = $(this).text().trim();
                        });
                    }
                    
                    //For-each loop that iterates over individual attribute on the page
                    $(this).find("[data-source]").each(function(i,e) {

                        //Checks if the names array has been populated (meaning it is in the last section)
                        if (names.length > 0) {

                            //Adds titles of the sections to result along with formatting
                            if(i===0) {result += names[0] + "\n";}
                            else if(i%4===0) {result += "\n" + names[i/4] + "\n";}
                        }

                        //Remove extra elements from the text and trim it for the result
                        let text = $(this).text();
    
                        while(text.indexOf('<') >=0) {
                            text = text.substring(0, text.indexOf('<')-1) + text.substring(text.indexOf('>')+1, text.length);
                        }
                        text = text.trim();

                        //For formatting, space out the keys and values because they are read as "KeyValue" and they appear better as "Key: Value"
                        //Use Regex to find the first number, '.', '-', '+' that occurs to put the spacing in
                        let firstCharacter = text.search(/([0-9]|-|\.([0-9]?\w?)[1]|\+)/);

                        //Use another regex to find if '+' in the text is between numbers so we can space it out
                        let numberPlus = text.search(/[0-9]\+[0-9]/);
                        if(numberPlus > 0) {text = text.replace("+", " + ");}

                        //For stats that have N/A, add spacing as well
                        if(text.includes("N/A")) { text = text.replace("N/A", ": N/A");} 

                        //Finally concatenate the strings together with the proper formatting
                        else {text = text.substring(0, firstCharacter) + ": " + text.substring(firstCharacter);}
                        result += text + "\n";
                    });

                    //Once 4 sections of the pi-group have been, it needs to break otherwise it reads over a section again
                    //4th section is less useful so it currently prints out 3
                    if(i===2) {return false;}
                });
            }
        });

        //Return a promise with the newly found result text
        return new Promise(resolve => {
            if (result === '') throw new Error("Champion stats was not found.");
            setTimeout(() => resolve(result), 1000);
       });
    });
}

//Visits corresponding url and prints passive + ability data for the given champion
//Parameters:
// urL - the fandom wiki link for the corresponding character or page
// abilityType - a 1-character long string with the options [p, q, w, e, r] or an empty string
function parseAbilities(url, abilityType) {
    let result = '';
    let skill = abilityType;

    //Changes the 'p' parameter to innate as that is the syntax required for the page
    if (skill === 'p') { skill = 'innate';}

    //Promise for successful query of URl
    return got(url).then(response => {

        //Saves a const that allows for jQuery-like obtaining of page elements
        const $ = cheerio.load(response.body);

        //Determines if there should be a suffix appended to the skill class (enables a specific skill to be returned)
        let suffix = '';
        if(skill !== '') {suffix = '_' + skill;}

        if(url.includes('Aphelios') && (suffix === '_q' || suffix === '_w')){
            suffix = '_aphelios';
        }

        //For-each loop that iterates over reach ability on the page (only one if suffix is not blank or '')
        $('.skill' + suffix).each(function(i,e) {

            //TODO: Use parent attribute to get ability type instead of hard-coding

            let tooltips = ["Passive", "Q", "W", "E", "R"];
            if(url.includes('Aphelios')) {
                tooltips = ["Passive", "Weapon1", "Weapon2", "Weapon3", "Weapon4", "Weapon5", "Q", "W", "E", "R"];
            }
            else if (url.includes('Nidalee') || url.includes('Gnar')|| url.includes('Elise')) {
                tooltips = ["Passive", "Q1", "W1", "E1", "Q2", "W2", "E2", "R"]
            }
            else if (url.includes('Jayce')) {
                tooltips = ["Passive", "Q1", "W1", "E1","R1", "Passive (again)", "Q2", "W2", "E2", "R2"]
            }

            let ability = '';
            if(suffix !== '') {
                if(abilityType === 'p') {ability = "Passive";}
                else {ability = abilityType.toUpperCase();}
            }
            else {
                ability = tooltips[i];
            }
             
        //For-each loop that iterates over the container for the abilities to be searched (all or one)
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
                    while(name.indexOf('.2F') >= 0) {
                        name = name.replace('.2F', '/');
                    }
                    result += "**" + name + " (" + ability + ")" + "**\n";
                    //console.log(name);
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

                    //For-each loop that iterates over the secondary ability info (cooldown, range, etc)
                    $(this).find('.ability-info').each(function(i,e) {
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
                });
                result += "\n";
                //console.log();
            });

        });
    
        //Return a promise with the newly found result text
        return new Promise(resolve => {
             if (result === '') throw new Error("Champion abiliters were not found.");
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
    // TODO: Implement item, rune functionality
    if(command === 'champ' || command === 'stats') {
        
        //Check if arguments list is empty
        if(!args.length) {
            return msg.channel.send('Please add the parameters for the command `!lol [champion, rune, item name]`');
            
        }

        //Values that will be used to check if user wants a specific part of champion abilities
        offset = 0;
        param = '';

        //Checks if user has entered 'passive' and changes it to 'p'
        if(args[args.length-1].toLowerCase() === 'passive') {args[args.length-1] = 'p';}

        //Sets value of parameter if the last argument is of size 1 (for ability selection)
        if(args[args.length -1].length === 1) { offset = 1; param = args[args.length-1].toLowerCase()}
        
        //Builds champion name by adding all array elements - offset (since some champions require spaces)
        let name = '';
        for(i=0; i < args.length - offset; i++) {
            if(i===0) {name = args[i];}
            else {name = name + "_" + args[i];}
            
        }
        
        //Converts abbreviations and adds '_' and '\'' characters where needed for URl to succeed
        name = convertAbbreviation(name);
        name = fixSpecialCharacters(name.toUpperCase());
        
        if(!['q', 'w', 'e', 'r', 'p', ''].includes(param) && command !== 'stats') {
            msg.channel.send("The parameter `" + args[args.length-1] + "` is not valid. Please use one of [q, w, e, r, p(assive), (blank)].")
        }
        else if (champ_names.includes(name) === true) {
            //let url = "https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay";
            let result = '';
            if(command === 'stats') {
                parseStats("https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay").then(value => {
                    result = value;
                    wrapText(result, msg.channel);
                }).catch(error => {
                    console.log(error);
                });

            }
            else{
                parseAbilities("https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay", param.toLowerCase()).then(value =>{
                    result = value;
                    wrapText(result, msg.channel);
                }).catch(error => {
                    console.log(error);
                });
            }
           
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
        msg.channel.send("`!" + command + "`" + " is not a valid command. \nTry using: \n`!champ [name] [q, w, e, r, p(assive), (blank)]` \n`!item [name]` \n`!rune [name]` \n These commands are not case-sensitive.");
    }
});


client.login(token)