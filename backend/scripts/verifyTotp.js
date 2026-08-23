import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as otplib from 'otplib';

const prisma = new PrismaClient();
const email = process.env.EMAIL;
const token = process.env.TOKEN;

if (!email) {
  console.error('EMAIL env required');
  process.exit(2);
}
if (!token) {
  console.error('TOKEN env required');
  process.exit(2);
}

(async () => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error('User not found for', email);
      process.exit(0);
    }
    const secret = user.totpSecret;
    const maskedSecret = secret ? (secret.slice(0,4) + '...' + secret.slice(-4)) : null;
    console.log(JSON.stringify({ id: user.id, email: user.email, totpEnabled: user.totpEnabled, totpSecretMasked: maskedSecret }, null, 2));

    if (!secret) {
      console.error('No totpSecret set for this user');
      process.exit(0);
    }

    const tokenTrim = token.toString().trim();

    // Try modern API: otplib.verify({ token, secret, window }) or named functions
    let valid = false;
    let method = null;
    try {
      if (typeof otplib.verify === 'function') {
        valid = await otplib.verify({ token: tokenTrim, secret, window: 1 });
        method = 'otplib.verify';
      } else if (otplib.authenticator && typeof otplib.authenticator.verify === 'function') {
        valid = await otplib.authenticator.verify({ token: tokenTrim, secret, window: 1 });
        method = 'authenticator.verify';
      } else if (otplib.authenticator && typeof otplib.authenticator.check === 'function') {
        // check may be sync or async
        const res = otplib.authenticator.check(tokenTrim, secret);
        valid = res instanceof Promise ? await res : res;
        method = 'authenticator.check';
      } else if (otplib.totp && typeof otplib.totp.check === 'function') {
        const res = otplib.totp.check(tokenTrim, secret);
        valid = res instanceof Promise ? await res : res;
        method = 'totp.check';
      } else {
        method = 'unknown';
        console.warn('No known otplib verify method detected');
      }
    } catch (err) {
      console.error('Error while verifying with otplib:', err.message || err);
      process.exit(1);
    }

    console.log('Verification method:', method);
    console.log('Token valid:', valid);
    process.exit(0);
  } catch (err) {
    console.error('Error', err);
    process.exit(1);
  }
})();
