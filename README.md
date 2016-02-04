# #! dashboard

## Intro
SSHable dashboard for #! and related services.

## Installation

* Clone the repo

``git clone https://github.com/hashbang/dashboard.git``

* Change dir and generate host keys

``cd dashboard``
``chmod +x ./generate-key && ./generate-key.sh``

* Install deps and start app

``npm install && node index.js``

## Usage
ssh -p 55555 localhost
