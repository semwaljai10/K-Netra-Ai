// server.js
// Custom server wrapper to handle dynamic port mapping required by Zoho Catalyst AppSail.

// AppSail assigns a dynamic port via X_ZOHO_CATALYST_LISTEN_PORT
const port = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3000;
process.env.PORT = port;
process.env.HOSTNAME = '0.0.0.0';

console.log(`[Catalyst AppSail] Launching Next.js server on port ${port}...`);

// Require the compiled standalone Next.js server
require('./.next/standalone/server.js');
