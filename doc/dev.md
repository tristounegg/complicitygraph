## Docker commands

docker compose run --rm api python manage.py makemigrations
docker compose run --rm api python manage.py migrate
docker compose run --rm api python manage.py createsuperuser

docker compose run --rm api python manage.py shell

## Backend

### Enhancements

- `build_graph` use first instanceOf node, we could display all of them but this requires updating the frontend

- api.graph is not optimized (we are loading he graph into memory various times to do various calculations) we need a graph database... neo4jwith pythn orm neomodel or even Django-Neomodel ?

## precommit

`pre-commit install`
