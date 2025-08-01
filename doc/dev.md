## Docker commands

docker compose run --rm api python manage.py makemigrations
docker compose run --rm api python manage.py migrate
docker compose run --rm api python manage.py createsuperuser

docker compose run --rm api python manage.py shell
