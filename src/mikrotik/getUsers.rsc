:global users "";
:foreach user in=[/user find] do={
    :global name [/user get $user name];
    :global group [/user get $user group];
    :global lastLoggedIn [/user get $user last-logged-in];
    :global disabled [/user get $user disabled];
    :global address [/user get $user address];
    
    :global users ($users . "{");
    :global users ($users . "\"id\": \"$user\",");
    :global users ($users . "\"name\": \"$name\",");
    :global users ($users . "\"group\": \"$group\",");
    :global users ($users . "\"lastLoggedIn\": \"$lastLoggedIn\",");
    :global users ($users . "\"disabled\": \"$disabled\",");
    :global users ($users . "\"address\": \"$address\"");
    :global users ($users . "},");
};
:global users [:pick $users 0 ([:len $users] - 1)];
:global users ("[" . $users . "]");
:put $users;
