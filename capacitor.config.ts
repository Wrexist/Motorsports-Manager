import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pitlanemanager.app",
  appName: "Pit Lane Manager",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
