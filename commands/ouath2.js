const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { getAuthorizedUsers } = require('../utils/oauth.js');

const AUTHORIZED_USER_ID = '1187108192090607617';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oauth2')
    .setDescription('OAuth2 related commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Show OAuth2 statistics'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('invite')
        .setDescription('Generate an OAuth2 invite link'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('join')
        .setDescription('Add authorized users to a server')
        .addStringOption(option => 
          option.setName('server_id')
            .setDescription('The ID of the server to add users to')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (interaction.user.id !== AUTHORIZED_USER_ID) {
      return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'stats':
        return this.showStats(interaction);
      case 'invite':
        return this.generateInvite(interaction);
      case 'join':
        return this.joinServer(interaction);
    }
  },

  async showStats(interaction) {
    const authorizedUsers = getAuthorizedUsers();
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('OAuth2 Statistics')
      .addFields(
        { name: 'Total Authorized Users', value: authorizedUsers.length.toString() },
        { name: 'Last Authorized User', value: authorizedUsers.length > 0 ? `${authorizedUsers[authorizedUsers.length - 1].username}#${authorizedUsers[authorizedUsers.length - 1].discriminator}` : 'None' }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  async generateInvite(interaction) {
    const invite = `https://discord.com/oauth2/authorize?client_id=1295534534758236282&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback&scope=identify+guilds.join`;
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Authorize Bot')
          .setStyle(ButtonStyle.Link)
          .setURL(invite)
      );

    await interaction.reply({ content: 'Here\'s your OAuth2 authorization link:', components: [row] });
  },

  async joinServer(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const serverId = interaction.options.getString('server_id');
    const authorizedUsers = getAuthorizedUsers();

    if (authorizedUsers.length === 0) {
      return interaction.editReply({ content: 'There are no authorized users to add.', ephemeral: true });
    }

    const targetGuild = await interaction.client.guilds.fetch(serverId).catch(() => null);
    if (!targetGuild) {
      return interaction.editReply({ content: 'Invalid server ID or bot is not in that server.', ephemeral: true });
    }

    let addedCount = 0;
    let failedCount = 0;
    let errorMessages = [];

    for (const user of authorizedUsers) {
      try {
        await targetGuild.members.add(user.id, { accessToken: user.access_token });
        addedCount++;
      } catch (error) {
        console.error(`Failed to add user ${user.id} to server ${serverId}:`, error);
        failedCount++;
        errorMessages.push(`Failed to add user ${user.id}: ${error.message}`);
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Server Join Results')
      .addFields(
        { name: 'Users Added', value: addedCount.toString() },
        { name: 'Failed Additions', value: failedCount.toString() }
      )
      .setTimestamp();

    if (errorMessages.length > 0) {
      embed.addFields({ name: 'Error Details', value: errorMessages.slice(0, 10).join('\n').slice(0, 1024) });
      if (errorMessages.length > 10) {
        embed.addFields({ name: 'Note', value: `${errorMessages.length - 10} more errors occurred but were not displayed.` });
      }
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('OAuth2 URL')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/oauth2/authorize?client_id=1295534534758236282&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback&scope=identify+guilds.join`)
      );

    await interaction.editReply({ embeds: [embed], components: [row], ephemeral: true });
  }
};
