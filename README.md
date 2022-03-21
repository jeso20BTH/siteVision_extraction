# Bash program to extract data from siteVision
An program that can fetch data from siteVision.

## Requirements
To be able to run the program you need to fullfill these requirements.
- Node
- NPM
- MariaDB in terminal

## Getting started
When the requirements are fullfilled you can follow the bellow steps to get started.
1. create `config_url.json` in `modules` folder. with the following content:
``` JSON
{
    "baseURL": "<URL to your siteVision repository>",
    "baseURI": "<URI for the root node of the repo you want to extract data from>"
}
```
2. Start the bash-script `bash main.bash`
    -   Select `choice 1` to start the configuration, enter bellow information to config the database.
        -   `Database` - The name of the database.
        -   `Username` - The username of the user you want to access the database with.
        -   `Password` - The password of above user.
        -   `Port` - The port you can access the database on.
        -   `Host` - The host the database runs on.
    -   When the conig is done, you can select `choice 2` to get started.
