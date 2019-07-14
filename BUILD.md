How to execute
------------------

docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock -v ~/portainer_data:/data gitple/portainer

How to build
--------------

- build binary
```
mkdir -p dist/portainer
cd build/
./build_binary.sh
```

- build app
```
npm run build

docker build . -f Dockerfile -t gitple/portainer:`date +"%Y%m%d"`

docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock gitple/portainer:20190714
```

- push to dockerhub
```
docker login - gitple/g..8
docker push gitple/portainer:`date +"%Y%m%d"`
docker tag gitple/portainer:`date +"%Y%m%d"` gitple/portainer:latest
docker push gitple/portainer:latest
```
