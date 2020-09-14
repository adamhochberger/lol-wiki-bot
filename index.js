
const {champ_names, item_names, abbreviations} = require('./config.json');
const {token} = require('./auth.json');
const Discord = require('discord.js');
const client = new Discord.Client();
const cheerio = require('cheerio');
const got = require('got');

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
    result = '';

    return got(url).then(response => {
        console.log(url);

        const $ = cheerio.load(response.body);

        //TODO: Fix formatting and ensure that titles are being properly printed
        $('.portable-infobox').each(function(i,e) {

            //Prints item name at top of the result
            result += $(this).find('h2').contents().get(0).nodeValue + "\n\n";

            //Finds number of sections for use in the "Recipe" tag

            $(this).find('section').each(function(i,e) {

                //Skips the first tag as this is an image
                //TODO: Implement url as part of the result so it may be displayed on Discord
                if(i===0) {return;}
                else {

                    //Prints header of section
                    if($(this).find('h2').text() !== '') {
                        result += $(this).find('h2').text() + ":\n";
                    }

                    //Checks if section contains a table (requires different parsing of elements)
                    if($(this).find('table').length > 0) {

                        //Function that runs for each table (should be one)
                        $(this).find('table').each(function(i,e) {

                            // #Recipe

                            //Verifies if there is only one td object, indicating it is the 'recipe' section
                            // if($(this).find('td').length === 1) {

                            //     //Sets the scope of this to be the lone 'td' element
                            //     $(this).find('td').each(function(i,e) {
                            //         result += "Recipe:\n";

                            //         //Length of the span elements is found to print the item objects in the recipe
                            //         length = $(this).find('span').length;
                            //         $(this).find('span').each(function(i,e) {

                            //             //Prints all elements before the last 3 unneeded span elements (span(span(gold icon), span(gold number)))
                            //             if(i < length-3){
                            //                 result += $(this).attr('data-param');
                            //                 result += " + ";
                            //             }

                            //             //Prints the final element - the combine cost of the item
                            //             else if(i===length-1){
                            //                 result += removeTags($(this).text()) + "\n";
                            //             }
                            //         });
                            //     });
                            // }

                            //If there is >1 td objects, then it is a cost/sell/code section, also has print for recipe before it
                            if($(this).find('td').length !== 1)  {

                                if($('table[style="border-collapse:collapse;"]').find('tbody').length === 1) {
                                    result += "Recipe:\n"
                                    $('table[style="border-collapse:collapse;"]').find('tbody').each(function(i,e) {
                                        $(this).find('.item').each(function(i,e) {
                                            if(i===0){return;}
                                            result += removeTags($(this).find('.name').text()) + " (" + removeTags($(this).find('.gold').text()).replace(' ','') + " gold) +\n";
                                        });
                                        result += removeTags($(this).find('.item').eq(0).find('.gold').find('span[style="white-space:normal;"]').eq(1).text()) + " gold\n";
                                    });
                                    result += "\n\n";
                                };  

                                for(index=0; index < 3; index++) {
                                    
                                    //Prints the corresponding header and data section for each part of the table
                                    result += removeTags($(this).find('th').eq(index).text()) + ": " + removeTags($(this).find('td').eq(index).text());
                                    if(index !== 2) {result += " gold";}
                                    result += "\n";
                                }
                            }
                            
                        });
                    }
                    else {

                        //If the passive section contains another section, it is displayed
                        if($(this).find('h3').length > 0) {
                            result += removeTags($(this).find('h3').text()) + ":\n";
                        }

                        //Prints out the corresponding stats
                        $(this).find('.pi-data-value').each(function(i,e) {
                            if($(this).find('.item').length > 0) {
                                $(this).find('.item').each(function(i,e){
                                    result += $(this).find('.name').attr('data-param') + "\n";
                                });
                            }
                            else{
                                result += removeTags($(this).text()) + "\n";
                            }
                        });
                    }
                    result += "\n";
                }
            });
        });
         //Return a promise with the newly found result text
        return new Promise(resolve => {
            if (result === '') throw new Error("Item stats were not found.");
            setTimeout(() => resolve(result), 1000);
       });
    });
}

// function printItems() {
//     return got('https://leagueoflegends.fandom.com/wiki/Item').then(response => {
//         result = '';
//         const $ = cheerio.load(response.body);
//         $('.tlist').each(function(i,e) {
//             if(i !== 8 && i !== 9) {
//                 $(this).find('.item-icon').each(function(i, e) {
//                     result += "\"" + $(this).attr('data-param') + "\",\n";
//                 });
//             }
//         });
        

