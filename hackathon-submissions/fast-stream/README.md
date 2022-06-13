# Fast-Stream

![Fast-Stream Logo](images/FS-logo.png)

[Video Demo](https://drive.google.com/file/d/1CE-z2mlPGWXvPxN3Jtw-KPkkRNZTUyKV/view?usp=sharing)

## Introduction
Fast-Stream is a simple API-based web application prototype that aims to function as a media streaming server middleware solution for Lyve Cloud S3 Storage.   

At its core, it allows for streaming of various media, such as video, audio or images through requests following REST and other HTTP-supporting protocols. As long as clients are able to issue request to Fast-Stream's API endpoints, they will be able to stream their desired media.   

Other key features include: 
-  Fast streaming due to delivering and streaming data in byte chunks, and NodeJS backend
-  Local Caching of popularly requested media for faster TTFB
-  High scalability in terms of handling multiple user requests due to NodeJS's and ExpressJS's asynchronous event-driven paradigm and non-blocking I/O runtime
-  High scalability in terms of spinning up instances across servers due to containerisation (Docker) support
-  Handles CORS policy for cross-origin requests
-  Support for streaming with pure HTML `<video>` element without any JS components needed

Fast-Stream also comes with a simple accompanying web UI. The UI acts as a dashboard to view available data and test the streaming of different data, but can be expanded to handle authentication or access control to different media by different users if needed. 

## Requirements
Operating Systems: Windows 64-Bit, MacOS 64-Bit (X86_64, Arm64), Linux 64-Bit (X86_64, Arm64)

_For Non-Docker Deployments_
Dependencies: 
-  NodeJS: >=18.0.0 recommended
-  NPM: >=8.8.0 recommended
-  (For M1 Macs) Python: >=3.7.0 recommended
-  (For M1 Macs) XCode Command Line Tools

_For Docker Deployments_
Dependencies: 
-  NodeJS: >=18.0.0 recommended
-  NPM: >=8.8.0 recommended
-  Docker: >=20.10.0 recommended

Developed on: MacOS 11.3.1 (Arm64), NodeJS v18.1.0, NPM v8.8.0, Docker v20.10.11, Python v3.9.12

## Known Limitations 
-  Simple file-based error and request logging only
-  Mainly supports normal HTML element byte-range streaming, yet to have support for Adaptive Bit Rate protocols 
-  Keys are kept using Docker Secrets or as environment variables

##### Key areas to address during the challenge
* Security
* Performance
* Resiliency 
* Scalability
* Recovery

## Running Steps (Using Docker)
**Step 1:** Get your Lyve Cloud bucket credentials.   
Here's what you'll need:
* Access Key
* Secret key
* Endpoint URL
* Region

**Step 2:** 
Open up the Command Line Interface and navigate to the folder called `code/` from the current folder holding this README.md file. 

**Step 3:** 
Run the following command to initialise the NPM modules needed:

```
npm install
```

Ensure that the Docker engine is running.   

**Step 4:** Build the UI distribution files and docker image by running the `setup.sh` file (Unix-like) or `setup.bat` file (Windows). Modify these files if you want to change the name of the docker image. 

Unix-like
```
$ sh setup.sh
```

Windows
```
> setup.bat
```

**Step 5:** 
Create the following Docker Volumes to mount into the solution container: 

```
docker volume create <logs-volume-name>
docker volume create <data-volume-name>
```

Where the `<logs-volume-name>` is where the access and error logs are stored and `<data-volume-name>` is where the data used by the local caching script is stored

**Step 6:** 
Run the docker image using the following command: 

Default (No changes to docker image name)
```
docker run -p <port-ext>:<port-int> --name <desired-container-name> --mount source=<logs-volume-name>,target=/usr/src/app/server/logs --mount source=<data-volume-name>,target=/usr/src/app/server/data -e AWS_SECRET_ACCESS_KEY=<secret-key> -e AWS_ACCESS_KEY_ID=<access-key> -e AWS_REGION=<region> -e AWS_ENDPOINT=<endpoint> -e PORT=<port-int> fast-stream
```

Customised
```
docker run -p <port-ext>:<port-int> --name <desired-container-name> --mount source=<logs-volume-name>,target=/usr/src/app/server/logs --mount source=<data-volume-name>,target=/usr/src/app/server/data -e AWS_SECRET_ACCESS_KEY=<secret-key> -e AWS_ACCESS_KEY_ID=<access-key> -e AWS_REGION=<region> -e AWS_ENDPOINT=<endpoint> -e PORT=<port-int> <container-name>
```

Alternatively a Docker Compose may be used where after filling up the credentials in `docker-compose.yml`, we run: 

```
docker-compose up
```

**Step 7:** 
Visit localhost on the defined port, for e.g. if my `<port-ext>` is 5000, the API service is at http://localhost:5000/. 

## Running Steps (No Docker)
**Step 1:** Get your Lyve Cloud bucket credentials.   
Here's what you'll need:
* Access Key
* Secret key
* Endpoint URL
* Region

**Step 2:** 
Open up the Command Line Interface and navigate to the folder called `code/` from the current folder holding this README.md file. 

**Step 3:** Set environment variables for the following keys: 
-  AWS_SECRET_ACCESS_KEY: The secret key
-  AWS_ACCESS_KEY_ID: The access key
-  AWS_REGION: The cloud storage region
-  AWS_ENDPOINT: The cloud storage endpoint
-  PORT: The port number for the solution

**Step 4:** 
Run the following command to initialise the NPM modules needed:

```
npm install
```

**Step 5:** 
Run the following command to build the files for the SPA UI:

```
npm run build
```

**Step 6:** 
Run the following command to copy the UI into the main application: 

```
cp dist/ server/public/
```

**Step 7:** 
Run the files using the following command: 

```
npm run backend-devstart
```

**Step 8:** 
Visit localhost on the defined port, for e.g. if my `<port-ext>` is 5000, the API service is at http://localhost:5000/.  

## Results 
Video, Audio and Image can be streamed/retrieved when API endpoint is called using `<source>` element for video and audio, and `<img src>` element for image. 

## Tested by
* May 31, 2022: Hoo-dkwozD on MacOS 11.3.1 (arm64)

### Project Structure
This section will describe the representation of each of the folders or files in the structure.

```
.
├── README.md (video demo link here)
├── code
│   └── <source-codes>
├── documentation
│   └── API Docs.md
│   └── Seagate Lyve Cloud Hackathon_ Fast Stream.pdf
└── images
    └── FS-logo.png
```

### `/code`
This folder contains all the code files.

### `/documentation`
This folder contains the API documentation and presentation file.

### `/images`
This folder contains all the images for README.md.

## Attributions
Stock footage provided by Videvo, downloaded from [www.videvo.net](https://www.videvo.net/)
Stock audio provided by Anton Vlasov, downloaded from [www.pixabay.com](https://pixabay.com/)
Photo by Kier In Sight on [Unsplash](https://unsplash.com/photos/ioSyqyVQDdk?utm_source=unsplash&utm_medium=referral&utm_content=creditShareLink)
360 video icons created by Hazicon - [Flaticon](https://www.flaticon.com/free-icons/360-video)