## Install

`npm i`
`grunt`
`grunt help`

## Configuration File

`nano config.json`

Paste the file from the Wiki https://git.enroutesystems.com/roier/enroute-rewards/wiki/config.json

## Troubleshooting

### Setup SSH

```bash
cd ~/.ssh/
ssh-keygen -t rsa -b 4096 -C "{your_email}"
#Generating public/private rsa key pair.
#Enter a file in which to save the key (/Users/you/.ssh/{name_of_your_key}): [Press enter]
#Enter passphrase (empty for no passphrase): [Type a passphrase]
#Enter same passphrase again: [Type passphrase again]
eval "$(ssh-agent -s)"
ssh-add -K ~/.ssh/{name_of_your_key}
pbcopy < ~/.ssh/{name_of_your_key}.pub
```
###### Paste your SSH Key to your settings in

**https://git.enroutesystems.com/user/settings/ssh**

If you recieve a message that you don't have permissions try this steps again

```bash
eval "$(ssh-agent -s)"
ssh-add -K ~/.ssh/{name_of_your_key}
```

### Node Version

`node -v` to check your node version

This project requires v8.1.3

Install **nvm** (`brew install nvm`) to use different node versions

## Grunt

This project requires grunt

`npm i grunt-cli -g`
