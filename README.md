# IoBikes-Platform

Platform Repository of the Internet of Bicycles project at the Institute for Geoinformatics

## Run with Docker

Install Docker with docker-compose, clone this repository and then run

```docker-compose up```

This will spawn 3 containers, one for PostgreSQL with PostGIS, one with nginx and PHP5, the third for the API written in NodeJS.

## How to use

Set up your (Sigfox) callback to

```http://hostname/insert.php?id=dev999&lat=1.0&lng=1.0&data=0078e04f426412f340&rssi=rssi&time=1434126693&signal=signal&station=station&avgSignal=avgSignal&duplicate=duplicate``` 

Insert placeholders as needed, this URL is an example request.

Open `http://hostname/list.php` to check if something has been submitted.

## License

MIT, see [LICENSE](LICENSE)

## Related repositories

* Android app: See [aohrem/IoBApp](https://github.com/aohrem/IoBApp)
* Device group: See [nicho90/IoB-Devices](https://github.com/nicho90/IoB-Devices)