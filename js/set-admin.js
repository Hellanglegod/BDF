const admin = require('firebase-admin');

const serviceAccount =
  require('./serviceAccountKey.json');

admin.initializeApp({
  credential:
    admin.credential.cert(serviceAccount)
});

const email =
  'kothari.jihan@gmail.com';

async function makeAdmin() {

  try {

    const user =
      await admin.auth()
      .getUserByEmail(email);

    await admin.auth()
      .setCustomUserClaims(
        user.uid,
        { admin: true }
      );

    console.log(
      `${email} is now ADMIN`
    );

    process.exit();

  } catch (e) {

    console.error(e);

    process.exit(1);

  }

}

makeAdmin();