import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`UniBridge backend listening on port ${env.PORT}`);
  console.log("Sample HOD token: HOD:fac_001");
  console.log("Sample super-admin token: SUPER_ADMIN:super_admin_001");
});
