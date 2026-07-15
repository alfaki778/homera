<?php
return [
    'host' => getenv('HOMERA_DB_HOST') ?: '127.0.0.1',
    'port' => (int)(getenv('HOMERA_DB_PORT') ?: 3306),
    'database' => getenv('HOMERA_DB_NAME') ?: 'homera',
    'username' => getenv('HOMERA_DB_USER') ?: 'root',
    'password' => getenv('HOMERA_DB_PASS') ?: '',
    'charset' => 'utf8mb4',
];
