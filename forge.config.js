const { parsed } = require("dotenv").config();
module.exports = {
  packagerConfig: {
    name: "ChatGPT",
    executableName: "ChatGPT",
    icon: "images/icon",
    extendInfo: {
      LSUIElement: "true",
    },
  },
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "vincelwt",
          name: "chatgpt-mac",
        },
        prerelease: true,
      },
    },
  ],

  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-dmg",
      platforms: ["darwin"],
      config: {},
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
};
