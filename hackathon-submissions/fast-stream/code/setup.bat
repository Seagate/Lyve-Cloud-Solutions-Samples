@REM Batch file for Windows

npm run build
docker rm fast-stream
docker rmi fast-stream
docker build -t fast-stream .