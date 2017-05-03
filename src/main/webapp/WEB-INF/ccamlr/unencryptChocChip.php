<?php

$crypt = false;
$text = $argv[1];

// The CCAMLR bakery secret key 
$key = 'SV5LRpKQxSMw8P1tql8q1Ygip8KahmG1dAnj';

$td = mcrypt_module_open('rijndael-128', '', 'ecb', '');
$iv = mcrypt_create_iv(mcrypt_enc_get_iv_size($td), MCRYPT_RAND);

$key = substr($key, 0, mcrypt_enc_get_key_size($td));

mcrypt_generic_init($td, $key, $iv);

if ($crypt) {
	// Base64 encode the encrypted text because the result may contain
	// characters that are not stored consistently in cookies.
	$encrypted_data = base64_encode(mcrypt_generic($td, $text));
} else {
	$encrypted_data = mdecrypt_generic($td, base64_decode($text));
}

mcrypt_generic_deinit($td);
mcrypt_module_close($td);

$firstpos = strpos($encrypted_data, "{") - 4;
$lastpos = strrpos($encrypted_data, "}");
$result = substr($encrypted_data, $firstpos, $lastpos-$firstpos+1);
echo $result;

?>
