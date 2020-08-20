const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {

    console.log('Logged in as ' + client.user["username"] + '!');
});

client.on('message', msg  => {
    if(msg.content === '!lol') {
        msg.channel.send('Pong')
    }
});

client.login('NzQ2MDQ2ODU3NTk1MzIyNDc5.Xz6oRw.4detIbbS8SIjfA-7yi0TvCh8FZE')