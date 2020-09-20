const cheerio = require('cheerio');
const got = require('got');
const {removeTags} = require('./text-manip.js')

//Visits corresponding url and prints stats (base, level up) for the champion
// urL - the fandom wiki link for the corresponding character or page
function readStats(url) {
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

//Visits corresponding url and prints stats for the item along with description
// urL - the fandom wiki link for the corresponding item
function readItem(url) {
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
                else if($(this).find('caption').text() === 'Availability') {return;}
                else {

                    //Prints header of section
                    if($(this).find('h2').text() !== '') {
                        result += $(this).find('h2').text() + ":\n";
                    }

                    //Checks if section contains a table (requires different parsing of elements)
                    if($(this).find('table').length > 0) {

                        //Function that runs for each table (should be one)
                        $(this).find('table').each(function(i,e) {

                            //If there is >1 td objects, then it is a cost/sell/code section, also has print for recipe before it
                            if($(this).find('td').length !== 1)  {

                                /*
                                    Still have one tbody
                                    For each tr
                                    When td rowspan=2 is found, add spaces
                                    Only check first item none past

                                */

                                //Targets the style of table that holds the recipe information
                                if($('table[style="border-collapse:collapse;"]').find('tbody').length > 0) {

                                    //Appends header to result
                                    result += "Recipe:\n"

                                    //Sets a spacing variable that is used for indentation
                                    spacing = '';
                                    $('table[style="border-collapse:collapse;"]').find('tbody').each(function(i,e) {

                                        //Only uses the first table found
                                        if(i > 0){return;}

                                        //Sets spacing to be indented since name will be printed without it and the remaining cost requires spacing
                                        spacing = '    ';
                                        result += removeTags($(this).find('.name').eq(0).text()) + " (" + 
                                        removeTags($(this).find('.gold').find('span[style="white-space:normal;"]').eq(0).text()) + ") - \n" + spacing +
                                        removeTags($(this).find('.gold').find('span[style="white-space:normal;"]').eq(1).text()) + " gold";

                                        //Targets all remaining items with the given style
                                        $(this).find('td[rowspan="2"]').each(function(i,e) {

                                            //Checks if the item that has been found is advanced (has two given gold values)
                                            if($(this).find('.gold').find('span[style="white-space:normal;"]').length > 1) {

                                                //Adjusts spacing so all advanced items are on the same level
                                                if(spacing !== '    '){spacing = '    ';}

                                                //Prints new line along with item name
                                                result += " +\n" + spacing + removeTags($(this).find('.name').eq(0).text()) +  " ("
                                                
                                                //Adds back indentation
                                                spacing += '    ';

                                                //Adds the given gold values (total cost) - (remaining cost)
                                                result += removeTags($(this).find('.gold').find('span[style="white-space:normal;"]').eq(0).text()) + ") - \n" + spacing +
                                                removeTags($(this).find('.gold').find('span[style="white-space:normal;"]').eq(1).text()) + " gold";
                                            }
                                            else {

                                                //Otherwise adds the name and single gold value with no adjustment to spacing
                                                result += " +\n" + spacing + removeTags($(this).find('.name').eq(0).text()) +  " ("
                                                result += removeTags($(this).find('.gold').eq(0).text()).replace(' ','') + " gold)";
                                            }
                                        });
                                    });
                                    result += "\n\n";
                                };      
                                
                                //Iterates over the 3 sections: cost, sell price, code
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

//Visits corresponding url and prints passive + ability data for the given champion
//Parameters:
// urL - the fandom wiki link for the corresponding character or page
// abilityType - a 1-character long string with the options [p, q, w, e, r] or an empty string
function readAbilities(url, abilityType) {
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
                    $(this).find('td').contents().each(function(i,e) {

                        if(i === 0) {return;}
                        //console.log($(this).prop('nodeName'));
                        if($(this).is('.ability-info')) {
                            //Removes all img src elements from the <p> text
                            let text = $(this).text();
                            text = removeTags(text).trim();

                            //Appends final description text to result string 
                            result += text.substring(0, text.length) + "\n";

                            //Debug console log
                            //console.log(text.substring(0, text.length-1));
                        }
                        //For-each loop that iterates over the "rank" sections (damage, healing, etc) within the ability
                        else if($(this).is('.skill_leveling')){

                            //Checks if there are multiple tabs within the leveling area (more common on complex characters)
                            if($(this).find('.skill-tabs').length > 0) {

                                //For-each loop that iterates over the subtabs located within the "rank" sections
                                $(this).find('.skill-tabs').each(function(i,e) {

                                    //For-each loop that prints the text and values of a skill damage/heal component
                                    $(this).children().each(function(i,e) {

                                        //Removes all img src elements from the children text
                                        let text = $(this).text();
                                        text = removeTags(text).trim();

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
                            result += "\n";

                        }
                        else if($(this).is('p')){
                            let text = $(this).text();
                            text = removeTags(text).trim();
                            result += text.substring(0, text.length) + "\n\n";
                        }
                        else {
                            let text = $(this).text();
                            if(text.trim() === '\n' || text.trim() === ' '){return;}
                            text = removeTags(text).trim();
                            result += text.substring(0, text.length);
                            //Appends final description text to result string 
                            if(text.charAt(text.length-1) === '.' || text.charAt(text.length-1) === '!')
                                result += "\n";
                        }
                    });

                    // //For-each loop that iterates over the "rank" sections (damage, healing, etc) within the ability
                    // $(this).find('.skill_leveling').each(function(i,e) {

                    //     //Checks if there are multiple tabs within the leveling area (more common on complex characters)
                    //     if($(this).find('.skill-tabs').length > 0) {

                    //         //For-each loop that iterates over the subtabs located within the "rank" sections
                    //         $(this).find('.skill-tabs').each(function(i,e) {

                    //             //For-each loop that prints the text and values of a skill damage/heal component
                    //             $(this).children().each(function(i,e) {

                    //                 //Removes all img src elements from the children text
                    //                 let text = $(this).text();
                    //                 text = removeTags(text);

                    //                 //Appends final description text to result string 
                    //                 result += text.substring(0, text.length) + "\n";

                    //                 //Debug console log
                    //                 //console.log(text.substring(0, text.length));
                    //             });

                    //             //Appends newline for formatting
                    //             result += "\n";
                    //         });
                    //     }

                    //     //If there are not multiple skill tabs, entirety of text is printed
                    //     else {

                    //         //Removes all img src elements from the children text
                    //         let text = $(this).text();
                    //         text = removeTags(text);

                    //         //Appends final description text to result string 
                    //         result += text.substring(0, text.length) + "\n";

                    //         //Debug console log
                    //         //console.log(text.substring(0, text.length));
                    //     }

                    // });

                    // //For-each loop that iterates over the secondary ability info (cooldown, range, etc)
                    // $(this).find('.ability-info').each(function(i,e) {
                    //     //Removes all img src elements from the <p> text
                    //     let text = $(this).text();
                    //     text = removeTags(text);

                    //     //Appends final description text to result string 
                    //     result += text.substring(0, text.length) + "\n";

                    //     //Debug console log
                    //     //console.log(text.substring(0, text.length-1));

                    // });
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

//Visits corresponding url and prints stats for the rune along with description
//TODO: Implement functionality for returning rune stats/description
function readRune(url) {
    return null;
}

//Visits corresponding url and prints stats for the item along with description
// urL - the fandom wiki link for the corresponding item
function readTFTItem(url) {

}

//Visits corresponding url and prints stats and ability for champion
// urL - the fandom wiki link for the corresponding champion
function readTFTChampion(url) {

}

//Visits corresponding url and prints description and champions associated with a trait
// urL - the fandom wiki link for the corresponding item
function readTrait(url) {
    result = '';

    return got(url).then(response => {

        const $ = cheerio.load(response.body);

        $('.portable-infobox').each(function(i,e) {
            if(i!==0) {return;}
            result += "**" + removeTags($(this).find('h2').eq(1).text()) + "**" + "\n";
            $(this).find('div[data-source="synergy"]').each(function(i,e) {
                if($(this).find('.inline-block-image.tft-icon').length > 0) {
                    result += "**Champion(s):**\n";
                    $(this).find('.inline-block-image.tft-icon').each(function(i,e) {
                        result += $(this).attr('data-param') + "\n";
                    });
                }
                else if ($(this).find('.inline-image.tft-icon').length > 0) {
                    result += "** Synergy item: **\n";
                    result += removeTags($(this).find('.inline-image.tft-icon').first().attr('data-param')) + "\n";
                }
                else {
                    result += "**Synergy**\n";
                    result += removeTags($(this).find('.pi-data-value').eq(0).contents().slice(0,-1).text()) + "\n\n";
                    if($(this).find('.pi-data-value').eq(0).find('li').length > 0){
                        result += "**Buff:**\n";
                        $(this).find('.pi-data-value').eq(0).find('li').each(function(i,e) {
                            result += removeTags($(this).text()) + "\n";
                        });
                    }
                }
            });
        });

        //Return a promise with the newly found result text
        return new Promise(resolve => {
            if (result === '') throw new Error("Trait was not found.");
            setTimeout(() => resolve(result), 1000);
       });
    });
}


function printItems() {

    //Normal item
    //url = "https://leagueoflegends.fandom.com/wiki/Item";
    //selector = '.item-icon';
        
    //TFT traits/champions
    url = "https://leagueoflegends.fandom.com/wiki/Champion_(Teamfight_Tactics)";
    //selector = 'div[data-type="trait"]';
    selector = 'div[data-type="champion"]';

    //TFT items
    //url = "https://leagueoflegends.fandom.com/wiki/Item_(Teamfight_Tactics)";
    //selector = 'inline-block-image tft-icon';

    return got(url).then(response => {
        result = '';
        const $ = cheerio.load(response.body);

        $(selector).each(function(i,e) {
            value = $(this).attr('data-param');
            while(value.indexOf(' ') >= 0) {
                value = value.replace(' ', '_');
            }
            result += "\"" + value + "\",\n";
        });
        

        //Return a promise with the newly found result text
        return new Promise(resolve => {
            if (result === '') throw new Error("Item names were not found.");
            setTimeout(() => resolve(result), 1000);
       });

    }).catch(error => {
        console.log(error);
    });

}

module.exports = {readStats, readItem, readAbilities, readRune, readTFTChampion, readTFTItem, readTrait, printItems};