//         //Return a promise with the newly found result text
//         return new Promise(resolve => {
//             if (result === '') throw new Error("Item names were not found.");
//             setTimeout(() => resolve(result), 1000);
//        });

//     }).catch(error => {
//         console.log(error);
//     });

// }


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
		if(name === undefined) {
		    name = $(this).find('td').first().text();
                    while(name.indexOf('<') >=0) {
                        name = name.substring(0, name.indexOf('<')-1) + name.substring(name.indexOf('>')+1, name.length);
		    }
		    name = name.substring(0, name.length-1);
		}
                else {
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
                    //console.log(name);
                }
                result += "**" + name + " (" + ability + ")" + "**\n";


                //For-each loop that iterates over each table within the ability 
                $(this).find('table').each(function(i,e) {

                    //For-each loop that iterates over each p element (description) within the ability
                    $(this).find('p').each(function(i,e) {

                        //Removes all img src elements from the <p> text
                        let text = $(this).text();
                        text = removeTags(text);

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
                                    text = removeTags(text);

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
                            text = removeTags(text);

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
                        text = removeTags(text);

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
             if (result === '') throw new Error("Champion abilities were not found.");
             setTimeout(() => resolve(result), 1000);
        });
    });

}

client.on('ready', () => {

    console.log('Logged in as ' + client.user["username"] + '!');
});

client.on('message', msg  => {
    if(msg.content.includes(":pizzaDog:") || msg.content.toLowerCase().includes("pizza dog")){
        msg.channel.send("Bow bow, shut ya mouth!");
	    return false;
    }
    else if(!msg.content.startsWith("!") || msg.author.bot) return;


    const args = msg.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    offset = 0;
    
    // Checks if command is for champion
    // TODO: Implement item, rune functionality
    if(command === 'champ' || command === 'stats') {

        //Check if arguments list is empty
        if(!args.length) {
            return msg.channel.send('Please add the parameters for the command `!lol [champion, rune, item name]`');

        }

        //Values that will be used to check if user wants a specific part of champion abilities
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
        name = convertAbbreviation(name.toLowerCase());
        name = fixSpecialCharacters(name, champ_names);

        if(!['q', 'w', 'e', 'r', 'p', ''].includes(param) && command !== 'stats') {
            msg.channel.send("The parameter `" + args[args.length-1] + "` is not valid. Please use one of [q, w, e, r, p(assive), (blank)].")
        }
        else if (champ_names.includes(name) === true) {
            //let url = "https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay";
            let result = '';
            if(command === 'stats') {
                parseStats("https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay").then(value => {
                    result = value;
                    console.log(result);
                    wrapText(result, msg.channel);
                }).catch(error => {
                    msg.channel.send('Error finding champion:' +name + ' stats information.');
                    console.log(error);
                });

            }
            else{
                parseAbilities("https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay", param.toLowerCase()).then(value =>{
                    result = value;
                    console.log(value);
                    wrapText(result, msg.channel);
                }).catch(error => {
                    msg.channel.send('Error finding champion:' +name + ' ability information.');
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
        //Builds champion name by adding all array elements - offset (since some champions require spaces)

        //Check if arguments list is empty
        if(!args.length) {
            return msg.channel.send('Please add the parameters for the command `!lol [champion, rune, item name]`');
        }

        let name = '';
        for(i=0; i < args.length - offset; i++) {
            if(i===0) {name = args[i];}
            else {name = name + "_" + args[i];}

        }

        name = convertAbbreviation(name.toLowerCase());
        name = fixSpecialCharacters(name, item_names);

        if(item_names.includes(name)) {
            console.log(name);        
            parseItem("https://leagueoflegends.fandom.com/wiki/" + name).then(value => {
                result = value;
                console.log(result);
                wrapText(result, msg.channel);
            });
        }
        else {
            console.log("Not a valid url");
            msg.channel.send(name + " is not a valid item.");
        }
        // printItems().then(result => {
        //     console.log(result);
        //     wrapText(result, msg.channel);
        // });
    }
    else if (command === "rune") {

    }
    else {
        msg.channel.send("`!" + command + "`" + " is not a valid command. \nTry using: \n`!champ [name] [q, w, e, r, p(assive), (blank)]` \n`!item [name]` \n`!rune [name]` \n These commands are not case-sensitive.");
    }
});


client.login(token);
