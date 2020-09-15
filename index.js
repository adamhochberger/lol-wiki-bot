
const {champ_names, item_names} = require('./config.json');
const {token} = require('./auth.json');
const Discord = require('discord.js');
const client = new Discord.Client();
const Parser = require('./parser.js');
const TextManip = require('./text-manip.js');

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

client.on('ready', () => {

    console.log('Logged in as ' + client.user["username"] + '!');
});

client.on('message', msg  => {
    if(!msg.content.startsWith("!") || msg.author.bot) return;

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
        name = TextManip.convertAbbreviation(name.toLowerCase());
        name = TextManip.fixSpecialCharacters(name, champ_names);

        if(!['q', 'w', 'e', 'r', 'p', ''].includes(param) && command !== 'stats') {
            msg.channel.send("The parameter `" + args[args.length-1] + "` is not valid. Please use one of [q, w, e, r, p(assive), (blank)].")
        }
        else if (champ_names.includes(name) === true) {
            //let url = "https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay";
            let result = '';
            if(command === 'stats') {
                Parser.readStats("https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay").then(value => {
                    result = value;
                    console.log(result);
                    wrapText(result, msg.channel);
                }).catch(error => {
                    msg.channel.send('Error finding champion:' +name + ' stats information.');
                    console.log(error);
                });

            }
            else{
                Parser.readAbilities("https://leagueoflegends.fandom.com/wiki/" + name + "/LoL/Gameplay", param.toLowerCase()).then(value =>{
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

        // //Check if arguments list is empty
        if(!args.length) {
            return msg.channel.send('Please add the parameters for the command `!item [name]`');
        }

        let name = '';
        for(i=0; i < args.length - offset; i++) {
            if(i===0) {name = args[i];}
            else {name = name + "_" + args[i];}

        }

        name = TextManip.convertAbbreviation(name.toLowerCase());
        name = TextManip.fixSpecialCharacters(name, item_names);

        if(item_names.includes(name)) {
            console.log(name);        
            Parser.readItem("https://leagueoflegends.fandom.com/wiki/" + name).then(value => {
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
