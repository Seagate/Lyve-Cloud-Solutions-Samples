# Media Streaming Server Solution by The Water Cooler Team

[Powerpoint Presentation](https://docs.google.com/presentation/d/10wmty7K7HCv-a3p8OxNH3ZqIrVCZ4bPY/edit?usp=sharing&ouid=104961336018066608218&rtpof=true&sd=true)

[Video Link](https://youtu.be/Nk0SmgugNwU)

[Test Server](http://lyve-cloud-frontend.s3-website-ap-southeast-1.amazonaws.com/)

## Introduction

A middleware solution designed to stream videos stored in Lyve cloud bucket in real-time where users can anonymously access the content.

## Requirements

Details of your environment:

- Windows | Linux | MacOs Compatible
- Tested on NodeJS Version V14.16.1. But was compatible with lower or higher versions too.
- Npm Package Manager

## Known Limitations

Streaming will be interrupt when client's network becomes unstable

## Running Steps

The solution is in the branch of "watercooler".

**Step 1:** Get your Lyve Cloud bucket credentials.  
Here's what you'll need:

- Access Key
- Secret key
- Endpoint URL

**Step 2:**
Go to the folder "Media Streaming Server Solution > code". The related scripts to the meidleware and the client application is in this directory.

Go inside the Middleware folder.

Make a new file named ".env" in this directory. Fill up the variables accordingly.
Refer to below for example.

```bash
 ACCESS_KEY=
 SECRET_KEY=
 ENDPOINT_URL=s3.ap-southeast-1.lyvecloud.seagate.com
 REGION=ap-southeast-1
 AUDIT_LOGS_BUCKET=x-auditlogs
 NEW_BUCKET=x-media-files
```

NEW_BUCKET is the bucket that you should have to store the videos.

**Step 3:**
Install NPM Packages being in the same directory.

```bash
  npm install
```

**Step 4:**
Start the middleware

```bash
  npm start
```

**Step 5:**
Upload a video to Lyve Cloud Bucket. Remeber the key to the uploaded video. Lets assume the key is "cat.mp4". This key will be used in the latter part to discribe the rest. (Note: We have tested with .mp4 files)

**Step 6:**
Now that the server should be running successfuly on your computer. You will see a log saying "server started on port 4040" on the console.

This middleware providdes a api end point to use with client applications.

This api end point has the bellow format.

```bash
  http://<domain name>/api/videos/<video key>
```

here the domain name is localhost:4040 since if you are running on you local computer. The video key is "cat.mp4", since the uploaded video to the bucket is cat.mp4.(Refer the step 5)

So in our case the api end point should be as bellow;

```bash
  http://localhost:4040/api/videos/cat.mp4
```

**Step 7:**
You can use this api end point in a client application as the source to a html video element. (Note: Placing this api end point just on the browser address bar will not result the video streaming functionality).

## Additional Support

### Option 1

If you dont have a client application to test with, the bellow steps will guide you to create a simple client appliction quickly.

**Step 1:**

Create a file called "index.html" in the same directory which is same as the .env file we created. inside this file place the bellow code.

```bash
  <html>
    <body>
        <video src='<api end point to the middleware>" autoplay controls width="500" height="300"></video>
    </body>
</html>
```

**Step 2:**
Open this index.html in the browser, then you will see the cat.mp4 is streaming.

### Option 2

You can use the provided client application.
**Step 1:**
go to the previous directory; which is to the code folder. You will find a folder called front-end which contains a ReactJS based client application. In this section we are going to discuss how we can use this client application with the previously discussed middleware.

**Step 2:**
Go inside the front-end folder and install the related node modules.

```bash
  npm install
```

**Step 3:**
Start the front end application being inside this front-end folder.

```bash
  npm start
```

Thats it. Now you will see a client application on port 3000

### `/code`

This folder contains all the code files.

### `/documentation`

This folder contains the demo video and presentation file.

### `/images`

This folder contains all the images.
