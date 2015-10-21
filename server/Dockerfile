FROM nginx

RUN apt-get update; \
    apt-get -y install php5-fpm php5-curl php5-pgsql curl php5-json

RUN usermod -a -G www-data nginx

CMD service php5-fpm start && nginx -g 'daemon off;'