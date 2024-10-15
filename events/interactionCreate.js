const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === 'verify_button') {
        const oauthUrl = `https://discord.com/oauth2/authorize?client_id=1295534534758236282&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback&scope=identify+guilds.join`;
        
        await interaction.reply({ content: `Please click [here](${oauthUrl}) to verify yourself.`, ephemeral: true });
      }
    }
  },
};
