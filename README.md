# ChatGPT for desktop

This is a simple app that makes ChatGPT live in your menubar.

You can use Cmd+Shift+G (Mac) or Ctrl+Shift+G (Win) to quickly open it from anywhere.

Download:

- [Mac Silicon](https://github.com/brand-it/chatgpt-mac/releases/download/v1.6.7/ChatGPT-1.6.7-arm64.dmg)
- [Mac](https://github.com/brand-it/chatgpt-mac/releases/download/v1.6.7/ChatGPT-1.6.7.dmg)

No Windows binaries currently offered. Clone the repo, npm install electron-forge and run.

![open-links-in-default-browser](https://github.com/brand-it/chatgpt-mac/assets/13140/da43d3b0-a649-40b5-9e36-7b56a62a2242)
![Jun-02-2023 16-22-20](https://github.com/brand-it/chatgpt-mac/assets/13140/33677af2-20a2-4f92-abc7-6cf6b9170dfd)
![loading-screen](https://github.com/brand-it/chatgpt-mac/assets/13140/6e1854cb-055b-4d9d-b16f-52c425e21aae)
![resizable](https://github.com/brand-it/chatgpt-mac/assets/13140/beb06428-8176-408c-9667-3ed40b1503e9)
![presisted placement](https://github.com/brand-it/chatgpt-mac/assets/13140/1ab6f9d1-403c-4e96-b287-5f46ff9155ab)
![always-on-top](https://github.com/brand-it/chatgpt-mac/assets/13140/3daea699-fad0-40e7-ac53-75612f1bb2db)


#### Development

Quite Start Script
```
bin/setup
```

To setup without the script do the following

To get the correct node version I recommend using asdf. It is the simplest tool that lets you hook in all sort of programming languages.

```
asdf install
```

```
export NODE_ENV=development
```

It helps out to set the NODE_ENV=development. You don't have to it will also be pulled from the .env file.

Boot the app with NPM Start
```
npm start
```

#### Deployment/Release

It will build package and push them to the github repo. This step won't push unless you have the ability to create release on the github repo.

```
export GH_TOKEN=github-token
npm run dist
```

If you don't want to distribute the packages you can simply run `npm run pack`. Out side of that your done. Best of luck and have fun.
