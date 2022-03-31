#!/usr/bin/env bash
#
# Author: Jesper Stolt
# Description:
# A bash script for extracting data from SiteVision
#
# Needed resources:
# npm
# node
# mariaDB
#

function print-menu
{
    local description=(
    ""
    ""
    "  +--------------------------------------------------+"
    "  |  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  |"
    "  |  *  +--------------------------------------+  *  | "
    "  |  *  |         SITEVISION EXTRACTION        |  *  | "
    "  |  *  +--------------------------------------+  *  | "
    "  |  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  |"
    "  +--------------------------------------------------+"
    "  |                     Choices                      |"
    "  +--------------------------------------------------+"
    "  | 1:                       Setup or reset database |"
    "  | 2:                     Run program to fetch data |"
    "  | 3:                             Display node tree |"
    "  | 4:           Get all children parent connections |"
    "  | 5:                                 Get root node |"
    "  | 6:                                  Get all node |"
    "  | 7:                              Remove node file |"
    "  | 8:                           Remove config files |"
    "  +--------------------------------------------------+"
    "  |                     Commands                     |"
    "  +--------------------------------------------------+"
    "  | config:         Show the content of config files |"
    "  | quit:                      Terminate the program |"
    "  | exit:                      Terminate the program |"
    "  | done:                      Terminate the program |"
    "  +--------------------------------------------------+"
    )

    printf "%s\\n" "${description[@]}"
}

# Choice one - setup needed things for choice 2 to run
function choice-1
{
    printf "\\n\\n%s\\n" "Setup program:"
    # Remove old files
    echo 'Removing old files..................................[1/8]'
    remove-files

    # Install needed packages
    echo 'Installing packages.................................[2/8]'
    npm 'install' &>'/dev/null'

    # Create needed folders
    echo 'Creating folders....................................[3/8]'
    mkdir 'files/'

    # Setup parameters for the database
    printf "%s\\n%s" "Define the database.................................[4/8]" "  Database name: "
    read -r database
    printf "%s" "  Username:      "
    read -r user
    printf "%s" "  Password:      "

    # Read password with censoring
    unset password;
    while IFS= read -r -s -n1 pass; do
        if [[ -z $pass ]]; then
            echo
            break
        else
            echo -n '*'
            password+=$pass
        fi
    done

    printf "%s" "  Port:          "
    read -r port
    printf "%s" "  Host:          "
    read -r host
    printf "%s\\n%s" "  Enter username and password for user allowed to create a database" "    Username:          "
    read -r rootuser
    printf "%s" "    Password:          "

    # Read password with censoring
    unset rootpassword;
    while IFS= read -r -s -n1 pass; do
        if [[ -z $pass ]]; then
            echo
            break
        else
            echo -n '*'
            rootpassword+=$pass
        fi
    done

    # Create config-file for the database
    printf "%s\\n" 'Creating SQL config file............................[5/8]'
    config-sql "$database" "$user" "$password"

    # Setup database
    echo 'Seting up the database..............................[6/8]'
    cd sql/
    # mariadb --user="$rootuser" --password="$rootpassword" <'00_setup_database.sql'
    mariadb --user="$rootuser" --password="$rootpassword" -e "SOURCE variables.sql; SOURCE 01_create_database.sql; use $database; SOURCE 02_add_user.sql; SOURCE 03_create_tables.sql;"
    cd ..

    # Generate file used for db-connection
    echo 'Setting up the JSON config for JavaScript program...[7/8]'
    config-json $host $port $user $password $database

    # Create file used by bash-script to access db
    echo 'Setting up the bash config for the bash script......[8/8]'
    config-bash $database $user $password
}

# Run the program that extract data from sitevision
function choice-2
{
    if [ ! -e 'files/bash_config.data' ]; then
        config-json
    fi
    node 'index.js'
}

# Show how the node the is shaped, with different layers for each child.
function choice-3
{
    node 'modules/show_tree.js'
}

# Get data from page table, showing the parents of each node.
function choice-4
{
    if [ ! -e 'files/bash_config.data' ]; then
        config-bash
    fi

    sql-query "SELECT display_name, parent_name FROM page;"
}

# Get the root_node from page table.
function choice-5
{
    if [ ! -e 'files/bash_config.data' ]; then
        config-bash
    fi

    sql-query "SELECT id, jcr_id, display_name, parent_id, parent_name, creation_date, publish_date FROM page WHERE parent_name IS NULL;"
}

