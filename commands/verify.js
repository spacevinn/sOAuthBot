const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Setup verification system')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send the verification message')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to give after verification')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');

    if (!channel.isTextBased()) {
      return interaction.reply({ content: 'Please select a text channel for verification.', ephemeral: true });
    }

    const verifyEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('🔐 Server Verification')
      .setDescription('Welcome to our amazing server! 🎉\nTo access all channels, please verify yourself by clicking the button below.')
      .setImage('https://i.imgur.com/XxxXxXx.png') 
      .setFooter({ text: 'Powered by AwesomeBot', iconURL: interaction.client.user.displayAvatarURL() });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('verify_button')
          .setLabel('Verify Me')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅')
      );

    try {
      await channel.send({ embeds: [verifyEmbed], components: [row] });

      interaction.client.verifyRole = role.id;

      await interaction.reply({ content: `Verification system set up in ${channel}! Users will receive the ${role} role upon verification.`, ephemeral: true });
    } catch (error) {
      console.error('Error sending verification message:', error);
      await interaction.reply({ content: 'There was an error setting up the verification system. Please check the bot permissions and try again.', ephemeral: true });
    }
  },
};
