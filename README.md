![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

# DB-SYNC
A simple developer tool to synchronize POSTGRES local databases for node apis.


## How to use

Install using npm or yarn as development dependency:

```bash
npm i @conversu/db-sync -D
```

```bash
yarn add @conversu/db-sync -D
```

Register at you package.json as script:


```json
{
    "scripts": {
        "db:export": "node ./node_modules/@conversu/db-sync/index.mjs db:export mode=debug output=\"./\" env=\"./.env.development\" filename=db-data.sql"
    }
}
```

Run as you need:

```bash
    npm run db:export
```

## Arguments
```bash
node ./index.mjs <operation> output="C:/your/project/path" env="C:/your/project/path/.env.development" filename=example.sql mode=<debug|quiet>
```



### Required
<ul>
    <li><strong>operation:</strong> must be the first argument</li>
    <li><strong>output:</strong> it's the directory where the .sql will be created</li>
    <li><strong>env:</strong> it's the directory of a .env file that must contains the database configurations</li>
</ul>

### Optional
<ul>
    <li><strong>mode:</strong> show or hide details on console during execution</li>
    <li><strong>filename:</strong> it's the filename of .sql that will be created</li>
</ul>




## Operations

<ul>
    <li><strong>db:export</strong> -> will export the entire database or a single table into a .sql file</li>
    <li><strong>db:import</strong> -> not implemented yet</li>
    <li><strong>db:reset</strong> -> not implemented yet</li>
</ul>


## Author
<a href='https://github.com/pablovicz' target="_blank">Pablo Woinarovicz Ramos</a>


## License
 [MIT licensed](LICENSE).