# Get all nodes from page table.
function choice-6
{
    if [ ! -e 'files/bash_config.data' ]; then
        config-bash
    fi

    sql-query "SELECT id, display_name,  parent_name, creation_date, publish_date FROM page;"
}

# Remove files that keep track of the nodes.
function choice-7
{
    rm 'files/nodes.json'
    rm 'files/parents.json'
}

# Remove the config files
function choice-8
{
    rm -f 'files/bash_config.data'
    rm -f 'sql/variables.sql'
    rm -f 'modules/config.json'
}

function choice-config
{
    printf "\\n\\n%s\\n" "SQL-config:"
    if [ ! -e 'sql/variables.sql' ]; then
        echo "File doesn't exist!"
    else
        cat 'sql/variables.sql'
    fi

    printf "\\n%s\\n" "BASH-config:"
    if [ ! -e 'files/bash_config.data' ]; then
        echo "File doesn't exist!"
    else
        cat 'files/bash_config.data'
    fi

    printf "\\n%s\\n" "JSON-config:"
    if [ ! -e 'modules/config.json' ]; then
        echo "File doesn't exist!"
    else
        cat 'modules/config.json'
    fi
}

function config-bash
{
    if [ $# -eq 0 ]; then
        printf "\\n%s\\n%s" "Define the database:" "  Database name: "
        read -r database
        printf "%s" "  Username:      "
        read -r user
        printf "%s" "  Password:      "
        # Read password with censoring
        unset password;
        while IFS= read -r -s -n1 pass; do
            if [[ -z $pass ]]; then
                echo
                break
            else
                echo -n '*'
                password+=$pass
            fi
        done
    else
        database="$1"
        user="$2"
        password="$3"
    fi

    echo "db,user,pass" > 'files/bash_config.data'
    echo "$database,$user,$password" >> 'files/bash_config.data'
}

function sql-query
{
    db=$(cat "files/bash_config.data"| cut -d "," -f1| tail -n1)
    user=$(cat "files/bash_config.data"| cut -d "," -f2| tail -n1)
    pass=$(cat "files/bash_config.data"| cut -d "," -f3| tail -n1)
    query="$1"
    mariadb --user="$user" --password="$pass" -e "USE $db; $query"
}

function config-json
{
    if [ $# -eq 0 ]; then
        printf "%s\\n%s" "Define the database:" "  Database name: "
        read -r database
        printf "%s" "  Username:      "
        read -r user
        printf "%s" "  Password:      "

        # Read password with censoring
        unset password;
        while IFS= read -r -s -n1 pass; do
            if [[ -z $pass ]]; then
                echo
                break
            else
                echo -n '*'
                password+=$pass
            fi
        done

        printf "%s" "  Port:          "
        read -r port
        printf "%s" "  Host:          "
        read -r host
    else
        host="$1"
        port="$2"
        user="$3"
        password="$4"
        database="$5"
    fi

    echo "{" > 'modules/config.json'
    echo '    "host":     "'"$host"'",' >> 'modules/config.json'
    echo '    "port":     "'"$port"'",' >> 'modules/config.json'
    echo '    "user":     "'"$user"'",' >> 'modules/config.json'
    echo '    "password": "'"$password"'",' >> 'modules/config.json'
    echo '    "database": "'"$database"'"' >> 'modules/config.json'
    echo "}" >> 'modules/config.json'
}

function config-sql
{
    database="$1"
    user="$2"
    pass="$3"

    echo "SET @db = '$database';" > 'sql/variables.sql'
    echo "SET @user = '$user';" >> 'sql/variables.sql'
    echo "SET @pass = '$pass';" >> 'sql/variables.sql'
}

function remove-files
{
    rm -fr 'files/'
    rm -fr 'node_modules'
    rm -f 'package-lock.json'
    rm -f 'sql/variables.sql'
    rm -f 'modules/config.json'
}


#
# Process options
#
function main
{
    printf "\\033c"

    app-init

    local welcome=(
    ""

        ""
    )

    while true
    do
        printf "\\033c"
        print-menu
        printf "\\n%s\\n%s" "  What do you wanna do?" "   -->  "
        read -r userinput
        case "$userinput" in

              quit \
            | "done" \
            | exit)
                printf "\\033c"
                echo "Exiting program..."
                break
            ;;

            *)
                printf "\\033c"
                choice-"$userinput"
            ;;

        esac

        printf "\\n%s\\n\\n%s" "Press enter to continue "
        read -r
    done

    exit 0
}


main "$@"
