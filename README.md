# Understory
Her laver vi vores DIS projekt



# Kørsel af projekt med TLS v2
Installer OpenSSL

Kør følgende i terminal:
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

Tilgå via https://localhost:3000 
Her vil den sige "forbindelse er ikke sikker", tryk avanceret og herefter tilgå alligevel


Kør NPM start for at køre 