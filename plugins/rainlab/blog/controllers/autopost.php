<?php namespace RainLab\Blog\Controllers;

use Backend\Classes\Controller;
use RainLab\Blog\Models\TwitterAPIExchange;

class autopost extends Controller 
{

    public function index()
    {
        $url = 'https://api.twitter.com/1.1/statuses/update.json';
        $requestMethod = 'POST';
        $postfields = array(
            'status' => $_GET['status']
        );
        $settings = array(
            'oauth_access_token' => "2980637979-4sWzYamvcSgNs4wybkCiqSphWUuOUbxAR0PstWS",
            'oauth_access_token_secret' => "NhxQP7EVeWhxQF3prgQwsOE8cKzn1v62uQ0K7h0BbYfnf",
            'consumer_key' => "19ZdJnoTw2mOD5CwK3coT3QfY",
            'consumer_secret' => "CPvkIjCJYi4wOwWBoDokWEo84Mih5B4cN70QRZchSXWXcDApgi"
        );
        $twitter = new TwitterAPIExchange($settings);
        $twitter->buildOauth($url, $requestMethod)
             ->setPostfields($postfields)
             ->performRequest();
    }
}
