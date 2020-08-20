const Discord = require('discord.js');
const client = new Discord.Client();

var champ_names =["Aatrox","Ahri","Akali","Alistar","Amumu",
"Anivia","Annie","Aphelios","Ashe","Aurelion_Sol","Azir","Bard",
"Blitzcrank","Brand","Braum","Caitlyn","Camille","Cassiopeia",
"Cho'Gath","Corki","Darius","Diana","Draven","Dr_Mundo","Ekko",
"Elise","Evelynn","Ezreal","Fiddlesticks","Fiora","Fizz","Galio",
"Gangplank","Garen","Gnar","Gragas","Graves","Hecarim",
"Heimerdinger","Illaoi","Irelia","Ivern","Janna","JarvanIV",
"Jax","Jayce","Jhin","Jinx","Kai'Sa","Kalista","Karma","Karthus",
"Kassadin","Katarina","Kayle","Kayn","Kennen","Kha'zix","Kindred",
"Kled","KogMaw","Leblanc","Lee_Sin","Leona","Lillia","Lissandra",
"Lucian","Lulu","Lux","Malphite","Malzahar","Maokai","MasterYi",
"Miss_Fortune","Mordekaiser","Morgana","Nami","Nasus",
"Nautilus","Neeko","Nidalee","Nocturne","Nunu","Olaf","Orianna",
"Ornn","Pantheon","Poppy","Pyke","Qiyana","Quinn","Rakan","Rammus",
"Rek'Sai","Renekton","Rengar","Riven","Rumble","Ryze","Sejuani",
"Senna","Sett","Shaco","Shen","Shyvana","Singed","Sion","Sivir",
"Skarner","Sona","Soraka","Swain","Sylas","Syndra","Tahm_Kench",
"Taliyah","Talon","Taric","Teemo","Thresh","Tristana","Trundle",
"Tryndamere","Twisted_Fate","Twitch","Udyr","Urgot","Varus","Vayne",
"Veigar","Vel'Koz","Vi","Viktor","Vladimir","Volibear","Warwick", "Wukong",
"Xayah","Xerath","Xin_Zhao","Yasuo","Yone","Yorick","Yuumi","Zac","Zed","Ziggs","Zilean","Zoe","Zyra"]

function firstIndexOfLetter(list, letter) {
    for (i = 0; i < list.length; i++) {
        if(list[i].charAt(0) === letter)
            return i;
    }
    return -1;
}
function lastIndexOfLetter(list, letter) {
    let found = false;
    if(list[list.length-1].charAt(0) === letter) {
        return list.length
    }
    for (i = 1; i < list.length; i++) {
        if(list[i-1].charAt(0) === letter && list[i].charAt(0) !== letter)
            return i;
    }
    return -1;
}


function fixSpecialCharacters(name) {
    let fixed = name;
    while(fixed.indexOf(' ') >= 0) {
        fixed = fixed.replace(' ', '_');
    }
    // lower = firstIndexOfLetter(fixed.charAt(0));
    // upper = lastIndexOfLetter(fixed.charAt(0));

    //for(i=lower;i< upper; i++) {
    for(i = 0; i < champ_names.length; i++) {
        if(champ_names[i].replace('_', '').toUpperCase() === fixed.toUpperCase() || champ_names[i].replace('\'', '').toUpperCase() === fixed.toUpperCase())
            return champ_names[i];
    }
    return fixed;
}

function findChamp(name) {
    return champ_names.includes(name);
}
function convertAbbreviation(name) {

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

client.on('ready', () => {

    console.log('Logged in as ' + client.user["username"] + '!');
});

client.on('message', msg  => {
    if(msg.content.length > 4) {
        if(msg.content.substring(0, 4) === '!lol') {
            let name = convertAbbrevation(msg.content.substring(5, msg.content.length));
            name = fixSpecialCharacters(name.toUpperCase());
            if (findChamp(name) === true) {
                msg.channel.send("https://leagueoflegends.fandom.com/wiki/" + name);
            }
            else {
                msg.channel.send('Champion: ' + msg.content.substring(4, msg.content.length) + ' not found');
            }
            
        }
    }
    else if (msg.content === '!lol') {
        msg.reply('please add the parameters for the command `!lol [champion, rune, item name]`')
    }
});

client.login('NzQ2MDQ2ODU3NTk1MzIyNDc5.Xz6oRw.AIndVS-TgJ5cBLZbiM9zKpqHCvQ')