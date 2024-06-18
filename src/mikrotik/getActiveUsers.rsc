:global activeUsers "";
:foreach user in=[/user active find] do={
    :global address [/user active get $user address];
    :global byRomon [/user active get $user by-romon];
    :global group [/user active get $user group];
    :global name [/user active get $user name];
    :global radius [/user active get $user radius];
    :global via [/user active get $user via];
    
    :global activeUsers ($activeUsers . "{");
    :global activeUsers ($activeUsers . "\"id\": \"$user\",");
    :global activeUsers ($activeUsers . "\"address\": \"$address\",");
    :global activeUsers ($activeUsers . "\"byRomon\": \"$byRomon\",");
    :global activeUsers ($activeUsers . "\"group\": \"$group\",");
    :global activeUsers ($activeUsers . "\"name\": \"$name\",");
    :global activeUsers ($activeUsers . "\"radius\": \"$radius\",");
    :global activeUsers ($activeUsers . "\"via\": \"$via\"");
    :global activeUsers ($activeUsers . "},");
};
:global activeUsers [:pick $activeUsers 0 ([:len $activeUsers] - 1)];
:global activeUsers ("[" . $activeUsers . "]");
:put $activeUsers;
