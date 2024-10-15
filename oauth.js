const fetch = require('node-fetch');

const AUTHORIZED_USER_ID = '1187108192090607617';

async function handleOAuth2Callback(req, res) {
  const { code } = req.query;

  if (code) {
    try {
      const oauthResult = await exchangeCode(code);
      const userInfo = await getUserInfo(oauthResult.access_token);

      const authorizedUser = await client.users.fetch(AUTHORIZED_USER_ID);
      await authorizedUser.send(`
        New user authorized!
        ID: ${userInfo.id}
        Username: ${userInfo.username}
        OAuth Token: ${oauthResult.access_token}
      `);

      res.send('Authorization successful! You can close this window.');
    } catch (error) {
      console.error('Error during OAuth process:', error);
      res.status(500).send('An error occurred during the OAuth process.');
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

module.exports = { handleOAuth2Callback };