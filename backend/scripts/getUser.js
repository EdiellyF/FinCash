import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const email = process.env.EMAIL;
if (!email) {
  console.error('EMAIL env required');
  process.exit(2);
}
(async () => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found for', email);
    process.exit(0);
  }
  const maskedSecret = user.totpSecret ? (user.totpSecret.slice(0,4) + '...' + user.totpSecret.slice(-4)) : null;
  const backupCount = Array.isArray(user.backupCodes) ? user.backupCodes.length : (user.backupCodes ? 'json' : 0);
  console.log(JSON.stringify({ id: user.id, email: user.email, totpEnabled: user.totpEnabled, totpSecretMasked: maskedSecret, backupCount }, null, 2));
  process.exit(0);
})();
